
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import BaseButton from '@/components/ui/BaseButton.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');

async function handleSubmit(): Promise<void> {
  try {
    await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
    });

    await router.push('/movies');
  } catch {
    // Ошибка уже записана в authStore.error
  }
}
</script>

<template>
  <main class="auth-page">
    <form class="auth-form" @submit.prevent="handleSubmit">
      <h1 class="auth-form__title">Регистрация</h1>
      <p class="auth-form__description">
        Создайте аккаунт, чтобы пользоваться возможностями кинотеатра
      </p>

      <label class="auth-form__field">
        <span>Имя</span>
        <input
          v-model="name"
          type="text"
          placeholder="Введите ваше имя"
          autocomplete="name"
          required
        />
      </label>

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

      <label class="auth-form__field">
        <span>Пароль</span>
        <input
          v-model="password"
          type="password"
          placeholder="Придумайте пароль"
          autocomplete="new-password"
          required
        />
      </label>

      <p v-if="authStore.error" class="auth-form__error">
        {{ authStore.error }}
      </p>

      <BaseButton variant="secondary" size="large">
        Войти
      </BaseButton>

      <button
        class="auth-form__button"
        type="submit"
        :disabled="authStore.isLoading"
      >
        {{ authStore.isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
      </button>

      <p class="auth-form__footer">
        Уже есть аккаунт?
        <RouterLink to="/login">Войти</RouterLink>
      </p>
    </form>
  </main>
</template>

<style scoped lang="scss">
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 32px 20px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 420px;

  &__title {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
  }

  &__description {
    margin: -12px 0 4px;
    color: #888;
    line-height: 1.5;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;

    input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #444;
      border-radius: 8px;
      background: transparent;
      color: inherit;
      font: inherit;
      outline: none;

      &:focus {
        border-color: #888;
      }
    }
  }

  &__error {
    margin: 0;
    color: #e05252;
    font-size: 14px;
  }

  &__button {
    padding: 14px 20px;
    border: none;
    border-radius: 8px;
    background: #fff;
    color: #111;
    font: inherit;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  &__footer {
    margin: 0;
    color: #888;
    text-align: center;

    a {
      color: inherit;
      font-weight: 600;
    }
  }
}
</style>
