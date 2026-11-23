
import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { Movie } from '@/types';

import { movieApi } from '@/services/mock-api';

export const useMoviesStore = defineStore('movies', () => {
  const movies = ref<Movie[]>([]);
  const currentMovie = ref<Movie | null>(null);

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchMovies(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      movies.value = await movieApi.getAll();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось загрузить фильмы';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchMovieById(movieId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      currentMovie.value = await movieApi.getById(movieId);

      if (!currentMovie.value) {
        throw new Error('Фильм не найден');
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось загрузить фильм';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    movies,
    currentMovie,
    isLoading,
    error,
    fetchMovies,
    fetchMovieById,
  };
});
