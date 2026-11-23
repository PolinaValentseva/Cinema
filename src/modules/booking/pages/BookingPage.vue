
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import { usePaymentStore } from '@/stores/payment';
import { useSeatsStore } from '@/stores/seats';
import { useSessionsStore } from '@/stores/sessions';

import type { PaymentMethod } from '@/types';

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const sessionsStore = useSessionsStore();
const seatsStore = useSeatsStore();
const paymentStore = usePaymentStore();

const showPaymentPanel = ref(false);
const paymentResult = ref<'success' | 'error' | null>(null);

const selectedPaymentMethod = ref<PaymentMethod>('bank-card');

const seatRows = computed(() => {
  const rows = new Map<number, typeof seatsStore.seats>();

  for (const item of seatsStore.seats) {
    const row = item.seat.row;

    if (!rows.has(row)) {
      rows.set(row, []);
    }

    rows.get(row)!.push(item);
  }

  return Array.from(rows.entries())
    .sort(([a], [b]) => a - b)
    .map(([, seats]) =>
      [...seats].sort((a, b) => a.seat.number - b.seat.number),
    );
});

const totalPrice = computed(() => {
  const session = sessionsStore.currentSession;

  if (!session) {
    return 0;
  }

  return seatsStore.selectedSeats.length * session.price;
});

const canPay = computed(
  () =>
    seatsStore.selectedSeats.length > 0 &&
    !paymentStore.isLoading,
);

function formatSessionDate(date: string): string {
  return new Date(date).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function openPaymentPanel(): void {
  paymentResult.value = null;
  paymentStore.reset();
  showPaymentPanel.value = true;
}

function closePaymentPanel(): void {
  if (paymentStore.isLoading) {
    return;
  }

  showPaymentPanel.value = false;
}

async function handlePayment(): Promise<void> {
  const userId = authStore.user?.id;
  const session = sessionsStore.currentSession;
  const selectedSeats = seatsStore.selectedSeats;

  if (!userId || !session || selectedSeats.length === 0) {
    return;
  }

  showPaymentPanel.value = false;
  paymentResult.value = null;

  try {
    await paymentStore.checkout({
      userId,
      sessionId: session.id,
      seatIds: selectedSeats.map((seat) => seat.id),
      totalPrice: totalPrice.value,
      method: selectedPaymentMethod.value,
    });

    paymentResult.value = 'success';
    seatsStore.clearSelection();
  } catch {
    paymentResult.value = 'error';
  }
}

function retryPayment(): void {
  paymentStore.reset();
  paymentResult.value = null;
  showPaymentPanel.value = true;
}

function goToTickets(): void {
  router.push({ name: 'tickets' });
}

watch(
  () => route.params.sessionId,
  async (sessionId) => {
    const id = String(sessionId);

    paymentStore.reset();
    paymentResult.value = null;
    showPaymentPanel.value = false;

    try {
      await Promise.all([
        sessionsStore.fetchSessionById(id),
        seatsStore.fetchSeats(id),
      ]);
    } catch {
      // Ошибки отображаются на странице.
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="booking-page">
    <div class="booking-page__container">
      <h1>Выбор мест</h1>

      <p
        v-if="sessionsStore.isLoading || seatsStore.isLoading"
        class="booking-page__message"
      >
        Загружаем информацию о сеансе...
      </p>

      <template v-else-if="sessionsStore.currentSession">
        <section class="booking-info">
          <h2>Информация о сеансе</h2>

          <p>
            Дата и время:
            {{ formatSessionDate(sessionsStore.currentSession.startsAt) }}
          </p>

          <p>
            Стоимость одного места:
            {{ sessionsStore.currentSession.price }} ₽
          </p>
        </section>

        <section class="seat-selection">
          <h2>Выберите места</h2>

          <div class="seat-selection__legend">
            <div class="legend-item">
              <span class="legend-item__seat legend-item__seat--available"></span>
              Свободно
            </div>

            <div class="legend-item">
              <span class="legend-item__seat legend-item__seat--selected"></span>
              Выбрано
            </div>

            <div class="legend-item">
              <span class="legend-item__seat legend-item__seat--occupied"></span>
              Занято
            </div>
          </div>

          <div class="cinema-scheme">
            <div class="cinema-scheme__screen">
              ЭКРАН
            </div>

            <div class="cinema-scheme__rows">
              <div
                v-for="(row, rowIndex) in seatRows"
                :key="rowIndex"
                class="cinema-scheme__row"
              >
                <span class="cinema-scheme__row-number">
                  {{ rowIndex + 1 }}
                </span>

                <button
                  v-for="item in row"
                  :key="item.seat.id"
                  type="button"
                  class="seat"
                  :class="{
                    'seat--occupied': item.status === 'occupied',
                    'seat--selected': seatsStore.isSelected(item.seat.id),
                  }"
                  :disabled="
                    item.status === 'occupied' || paymentStore.isLoading
                  "
                  :aria-label="`Ряд ${item.seat.row}, место ${item.seat.number}`"
                  @click="seatsStore.toggleSeat(item.seat.id)"
                >
                  {{ item.seat.number }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="booking-summary">
          <div>
            <h2>Ваш заказ</h2>

            <p v-if="seatsStore.selectedSeats.length === 0">
              Вы пока не выбрали места.
            </p>

            <template v-else>
              <p>
                Выбрано мест:
                {{ seatsStore.selectedSeats.length }}
              </p>

              <p>
                <span
                  v-for="seat in seatsStore.selectedSeats"
                  :key="seat.id"
                  class="booking-summary__seat"
                >
                  {{ seat.row }} ряд, {{ seat.number }} место
                </span>
              </p>
            </template>
          </div>

          <div class="booking-summary__payment">
            <div class="booking-summary__total">
              <span>Итого:</span>
              <strong>{{ totalPrice }} ₽</strong>
            </div>

            <button
              type="button"
              class="booking-summary__pay-button"
              :disabled="!canPay"
              @click="openPaymentPanel"
            >
              Оплатить
            </button>
          </div>
        </section>
      </template>

      <p
        v-else-if="sessionsStore.error || seatsStore.error"
        class="booking-page__error"
      >
        {{ sessionsStore.error || seatsStore.error }}
      </p>

      <p v-else class="booking-page__message">
        Сеанс не найден.
      </p>
    </div>

    <!-- Затемнение и нижняя панель выбора оплаты -->
    <Transition name="payment-overlay">
      <div
        v-if="showPaymentPanel"
        class="payment-overlay"
        @click.self="closePaymentPanel"
      >
        <Transition name="payment-sheet" appear>
          <section
            class="payment-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
          >
            <div class="payment-sheet__handle"></div>

            <div class="payment-sheet__header">
              <h2 id="payment-title">Способ оплаты</h2>

              <button
                type="button"
                class="payment-sheet__close"
                aria-label="Закрыть"
                :disabled="paymentStore.isLoading"
                @click="closePaymentPanel"
              >
                ×
              </button>
            </div>

            <div class="payment-methods">
              <button
                type="button"
                class="payment-method"
                :class="{
                  'payment-method--selected':
                    selectedPaymentMethod === 'bank-card',
                }"
                :aria-pressed="selectedPaymentMethod === 'bank-card'"
                @click="selectedPaymentMethod = 'bank-card'"
              >
                <span class="payment-method__icon">
                  <icon name="credit-card" />
                </span>

                <span class="payment-method__content">
                  <strong>Банковская карта</strong>
                  <span>Оплата банковской картой</span>
                </span>

                <span class="payment-method__radio"></span>
              </button>

              <button
                type="button"
                class="payment-method"
                :class="{
                  'payment-method--selected':
                    selectedPaymentMethod === 'pushkin-card',
                }"
                :aria-pressed="selectedPaymentMethod === 'pushkin-card'"
                @click="selectedPaymentMethod = 'pushkin-card'"
              >
                <span class="payment-method__icon">
                  <icon name="landmark" />
                </span>

                <span class="payment-method__content">
                  <strong>Пушкинская карта</strong>
                  <span>Оплата Пушкинской картой</span>
                </span>

                <span class="payment-method__radio"></span>
              </button>
            </div>

            <button
              type="button"
              class="payment-sheet__add-method"
            >
              + Добавить другой способ оплаты
            </button>

            <div class="payment-sheet__footer">
              <div class="payment-sheet__total">
                <span>К оплате</span>
                <strong>{{ totalPrice }} ₽</strong>
              </div>

              <button
                type="button"
                class="payment-sheet__pay-button"
                :disabled="paymentStore.isLoading"
                @click="handlePayment"
              >
                <template v-if="paymentStore.isLoading">
                  Обрабатываем оплату...
                </template>
                <template v-else>
                  Оплатить
                </template>
              </button>
            </div>
          </section>
        </Transition>
      </div>
    </Transition>

    <!-- Результат оплаты -->
    <Transition name="payment-overlay">
      <div
        v-if="paymentResult"
        class="payment-overlay"
      >
        <section
          class="payment-result"
          role="alertdialog"
          aria-modal="true"
        >
          <template v-if="paymentResult === 'success'">
            <div class="payment-result__icon payment-result__icon--success">
              <icon name="check" size="2xl" />
            </div>

            <h2>Оплата прошла успешно!</h2>

            <p>
              Билеты оформлены. Теперь они доступны в разделе «Мои билеты».
            </p>

            <button
              type="button"
              class="payment-result__button"
              @click="goToTickets"
            >
              Перейти к моим билетам
            </button>
          </template>

          <template v-else>
            <div class="payment-result__icon payment-result__icon--error">
              <icon name="x" size="2xl" />
            </div>

            <h2>Ошибка</h2>

            <p>
              {{ paymentStore.error || 'Не удалось выполнить оплату. Попробуйте ещё раз.' }}
            </p>

            <button
              type="button"
              class="payment-result__button"
              @click="retryPayment"
            >
              Перейти к оформлению заказа
            </button>
          </template>
        </section>
      </div>
    </Transition>
  </main>
</template>

<style scoped lang="scss">
.booking-page {
  padding: 40px 20px;

  &__container {
    max-width: 1000px;
    margin: 0 auto;
  }

  h1 {
    margin: 0 0 32px;
  }

  &__message {
    color: #666;
  }

  &__error {
    color: #d33;
  }
}

.booking-info {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 10px;

  h2 {
    margin: 0 0 16px;
  }

  p {
    margin: 8px 0;
  }
}

.seat-selection {
  margin-bottom: 40px;

  h2 {
    margin: 0 0 24px;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-bottom: 32px;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;

  &__seat {
    width: 18px;
    height: 18px;
    border: 1px solid #aaa;
    border-radius: 5px;

    &--available {
      background: #fff;
    }

    &--selected {
      background: #268b52;
      border-color: #268b52;
    }

    &--occupied {
      background: #aaa;
      border-color: #aaa;
    }
  }
}

.cinema-scheme {
  overflow-x: auto;
  padding: 24px 12px;
  border: 1px solid #ddd;
  border-radius: 12px;

  &__screen {
    max-width: 600px;
    margin: 0 auto 48px;
    padding: 12px;
    border-radius: 50% 50% 8px 8px / 100% 100% 8px 8px;
    background: #e5e5e5;
    text-align: center;
    font-size: 13px;
    letter-spacing: 4px;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: max-content;
    margin: 0 auto;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__row-number {
    width: 20px;
    color: #888;
    font-size: 12px;
    text-align: center;
  }
}

.seat {
  width: 38px;
  height: 38px;
  border: 1px solid #aaa;
  border-radius: 8px 8px 4px 4px;
  background: #fff;
  color: #222;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover:not(:disabled) {
    border-color: #268b52;
  }

  &:disabled {
    background: #aaa;
    border-color: #aaa;
    color: #fff;
    cursor: not-allowed;
  }

  &--selected {
    background: #268b52;
    border-color: #268b52;
    color: #fff;
  }
}

.booking-summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 10px;

  h2 {
    margin: 0 0 16px;
  }

  p {
    margin: 8px 0;
  }

  &__seat {
    display: inline-block;
    margin: 0 8px 8px 0;
    padding: 6px 10px;
    border-radius: 6px;
    background: #eee;
    font-size: 13px;
  }

  &__payment {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 16px;
  }

  &__total {
    display: flex;
    flex-direction: column;
    gap: 8px;
    white-space: nowrap;

    strong {
      font-size: 24px;
    }
  }

  &__pay-button {
    min-width: 180px;
    padding: 13px 24px;
    border: none;
    border-radius: 8px;
    background: #268b52;
    color: #fff;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
      background: #aaa;
      cursor: not-allowed;
    }
  }
}

/* Нижняя панель оплаты */

.payment-overlay {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-top: 24px;
  background: rgb(0 0 0 / 45%);
}

.payment-sheet {
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  padding: 12px 28px 28px;
  border-radius: 20px 20px 0 0;
  background: #fff;
  color: #222;

  &__handle {
    width: 42px;
    height: 5px;
    margin: 0 auto 24px;
    border-radius: 10px;
    background: #ccc;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 22px;
    }
  }

  &__close {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: #f1f1f1;
    font-size: 24px;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__add-method {
    width: 100%;
    margin: 20px 0;
    padding: 14px;
    border: 1px dashed #aaa;
    border-radius: 10px;
    background: transparent;
    color: #555;
    cursor: pointer;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }

  &__total {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #666;

    strong {
      color: #222;
      font-size: 24px;
    }
  }

  &__pay-button {
    min-width: 180px;
    padding: 14px 24px;
    border: none;
    border-radius: 8px;
    background: #268b52;
    color: #fff;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: wait;
    }
  }
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &--selected {
    border-color: #268b52;
    background: #f3faf6;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: #f1f1f1;
    font-size: 22px;
  }

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 5px;

    span {
      color: #777;
      font-size: 13px;
    }
  }

  &__radio {
    width: 20px;
    height: 20px;
    border: 2px solid #aaa;
    border-radius: 50%;
  }

  &--selected &__radio {
    border: 6px solid #268b52;
  }
}

/* Результат оплаты */

.payment-result {
  width: calc(100% - 32px);
  max-width: 440px;
  margin: auto;
  padding: 32px 24px;
  border-radius: 16px;
  background: #fff;
  text-align: center;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    border-radius: 50%;
    font-size: 30px;

    &--success {
      background: #e6f5ec;
      color: #268b52;
    }

    &--error {
      background: #fdeaea;
      color: #d33;
    }
  }

  h2 {
    margin: 0 0 12px;
  }

  p {
    margin: 0 0 24px;
    color: #666;
    line-height: 1.5;
  }

  &__button {
    width: 100%;
    padding: 14px 20px;
    border: none;
    border-radius: 8px;
    background: #268b52;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
}

/* Анимации */

.payment-overlay-enter-active,
.payment-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.payment-overlay-enter-from,
.payment-overlay-leave-to {
  opacity: 0;
}

.payment-sheet-enter-active,
.payment-sheet-leave-active {
  transition: transform 0.3s ease;
}

.payment-sheet-enter-from,
.payment-sheet-leave-to {
  transform: translateY(100%);
}

@media (max-width: 600px) {
  .booking-summary {
    flex-direction: column;

    &__payment {
      width: 100%;
      align-items: stretch;
    }

    &__pay-button {
      width: 100%;
    }
  }

  .seat {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }

  .cinema-scheme__row {
    gap: 5px;
  }

  .payment-sheet {
    padding-right: 20px;
    padding-left: 20px;

    &__footer {
      flex-direction: column;
      align-items: stretch;
    }

    &__pay-button {
      width: 100%;
    }
  }
}
</style>
