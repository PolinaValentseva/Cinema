
import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { Session } from '@/types';

import { sessionApi } from '@/services/mock-api';

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref<Session[]>([]);
  const currentSession = ref<Session | null>(null);

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSessions(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      sessions.value = await sessionApi.getAll();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось загрузить сеансы';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchSessionsByMovieId(movieId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      sessions.value = await sessionApi.getByMovieId(movieId);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось загрузить сеансы';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchSessionById(sessionId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      currentSession.value = await sessionApi.getById(sessionId);

      if (!currentSession.value) {
        throw new Error('Сеанс не найден');
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось загрузить сеанс';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    fetchSessions,
    fetchSessionsByMovieId,
    fetchSessionById,
  };
});
