<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import { computed, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const name = ref(authStore.user?.name ?? '');
const email = ref(authStore.user?.email ?? '');

const successMessage = ref('');
const errorMessage = ref('');

// Подтверждение изменений
const showVerificationModal = ref(false);
const verificationCode = ref('');
const enteredCode = ref('');
const remainingSeconds = ref(120);

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const pendingProfile = ref({
  name: '',
  email: '',
});

let verificationTimer: ReturnType<typeof setInterval> | undefined;

function startVerificationTimer(): void {
  if (verificationTimer) {
    clearInterval(verificationTimer);
  }

  remainingSeconds.value = 120;

  verificationTimer = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    }

    if (remainingSeconds.value === 0 && verificationTimer) {
      clearInterval(verificationTimer);
      verificationTimer = undefined;
    }
  }, 1000);
}

function resendVerificationCode(): void {
  verificationCode.value = String(
    Math.floor(100000 + Math.random() * 900000),
  );

  enteredCode.value = '';
  errorMessage.value = '';

  startVerificationTimer();
}

onUnmounted(() => {
  if (verificationTimer) {
    clearInterval(verificationTimer);
  }
});

async function handleSave(): Promise<void> {
  console.log('Кнопка сохранения нажата');
  successMessage.value = '';
  errorMessage.value = '';

  if (
    name.value === authStore.user?.name &&
    email.value === authStore.user?.email
  ) {
    successMessage.value = 'Изменения отсутствуют';
    return;
  }

  pendingProfile.value = {
    name: name.value,
    email: email.value,
  };

  verificationCode.value = String(
    Math.floor(100000 + Math.random() * 900000),
  );

  enteredCode.value = '';
  startVerificationTimer();
  showVerificationModal.value = true;
  console.log('Модальное окно:', showVerificationModal.value);
console.log('Код подтверждения:', verificationCode.value);
}

function closeVerificationModal(): void {
  showVerificationModal.value = false;
  enteredCode.value = '';
  verificationCode.value = '';
  remainingSeconds.value = 120;

  if (verificationTimer) {
    clearInterval(verificationTimer);
    verificationTimer = undefined;
  }
}

async function confirmProfileChanges(): Promise<void> {
  if (remainingSeconds.value <= 0) {
    errorMessage.value = 'Срок действия кода истёк. Запросите новый код.';
    return;
  }

  if (enteredCode.value !== verificationCode.value) {
    errorMessage.value = 'Неверный код подтверждения';
    return;
  }

  errorMessage.value = '';

  try {
    await authStore.updateProfile(pendingProfile.value);

    successMessage.value = 'Изменения успешно сохранены';
    closeVerificationModal();
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Не удалось сохранить изменения';

    closeVerificationModal();
  }
}
</script>

<template>
  <main class="account-page">
    <div class="account-page__content">
      <header class="page-header">
        <button
          class="page-header__back"
          type="button"
          aria-label="Назад"
          @click="router.push('/profile')"
        >
          <ChevronLeft :size="20" :stroke-width="2.5" />
        </button>

        <h1 class="page-header__title">Аккаунт</h1>
      </header>

      <form class="account-form" @submit.prevent="handleSave">
        <label class="account-form__field">
          <span>Имя</span>
          <input
            v-model.trim="name"
            type="text"
            placeholder="Введите имя"
            autocomplete="name"
            required
          />
        </label>

        <label class="account-form__field">
          <span>Email</span>
          <input
            v-model.trim="email"
            type="email"
            placeholder="Введите почту"
            autocomplete="email"
            required
          />
        </label>

        <p
          v-if="successMessage"
          class="account-form__message account-form__message--success"
        >
          {{ successMessage }}
        </p>

        <p
          v-if="errorMessage"
          class="account-form__message account-form__message--error"
        >
          {{ errorMessage }}
        </p>

        <button
          class="account-form__submit"
          type="submit"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? 'Сохранение...' : 'Сохранить изменения' }}
        </button>
      </form>
    </div>
  </main>

  <Transition name="verification">
    <div
      v-if="showVerificationModal"
      class="verification-overlay"
      @click.self="closeVerificationModal"
    >
      <section
        class="verification-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-title"
      >
        <button
          type="button"
          class="verification-modal__close"
          aria-label="Закрыть"
          @click="closeVerificationModal"
        >
          ×
        </button>

        <div class="verification-modal__icon">
          <icon name="mail-check" />
        </div>

        <h2 id="verification-title">
          Подтверждение изменений
        </h2>

        <p class="verification-modal__description">
          Введите шестизначный код подтверждения.
        </p>

        <div class="verification-modal__demo">
          <span>Демонстрационный код:</span>
          <strong>{{ verificationCode }}</strong>
        </div>

        <input
          v-model="enteredCode"
          class="verification-modal__input"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="000000"
          autocomplete="one-time-code"
          @input="enteredCode = enteredCode.replace(/\D/g, '')"
        />

        <p
          v-if="errorMessage"
          class="verification-modal__error"
        >
          {{ errorMessage }}
        </p>

        <p class="verification-modal__timer">
          Код действителен ещё {{ formattedTime }}
        </p>

        <button
          v-if="remainingSeconds === 0"
          type="button"
          class="verification-modal__resend"
          @click="resendVerificationCode"
        >
          Получить новый код
        </button>

        <button
          type="button"
          class="verification-modal__submit"
          :disabled="enteredCode.length !== 6 || authStore.isLoading"
          @click="confirmProfileChanges"
        >
          {{ authStore.isLoading ? 'Сохраняем...' : 'Подтвердить' }}
        </button>

        <button
          type="button"
          class="verification-modal__cancel"
          @click="closeVerificationModal"
        >
          Отмена
        </button>
      </section>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.account-page {
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
  margin-bottom: 36px;

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

.account-form {
  display: flex;
  flex-direction: column;
  gap: 22px;

  &__field {
    display: flex;
    flex-direction: column;
    gap: 9px;
    font-size: 14px;
    font-weight: 500;

    input {
      width: 100%;
      min-height: 52px;
      padding: 0 16px;
      border: 1px solid #e2e2e2;
      border-radius: 10px;
      outline: none;
      background: #fff;
      color: #222;
      font: inherit;
      font-weight: 400;

      &:focus {
        border-color: #888;
      }
    }
  }

  &__message {
    margin: -6px 0 0;
    font-size: 14px;

    &--success {
      color: #27864b;
    }

    &--error {
      color: #d43c3c;
    }
  }

  &__submit {
    min-height: 52px;
    margin-top: 8px;
    border: none;
    border-radius: 10px;
    background: #222;
    color: #fff;
    font: inherit;
    font-weight: 500;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.verification-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(5px);
}

.verification-modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 32px;
  border-radius: 20px;
  background: #fff;
  color: #171717;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.verification-modal__close {
  position: absolute;
  top: 14px;
  right: 16px;
  border: none;
  background: none;
  font-size: 26px;
  cursor: pointer;
}

.verification-modal__icon {
  margin-bottom: 16px;
  font-size: 36px;
}

.verification-modal h2 {
  margin-bottom: 10px;
  font-size: 22px;
}

.verification-modal__description {
  margin-bottom: 20px;
  color: #777;
}

.verification-modal__demo {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 14px;
  border-radius: 12px;
  background: #f2f2f2;
}

.verification-modal__demo strong {
  font-size: 28px;
  letter-spacing: 6px;
}

.verification-modal__input {
  width: 100%;
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 22px;
  text-align: center;
  letter-spacing: 8px;
}

.verification-modal__timer,
.verification-modal__error {
  margin-top: 14px;
  font-size: 14px;
}

.verification-modal__error {
  color: #d33;
}

.verification-modal__submit,
.verification-modal__cancel,
.verification-modal__resend {
  width: 100%;
  margin-top: 14px;
  padding: 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.verification-modal__submit {
  background: #171717;
  color: #fff;
}

.verification-modal__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.verification-modal__cancel,
.verification-modal__resend {
  background: #f1f1f1;
  color: #171717;
}
</style>
