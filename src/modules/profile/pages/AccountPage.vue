
<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const name = ref(authStore.user?.name ?? '');
const email = ref(authStore.user?.email ?? '');

const successMessage = ref('');
const errorMessage = ref('');

async function handleSave(): Promise<void> {
  successMessage.value = '';
  errorMessage.value = '';

  try {
    await authStore.updateProfile({
      name: name.value,
      email: email.value,
    });

    successMessage.value = 'Изменения успешно сохранены';
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Не удалось сохранить изменения';
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
</style>
