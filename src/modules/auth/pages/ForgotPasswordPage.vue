<template>
  <main class="auth-page">
    <form
      v-if="step !== 'success'"
      class="auth-form"
      @submit.prevent="
        step === 'email'
          ? handleEmailSubmit()
          : step === 'code'
            ? handleCodeSubmit()
            : handlePasswordSubmit()
      "
    >
      <h1 class="auth-form__title">
        {{ step === 'email'
          ? 'Восстановление пароля'
          : step === 'code'
            ? 'Подтверждение почты'
            : 'Новый пароль'
        }}
      </h1>

      <!-- Шаг 1. Электронная почта -->
      <template v-if="step === 'email'">
        <p class="auth-form__description">
          Введите электронную почту, указанную при регистрации.
          Мы подготовим код подтверждения для восстановления доступа.
        </p>

        <label class="auth-form__field">
          <span>Электронная почта</span>
          <input
            v-model="email"
            type="email"
            placeholder="Введите электронную почту"
            autocomplete="email"
            required
          />
        </label>

        <button
          class="auth-form__button"
          type="submit"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Проверка...' : 'Продолжить' }}
        </button>
      </template>

      <!-- Шаг 2. Код подтверждения -->
      <template v-else-if="step === 'code'">
        <p class="auth-form__description">
          Введите шестизначный код для подтверждения электронной почты
          <strong>{{ email }}</strong>.
        </p>

        <p class="auth-form__demo-code">
          Демонстрационный код: <strong>{{ verificationCode }}</strong>
        </p>

        <label class="auth-form__field">
          <span>Код подтверждения</span>
          <input
            v-model="enteredCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="Введите 6 цифр"
            autocomplete="one-time-code"
            required
            @input="enteredCode = enteredCode.replace(/\D/g, '')"
          />
        </label>

        <p class="auth-form__timer">
          {{ remainingSeconds > 0
            ? `Код действителен ещё ${formatTime(remainingSeconds)}`
            : 'Срок действия кода истёк'
          }}
        </p>

        <button
          class="auth-form__button"
          type="submit"
          :disabled="enteredCode.length !== 6"
        >
          Подтвердить
        </button>

        <button
          class="auth-form__secondary-button"
          type="button"
          @click="resendVerificationCode"
        >
          Отправить код повторно
        </button>
      </template>

      <!-- Шаг 3. Новый пароль -->
      <template v-else>
        <p class="auth-form__description">
          Придумайте новый пароль для своего аккаунта.
        </p>

        <label class="auth-form__field">
          <span>Новый пароль</span>
          <input
            v-model="newPassword"
            type="password"
            placeholder="Введите новый пароль"
            autocomplete="new-password"
            required
          />
        </label>

        <label class="auth-form__field">
          <span>Повторите новый пароль</span>
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Повторите новый пароль"
            autocomplete="new-password"
            required
          />
        </label>

        <button
          class="auth-form__button"
          type="submit"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Сохранение...' : 'Сохранить пароль' }}
        </button>
      </template>

      <p v-if="errorMessage" class="auth-form__error">
        {{ errorMessage }}
      </p>
    </form>

    <!-- Успешное восстановление -->
    <section v-else class="auth-form">
      <h1 class="auth-form__title">Пароль изменён!</h1>

      <p class="auth-form__description">
        Вы успешно восстановили пароль. Теперь можете войти в свой аккаунт
        с новым паролем.
      </p>

      <RouterLink
        to="/login"
        class="auth-form__button auth-form__button--link"
      >
        Перейти ко входу
      </RouterLink>
    </section>
  </main>
</template>


<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

const step = ref<'email' | 'code' | 'password' | 'success'>('email');

const email = ref('');
const verificationCode = ref('');
const enteredCode = ref('');
const remainingSeconds = ref(120);
const timerId = ref<ReturnType<typeof setInterval> | null>(null);
const errorMessage = ref('');
const isLoading = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');

const authStore = useAuthStore();

const route = useRoute();
const router = useRouter();

const isProfileRecovery = computed(
  () => route.query.from === 'profile',
);

async function handleEmailSubmit(): Promise<void> {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await authStore.checkEmail(email.value);

    verificationCode.value = String(
    Math.floor(100000 + Math.random() * 900000),
    );

    enteredCode.value = '';
    remainingSeconds.value = 120;
    step.value = 'code';
    startTimer();
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Не удалось проверить электронную почту';
  } finally {
    isLoading.value = false;
  }
}

function startTimer(): void {
  if (timerId.value) {
    clearInterval(timerId.value);
  }

  timerId.value = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    } else if (timerId.value) {
      clearInterval(timerId.value);
      timerId.value = null;
    }
  }, 1000);
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

function handleCodeSubmit(): void {
  errorMessage.value = '';

  if (remainingSeconds.value <= 0) {
    errorMessage.value = 'Срок действия кода истёк. Запросите новый код.';
    return;
  }

  if (enteredCode.value !== verificationCode.value) {
    errorMessage.value = 'Неверный код подтверждения';
    return;
  }

  if (timerId.value) {
    clearInterval(timerId.value);
    timerId.value = null;
  }

  step.value = 'password';
}

function resendVerificationCode(): void {
  verificationCode.value = String(
    Math.floor(100000 + Math.random() * 900000),
  );

  enteredCode.value = '';
  errorMessage.value = '';
  remainingSeconds.value = 120;

  startTimer();
}

async function handlePasswordSubmit(): Promise<void> {
  errorMessage.value = '';

  if (!newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Заполните все поля';
    return;
  }

  if (newPassword.value.length < 6) {
    errorMessage.value =
      'Новый пароль должен содержать минимум 6 символов';
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Новые пароли не совпадают';
    return;
  }

  isLoading.value = true;

  try {
    await authStore.resetPassword(email.value, newPassword.value);
    step.value = 'success';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Не удалось восстановить пароль';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  if (!isProfileRecovery.value) {
    return;
  }

  if (!authStore.user) {
    router.replace('/login');
    return;
  }

  email.value = authStore.user.email;

  verificationCode.value = String(
    Math.floor(100000 + Math.random() * 900000),
  );

  enteredCode.value = '';
  step.value = 'code';
  startTimer();
});

onUnmounted(() => {
  if (timerId.value) {
    clearInterval(timerId.value);
  }
});
</script>


<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f5f6fa;
}

.auth-form {
  width: 100%;
  max-width: 430px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 36px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);

  &__title {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    line-height: 1.25;
    text-align: center;
    color: #20212a;
  }

  &__description {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #777987;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;

    span {
      font-size: 14px;
      font-weight: 600;
      color: #333542;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      padding: 14px 16px;
      border: 1px solid #e1e2e9;
      border-radius: 10px;
      outline: none;
      font: inherit;
      font-size: 14px;
      transition: border-color 0.2s;

      &:focus {
        border-color: #7664d8;
      }

      &::placeholder {
        color: #a6a7b0;
      }
    }
  }

  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 48px;
    padding: 12px 18px;
    border: none;
    border-radius: 10px;
    background: #7664d8;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s, opacity 0.2s;

    &:hover {
      background: #6552c5;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  &__secondary-button {
    padding: 8px;
    border: none;
    background: transparent;
    color: #7664d8;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      color: #6552c5;
    }
  }

  &__demo-code {
    margin: 0;
    padding: 14px;
    border-radius: 10px;
    background: #f3f0ff;
    color: #6552c5;
    font-size: 14px;
    text-align: center;
    letter-spacing: 0.5px;
  }

  &__timer {
    margin: -8px 0 0;
    color: #858694;
    font-size: 13px;
    text-align: center;
  }

  &__error {
    margin: 0;
    color: #e04b55;
    font-size: 13px;
    line-height: 1.4;
  }
}

@media (max-width: 480px) {
  .auth-form {
    padding: 26px 20px;

    &__title {
      font-size: 23px;
    }
  }
}
</style>
