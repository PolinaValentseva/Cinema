
<script setup lang="ts">
import { ChevronLeft, Eye, EyeOff, MailCheck } from 'lucide-vue-next';
import { computed, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const successMessage = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

// Подтверждение смены пароля
const showVerificationModal = ref(false);
const verificationCode = ref('');
const enteredCode = ref('');
const remainingSeconds = ref(120);

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

onUnmounted(() => {
  if (verificationTimer) {
    clearInterval(verificationTimer);
  }
});

async function handleSubmit(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Заполните все поля';
    return;
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Новый пароль должен содержать минимум 6 символов';
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Новые пароли не совпадают';
    return;
  }

  if (currentPassword.value === newPassword.value) {
    errorMessage.value = 'Новый пароль должен отличаться от текущего';
    return;
  }

  verificationCode.value = String(
    Math.floor(100000 + Math.random() * 900000),
  );

  enteredCode.value = '';
  startVerificationTimer();
  showVerificationModal.value = true;
}

async function confirmPasswordChange(): Promise<void> {
  if (remainingSeconds.value <= 0) {
    errorMessage.value = 'Срок действия кода истёк. Запросите новый код.';
    return;
  }

  if (enteredCode.value !== verificationCode.value) {
    errorMessage.value = 'Неверный код подтверждения';
    return;
  }

  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await authStore.changePassword(
      currentPassword.value,
      newPassword.value,
    );

    successMessage.value = 'Пароль успешно изменён';

    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';

    closeVerificationModal();
  } catch (err) {
    errorMessage.value =
      err instanceof Error
        ? err.message
        : 'Не удалось изменить пароль';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="password-page">
    <header class="page-header">
      <button
        class="back-button"
        type="button"
        aria-label="Вернуться в профиль"
        @click="router.push('/profile')"
      >
        <ChevronLeft :size="25" :stroke-width="2.5" />
      </button>

      <h1 class="page-title">Пароль</h1>
    </header>

    <form class="password-form" @submit.prevent="handleSubmit">
      <div class="form-field">
        <label for="current-password">Текущий пароль</label>

        <div class="password-input">
          <input
            id="current-password"
            v-model="currentPassword"
            :type="showCurrentPassword ? 'text' : 'password'"
            placeholder="Введите текущий пароль"
            autocomplete="current-password"
          />

          <button
            type="button"
            class="visibility-button"
            :aria-label="showCurrentPassword ? 'Скрыть пароль' : 'Показать пароль'"
            @click="showCurrentPassword = !showCurrentPassword"
          >
            <EyeOff v-if="showCurrentPassword" :size="20" />
            <Eye v-else :size="20" />
          </button>
        </div>
      </div>

      <div class="form-field">
        <label for="new-password">Новый пароль</label>

        <div class="password-input">
          <input
            id="new-password"
            v-model="newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            placeholder="Введите новый пароль"
            autocomplete="new-password"
          />

          <button
            type="button"
            class="visibility-button"
            :aria-label="showNewPassword ? 'Скрыть пароль' : 'Показать пароль'"
            @click="showNewPassword = !showNewPassword"
          >
            <EyeOff v-if="showNewPassword" :size="20" />
            <Eye v-else :size="20" />
          </button>
        </div>

        <span class="field-hint">Минимум 6 символов</span>
      </div>

      <div class="form-field">
        <label for="confirm-password">Подтверждение нового пароля</label>

        <div class="password-input">
          <input
            id="confirm-password"
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Повторите новый пароль"
            autocomplete="new-password"
          />

          <button
            type="button"
            class="visibility-button"
            :aria-label="showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <EyeOff v-if="showConfirmPassword" :size="20" />
            <Eye v-else :size="20" />
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="form-message error-message">
        {{ errorMessage }}
      </p>

      <p v-if="successMessage" class="form-message success-message">
        {{ successMessage }}
      </p>

      <button
        class="submit-button"
        type="submit"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
      </button>
    </form>
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
          <MailCheck :size="36" />
        </div>

        <h2 id="verification-title">
          Подтверждение смены пароля
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
          :disabled="enteredCode.length !== 6 || isSubmitting"
          @click="confirmPasswordChange"
        >
          {{ isSubmitting ? 'Сохраняем...' : 'Подтвердить' }}
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
.password-page {
  width: 100%;
  padding: 32px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: #f3f3f3;
  color: #222;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e8e8e8;
  }
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #222;
}

.password-form {
  width: 100%;
  max-width: 480px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;

  label {
    font-size: 15px;
    font-weight: 500;
    color: #333;
  }
}

.password-input {
  display: flex;
  align-items: center;
  border: 1px solid #dedede;
  border-radius: 10px;
  background: #fff;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #777;
  }

  input {
    width: 100%;
    min-width: 0;
    padding: 14px 16px;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    font-size: 15px;
    color: #222;

    &::placeholder {
      color: #aaa;
    }
  }
}

.visibility-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border: none;
  background: transparent;
  color: #888;
  cursor: pointer;

  &:hover {
    color: #222;
  }
}

.field-hint {
  font-size: 13px;
  color: #888;
}

.form-message {
  margin: 0 0 20px;
  font-size: 14px;
}

.error-message {
  color: #d43b3b;
}

.success-message {
  color: #23864b;
}

.submit-button {
  width: 100%;
  padding: 15px 20px;
  border: none;
  border-radius: 10px;
  background: #222;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

@media (max-width: 600px) {
  .password-page {
    padding: 20px;
  }

  .page-header {
    margin-bottom: 30px;
  }

  .page-title {
    font-size: 24px;
  }
}
</style>
