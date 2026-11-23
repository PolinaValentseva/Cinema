
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import {
  ChevronRight,
  LockKeyhole,
  LogOut,
  UserRound,
  WalletCards,
} from 'lucide-vue-next';
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

const avatarUrl = 'https://i.pravatar.cc/240?img=47';

const isLogoutModalOpen = ref(false);

const settingsItems = [
  {
    title: 'Аккаунт',
    icon: UserRound,
    to: '/profile/account',
  },
  {
    title: 'Финансы',
    icon: WalletCards,
    to: '/profile/finances',
  },
  {
    title: 'Пароль',
    icon: LockKeyhole,
    to: '/profile/password',
  },
];

function handleLogout(): void {
  isLogoutModalOpen.value = true;
}

function cancelLogout(): void {
  isLogoutModalOpen.value = false;
}

function confirmLogout(): void {
  authStore.logout();
  isLogoutModalOpen.value = false;
  router.push('/movies');
}
</script>

<template>
  <main class="profile-page">
    <div class="profile-page__content">
      <h1 class="profile-page__title">Профиль</h1>

      <section v-if="authStore.user" class="profile-user">
        <img
          class="profile-user__avatar"
          :src="avatarUrl"
          alt="Аватар пользователя"
        />

        <h2 class="profile-user__name">
          {{ authStore.user.name }}
        </h2>

        <p class="profile-user__email">
          {{ authStore.user.email }}
        </p>
      </section>

      <nav class="profile-menu">
        <RouterLink
          v-for="item in settingsItems"
          :key="item.to"
          :to="item.to"
          class="profile-menu__item"
        >
          <span class="profile-menu__left">
            <component :is="item.icon" :size="21" />
            <span>{{ item.title }}</span>
          </span>

          <ChevronRight :size="20" class="profile-menu__arrow" />
        </RouterLink>

        <button
          class="profile-menu__item profile-menu__logout"
          type="button"
          @click="handleLogout"
        >
          <span class="profile-menu__left">
            <LogOut :size="21" />
            <span>Выйти</span>
          </span>
        </button>
      </nav>
    </div>

    <Transition name="modal">
      <div
        v-if="isLogoutModalOpen"
        class="logout-modal"
        @click.self="cancelLogout"
      >
        <div
          class="logout-modal__content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div class="logout-modal__icon">
            <LogOut :size="25" />
          </div>

          <h2 id="logout-modal-title" class="logout-modal__title">
            Выйти из аккаунта?
          </h2>

          <p class="logout-modal__description">
            Вы действительно хотите выйти из своего аккаунта?
          </p>

          <div class="logout-modal__actions">
            <button
              class="logout-modal__button logout-modal__button--cancel"
              type="button"
              @click="cancelLogout"
            >
              Отмена
            </button>

            <button
              class="logout-modal__button logout-modal__button--confirm"
              type="button"
              @click="confirmLogout"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  padding: 32px 20px 40px;

  &__content {
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
  }

  &__title {
    margin: 0 0 36px;
    font-size: 28px;
    font-weight: 600;
  }
}

.profile-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
  text-align: center;

  &__avatar {
    width: 112px;
    height: 112px;
    margin-bottom: 18px;
    border-radius: 50%;
    object-fit: cover;
  }

  &__name {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 600;
  }

  &__email {
    margin: 0;
    color: #888;
    font-size: 14px;
  }
}

.profile-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 58px;
    padding: 0 18px;
    border: none;
    border-radius: 12px;
    background: #f5f5f5;
    color: #222;
    font: inherit;
    font-size: 16px;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: #ebebeb;
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__arrow {
    color: #999;
  }

  &__logout {
    color: #d43c3c;
  }
}

.logout-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(0 0 0 / 45%);

  &__content {
    width: 100%;
    max-width: 400px;
    padding: 32px;
    border-radius: 18px;
    background: #fff;
    text-align: center;
    box-shadow: 0 12px 40px rgb(0 0 0 / 12%);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: #fff0f0;
    color: #d43c3c;
  }

  &__title {
    margin: 0 0 10px;
    font-size: 21px;
    font-weight: 600;
    color: #222;
  }

  &__description {
    margin: 0 0 26px;
    color: #888;
    font-size: 14px;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    gap: 12px;
  }

  &__button {
    flex: 1;
    min-height: 46px;
    padding: 0 16px;
    border: none;
    border-radius: 10px;
    font: inherit;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;

    &--cancel {
      background: #f2f2f2;
      color: #333;

      &:hover {
        background: #e8e8e8;
      }
    }

    &--confirm {
      background: #d43c3c;
      color: #fff;

      &:hover {
        background: #bd3030;
      }
    }
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .logout-modal__content {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .logout-modal__content {
    transform: translateY(10px) scale(0.97);
  }
}

@media (max-width: 480px) {
  .logout-modal__content {
    padding: 26px 20px;
  }
}
</style>
