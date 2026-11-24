<script setup lang="ts">
import { ChevronLeft, Plus, Trash2 } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { bankCardApi, orderApi, paymentApi } from '@/services/mock-api';
import { useAuthStore } from '@/stores/auth';
import type { BankCard, Order, Payment } from '@/types';

const router = useRouter();
const authStore = useAuthStore();

const cards = ref<BankCard[]>([]);
const payments = ref<Payment[]>([]);
const orders = ref<Order[]>([]);

const isLoading = ref(true);
const isAddingCard = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const bankName = ref('');
const holderName = ref('');
const cardNumber = ref('');
const expiryDate = ref('');

const userOrderIds = computed(
  () => new Set(orders.value.map((order) => order.id)),
);

const transactions = computed(() =>
  payments.value
    .filter((payment) => userOrderIds.value.has(payment.orderId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    ),
);

onMounted(async () => {
  if (!authStore.user) {
    isLoading.value = false;
    return;
  }

  try {
    const [loadedCards, loadedPayments, loadedOrders] = await Promise.all([
      bankCardApi.getAll(authStore.user.id),
      paymentApi.getAll(),
      orderApi.getByUserId(authStore.user.id),
    ]);

    cards.value = loadedCards;
    payments.value = loadedPayments;
    orders.value = loadedOrders;
  } catch {
    errorMessage.value = 'Не удалось загрузить финансовые данные';
  } finally {
    isLoading.value = false;
  }
});

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatAmount(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

function getPaymentStatus(status: Payment['status']): string {
  const statuses: Record<Payment['status'], string> = {
    pending: 'В обработке',
    success: 'Успешно',
    failed: 'Ошибка',
    cancelled: 'Отменено',
  };

  return statuses[status];
}

function getPaymentMethod(method: Payment['method']): string {
  return method === 'bank-card' ? 'Банковская карта' : 'Пушкинская карта';
}

async function handleAddCard(): Promise<void> {
  errorMessage.value = '';
  successMessage.value = '';

  if (!bankName.value.trim() || !holderName.value.trim()) {
    errorMessage.value = 'Заполните все поля';
    return;
  }

  isSaving.value = true;

  try {
    const card = await bankCardApi.add(authStore.user.id, {
      bankName: bankName.value,
      holderName: holderName.value,
      cardNumber: cardNumber.value,
      expiryDate: expiryDate.value,
    });

    cards.value.push(card);

    bankName.value = '';
    holderName.value = '';
    cardNumber.value = '';
    expiryDate.value = '';

    isAddingCard.value = false;
    successMessage.value = 'Карта успешно добавлена';
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Не удалось добавить карту';
  } finally {
    isSaving.value = false;
  }
}

async function handleRemoveCard(cardId: string): Promise<void> {
  if (!authStore.user) return;

  await bankCardApi.remove(cardId, authStore.user.id);

  cards.value = cards.value.filter((card) => card.id !== cardId);
}
</script>

<template>
  <main class="finances-page">
    <div class="finances-page__content">
      <header class="page-header">
        <button
          class="page-header__back"
          type="button"
          aria-label="Назад"
          @click="router.push('/profile')"
        >
          <ChevronLeft :size="20" :stroke-width="2.5" />
        </button>

        <h1 class="page-header__title">Финансы</h1>
      </header>

      <section class="cards-section">
        <div class="section-heading">
          <h2>Мои карты</h2>
          <span>{{ cards.length }}</span>
        </div>

        <div v-if="cards.length" class="cards-list">
          <article
            v-for="(card, index) in cards"
            :key="card.id"
            class="bank-card"
            :class="`bank-card--${index % 3}`"
          >
            <div class="bank-card__top">
              <span class="bank-card__bank">{{ card.bankName }}</span>
              <span class="bank-card__chip" aria-hidden="true">
                <svg viewBox="0 0 38 28" width="38" height="28">
                  <rect
                    x="1"
                    y="1"
                    width="36"
                    height="26"
                    rx="5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <path d="M13 1V27M25 1V27M1 14H37" stroke="currentColor" opacity=".7" />
                </svg>
              </span>
            </div>

            <div class="bank-card__number">
              •••• •••• •••• {{ card.lastFourDigits }}
            </div>

            <div class="bank-card__bottom">
              <div>
                <span class="bank-card__caption">ВЛАДЕЛЕЦ КАРТЫ</span>
                <span class="bank-card__value">{{ card.holderName }}</span>
              </div>

              <div>
                <span class="bank-card__caption">ДЕЙСТВУЕТ ДО</span>
                <span class="bank-card__value">{{ card.expiryDate }}</span>
              </div>
            </div>

            <button
              class="bank-card__remove"
              type="button"
              aria-label="Удалить карту"
              @click="handleRemoveCard(card.id)"
            >
              <Trash2 :size="16" />
            </button>
          </article>
        </div>

        <p v-else class="cards-section__empty">
          У вас пока нет добавленных карт
        </p>

        <button
          v-if="!isAddingCard"
          class="add-card-button"
          type="button"
          @click="isAddingCard = true"
        >
          <Plus :size="20" />
          Добавить карту
        </button>

        <form
          v-else
          class="add-card-form"
          @submit.prevent="handleAddCard"
        >
          <h3>Новая карта</h3>

          <label>
            Название банка
            <input
              v-model.trim="bankName"
              type="text"
              placeholder="Например, Сбербанк"
              required
            />
          </label>

          <label>
            Номер карты
            <input
              v-model="cardNumber"
              type="text"
              inputmode="numeric"
              autocomplete="cc-number"
              placeholder="0000 0000 0000 0000"
              maxlength="23"
              required
            />
          </label>

          <label>
            Имя владельца
            <input
              v-model.trim="holderName"
              type="text"
              autocomplete="cc-name"
              placeholder="IVAN IVANOV"
              required
            />
          </label>

          <label>
            Срок действия
            <input
              v-model="expiryDate"
              type="text"
              placeholder="ММ/ГГ"
              maxlength="5"
              required
            />
          </label>

          <div class="add-card-form__actions">
            <button
              class="add-card-form__cancel"
              type="button"
              @click="isAddingCard = false"
            >
              Отмена
            </button>

            <button
              class="add-card-form__submit"
              type="submit"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Добавление...' : 'Добавить' }}
            </button>
          </div>
        </form>

        <p v-if="successMessage" class="message message--success">
          {{ successMessage }}
        </p>

        <p v-if="errorMessage" class="message message--error">
          {{ errorMessage }}
        </p>
      </section>

      <section class="transactions-section">
        <h2>История транзакций</h2>

        <p v-if="isLoading" class="transactions-section__empty">
          Загрузка...
        </p>

        <p
          v-else-if="!transactions.length"
          class="transactions-section__empty"
        >
          Пока нет транзакций
        </p>

        <div v-else class="transactions-list">
          <article
            v-for="payment in transactions"
            :key="payment.id"
            class="transaction"
          >
            <div class="transaction__info">
              <span class="transaction__title">Оплата билетов</span>
              <span class="transaction__method">
                {{ getPaymentMethod(payment.method) }}
              </span>
              <span class="transaction__date">
                {{ formatDate(payment.createdAt) }}
              </span>
            </div>

            <div class="transaction__result">
              <span class="transaction__amount">
                {{ formatAmount(payment.amount) }}
              </span>
              <span
                class="transaction__status"
                :class="`transaction__status--${payment.status}`"
              >
                {{ getPaymentStatus(payment.status) }}
              </span>
            </div>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss">
.finances-page {
  min-height: 100vh;
  padding: 24px 20px 40px;

  &__content {
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
  }
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;

  &__back {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 45px;
    height: 45px;
    padding: 0;
    border: none;
    border-radius: 12px;
    background: #f2f2f2;
    color: #222;
    cursor: pointer;
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 19px;
  }

  span {
    color: #888;
    font-size: 14px;
  }
}

.cards-list {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 2px 2px 14px;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
}

.bank-card {
  position: relative;
  display: flex;
  flex: 0 0 290px;
  flex-direction: column;
  justify-content: space-between;
  min-height: 176px;
  padding: 20px;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(135deg, #303b55, #171d2d);
  color: #fff;
  scroll-snap-align: start;

  &--1 {
    background: linear-gradient(135deg, #386a65, #173d3a);
  }

  &--2 {
    background: linear-gradient(135deg, #74534d, #392d39);
  }

  &__top,
  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__bank {
    font-size: 16px;
    font-weight: 600;
  }

  &__chip {
    opacity: 0.8;
  }

  &__number {
    margin-top: 14px;
    font-size: 18px;
    letter-spacing: 1.5px;
  }

  &__bottom {
    align-items: flex-end;

    > div {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
  }

  &__caption {
    color: rgb(255 255 255 / 60%);
    font-size: 8px;
    letter-spacing: 0.8px;
  }

  &__value {
    font-size: 11px;
    font-weight: 500;
  }

  &__remove {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 50%;
    background: rgb(255 255 255 / 15%);
    color: #fff;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover &__remove {
    opacity: 1;
  }
}

.cards-section__empty,
.transactions-section__empty {
  margin: 0 0 16px;
  color: #888;
  font-size: 14px;
}

.add-card-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 50px;
  border: 1px dashed #c9c9c9;
  border-radius: 12px;
  background: transparent;
  color: #333;
  font: inherit;
  cursor: pointer;
}

.add-card-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border: 1px solid #e5e5e5;
  border-radius: 14px;

  h3 {
    margin: 0;
    font-size: 18px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 7px;
    font-size: 13px;
    font-weight: 500;
  }

  input {
    min-height: 46px;
    padding: 0 12px;
    border: 1px solid #ddd;
    border-radius: 9px;
    outline: none;
    font: inherit;
    font-weight: 400;

    &:focus {
      border-color: #888;
    }
  }

  &__actions {
    display: flex;
    gap: 10px;
  }

  &__actions button {
    flex: 1;
    min-height: 44px;
    border: none;
    border-radius: 9px;
    font: inherit;
    cursor: pointer;
  }

  &__cancel {
    background: #eee;
    color: #222;
  }

  &__submit {
    background: #222;
    color: #fff;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.message {
  margin: 12px 0 0;
  font-size: 13px;

  &--success {
    color: #27864b;
  }

  &--error {
    color: #d43c3c;
  }
}

.transactions-section {
  margin-top: 38px;

  h2 {
    margin: 0 0 18px;
    font-size: 19px;
  }
}

.transactions-list {
  display: flex;
  flex-direction: column;
}

.transaction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #eee;

  &__info,
  &__result {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
  }

  &__method,
  &__date {
    color: #888;
    font-size: 12px;
  }

  &__result {
    align-items: flex-end;
    text-align: right;
  }

  &__amount {
    font-size: 14px;
    font-weight: 600;
  }

  &__status {
    font-size: 12px;

    &--success {
      color: #27864b;
    }

    &--failed,
    &--cancelled {
      color: #d43c3c;
    }

    &--pending {
      color: #a07824;
    }
  }
}

@media (hover: none) {
  .bank-card__remove {
    opacity: 1;
  }
}
</style>
