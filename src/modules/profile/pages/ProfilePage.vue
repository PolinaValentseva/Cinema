
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

const isUpdatingPushkinCard = ref(false);

async function togglePushkinCard(): Promise<void> {
  if (!authStore.user || isUpdatingPushkinCard.value) return;

  isUpdatingPushkinCard.value = true;

  try {
    await authStore.updateProfile({
      isPushkinCardConnected: !authStore.user.isPushkinCardConnected,
    });
  } catch (error) {
    console.error('Не удалось изменить статус Пушкинской карты', error);
  } finally {
    isUpdatingPushkinCard.value = false;
  }
}

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

      <section
        v-if="authStore.user"
        class="profile-pushkin"
      >
        <div class="profile-pushkin__left">
          <div class="profile-pushkin__icon">
            <svg
              viewBox="0 0 100 70"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="pushkin-gradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stop-color="#9B72C8" />
                  <stop offset="100%" stop-color="#58377E" />
                </linearGradient>
              </defs>

              <rect
                x="5"
                y="5"
                width="90"
                height="60"
                rx="10"
                fill="url(#pushkin-gradient)"
              />

              <rect
                x="15"
                y="17"
                width="14"
                height="11"
                rx="2"
                fill="#E9D8B2"
              />

              <path
                d="M66 17 Q82 24 73 43 Q70 31 59 27 Q63 23 66 17Z"
                fill="#F3E6CF"
              />

              <path
                d="M73 43 L58 52"
                stroke="#F3E6CF"
                stroke-width="2"
                stroke-linecap="round"
              />

              <path
                d="M15 48 Q35 20 55 48 T90 40"
                fill="none"
                stroke="#DCC8F0"
                stroke-width="1.2"
                opacity=".5"
              />
            </svg>

            <!-- <svg
              viewBox="0 0 320 200"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="card-bg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#242424" />
                  <stop offset="100%" stop-color="#080808" />
                </linearGradient>

                <linearGradient id="portrait-bg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#F08BCB" />
                  <stop offset="100%" stop-color="#873C9D" />
                </linearGradient>

                <clipPath id="portrait-clip">
                  <rect x="188" y="20" width="112" height="160" rx="5" />
                </clipPath>
              </defs>

              <rect width="320" height="200" rx="15" fill="url(#card-bg)" />

              <path
                d="M0 155 Q95 115 180 175"
                fill="none"
                stroke="#444"
                stroke-width="1"
                opacity=".5"
              />

              <text
                x="20"
                y="43"
                fill="#B8E84B"
                font-family="Arial, sans-serif"
                font-size="15"
                font-weight="700"
                letter-spacing="1"
              >ПУШКИНСКАЯ</text>

              <text
                x="20"
                y="63"
                fill="#B8E84B"
                font-family="Arial, sans-serif"
                font-size="15"
                font-weight="700"
                letter-spacing="1"
              >КАРТА</text>

              <rect x="22" y="91" width="39" height="30" rx="5" fill="#D7C69B" />
              <path
                d="M35 91 V121 M48 91 V121 M22 106 H61"
                stroke="#9D8B63"
                stroke-width="1"
              />

              <g clip-path="url(#portrait-clip)">
                <rect x="188" y="20" width="112" height="160" fill="url(#portrait-bg)" />

                <path
                  d="M180 180 Q185 130 215 122 L245 110 L278 120 Q305 135 310 180Z"
                  fill="#29202D"
                />

                <path
                  d="M205 180 L215 132 L245 119 L278 132 L291 180Z"
                  fill="#17131B"
                />
                <path
                  d="M235 123 L248 145 L263 123 L254 180 L241 180Z"
                  fill="#E8D9D2"
                />

                <path
                  d="M220 53 Q220 27 246 28 Q274 30 275 62
                    L269 104 Q260 121 244 117
                    Q225 111 219 87Z"
                  fill="#DCA08C"
                />

                <path
                  d="M218 67 Q208 35 233 22 Q264 9 280 43
                    Q286 58 273 76 L267 54
                    Q251 66 234 54 L222 78Z"
                  fill="#211A26"
                />

                <path
                  d="M220 64 Q211 81 222 102 L230 110 L230 75Z
                    M270 62 Q282 79 267 106 L261 109 L264 72Z"
                  fill="#211A26"
                />

                <path
                  d="M230 72 Q237 68 243 72
                    M254 72 Q261 68 267 72"
                  stroke="#49313B"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                />
                <path
                  d="M248 73 L243 91 L251 93"
                  stroke="#9D625C"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                />
                <path
                  d="M237 99 Q249 105 260 98"
                  stroke="#77414C"
                  stroke-width="2"
                  fill="none"
                  stroke-linecap="round"
                />
                <path
                  d="M232 103 Q247 119 265 102"
                  fill="none"
                  stroke="#211A26"
                  stroke-width="5"
                />
              </g>

              <text
                x="22"
                y="170"
                fill="#FFFFFF"
                font-family="Arial, sans-serif"
                font-size="18"
                font-weight="700"
                letter-spacing="1"
              >МИР</text>
            </svg> -->

          </div>

          <div class="profile-pushkin__info">
            <h2 class="profile-pushkin__title">
              Пушкинская карта
            </h2>

            <p class="profile-pushkin__description">
              Культура ближе, чем кажется
            </p>
          </div>
        </div>

        <button
          class="profile-pushkin__button"
          type="button"
          :disabled="isUpdatingPushkinCard"
          @click="togglePushkinCard"
        >
          {{
            isUpdatingPushkinCard
              ? 'Сохранение...'
              : authStore.user.isPushkinCardConnected
                ? 'Отключить'
                : 'Подключить'
          }}
        </button>
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

.profile-pushkin {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 14px;
  background: #faf7fd;

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 76px;
    height: 76px;
    border-radius: 12px;
    background: #eee5f7;

    svg {
      width: 68px;
      height: 52px;
    }
  }

  &__info {
    min-width: 0;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 600;
  }

  &__description {
    margin: 0;
    color: #888;
    font-size: 13px;
    line-height: 1.5;
  }

  &__button {
    flex-shrink: 0;
    min-height: 40px;
    padding: 0 16px;
    border: none;
    border-radius: 9px;
    background: #65418a;
    color: #fff;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s ease, opacity 0.2s ease;

    &:hover:not(:disabled) {
      background: #50336e;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 480px) {
  .profile-pushkin {
    gap: 12px;
    padding: 14px;

    &__left {
      gap: 10px;
    }

    &__icon {
      width: 60px;
      height: 60px;

      svg {
        width: 54px;
        height: 42px;
      }
    }

    &__title {
      font-size: 15px;
    }

    &__description {
      font-size: 12px;
    }

    &__button {
      padding: 0 11px;
      font-size: 13px;
    }
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
