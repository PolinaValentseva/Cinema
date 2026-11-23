
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type {
  AuthSession,
  RegisterUserData,
  UpdateUserData,
  User,
  UserCredentials,
} from '@/types';

import { authApi } from '@/services/mock-api';
import { storage, STORAGE_KEYS } from '@/services/storage';

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => user.value !== null);

  function saveSession(currentUser: User): void {
    const session: AuthSession = {
      userId: currentUser.id,
      expiresAt: new Date(
        Date.now() + SESSION_DURATION,
      ).toISOString(),
    };

    storage.set(STORAGE_KEYS.AUTH_SESSION, session);
    user.value = currentUser;
  }

  async function register(data: RegisterUserData): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const registeredUser = await authApi.register(data);
      saveSession(registeredUser);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Ошибка регистрации';

      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(credentials: UserCredentials): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const loggedUser = await authApi.login(credentials);
      saveSession(loggedUser);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Ошибка авторизации';

      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateProfile(data: UpdateUserData): Promise<void> {
    if (!user.value) {
      throw new Error('Пользователь не авторизован');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const updatedUser = await authApi.updateUser(user.value.id, data);
      user.value = updatedUser;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось обновить данные';

      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (!user.value) {
      throw new Error('Пользователь не авторизован');
    }

    isLoading.value = true;
    error.value = null;

    try {
      await authApi.changePassword(
        user.value.id,
        currentPassword,
        newPassword,
      );
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось изменить пароль';

      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function logout(): void {
    user.value = null;
    storage.remove(STORAGE_KEYS.AUTH_SESSION);
  }

  async function initialize(): Promise<void> {
    const session = storage.get<AuthSession>(
      STORAGE_KEYS.AUTH_SESSION,
    );

    if (!session) {
      return;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      logout();
      return;
    }

    const storedUser = await authApi.getUserById(session.userId);

    if (!storedUser) {
      logout();
      return;
    }

    user.value = storedUser;
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    register,
    login,
    updateProfile,
    changePassword,
    logout,
    initialize,
  };
});
