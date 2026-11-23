
<script setup lang="ts">
import { useMoviesStore } from '@/stores/movies';
import { computed, onMounted, ref } from 'vue';

const moviesStore = useMoviesStore();

const searchQuery = ref('');

const filteredMovies = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('ru');

  if (!query) {
    return moviesStore.movies;
  }

  return moviesStore.movies.filter((movie) =>
    movie.title.toLocaleLowerCase('ru').includes(query),
  );
});

onMounted(async () => {
  if (moviesStore.movies.length === 0 && !moviesStore.isLoading) {
    try {
      await moviesStore.fetchMovies();
    } catch {
      // Ошибка отображается через moviesStore.error.
    }
  }
});
</script>

<template>
  <main class="search-page">
    <div class="search-page__container">
      <h1 class="search-page__title">Поиск фильмов</h1>

      <div class="search-page__input-wrapper">
        <input
          v-model="searchQuery"
          type="search"
          class="search-page__input"
          placeholder="Введите название фильма..."
          aria-label="Поиск фильмов по названию"
        />

        <button
          v-if="searchQuery"
          type="button"
          class="search-page__clear"
          aria-label="Очистить поиск"
          @click="searchQuery = ''"
        >
          Очистить
        </button>
      </div>

      <p v-if="moviesStore.isLoading" class="search-page__message">
        Загружаем фильмы...
      </p>

      <p
        v-else-if="moviesStore.error"
        class="search-page__message search-page__message--error"
      >
        {{ moviesStore.error }}
      </p>

      <template v-else >
        <p
          v-if="filteredMovies.length === 0"
          class="search-page__message"
        >
          По запросу «{{ searchQuery }}» ничего не найдено.
        </p>

        <div v-else class="search-page__results">
          <p class="search-page__count">
            Найдено фильмов: {{ filteredMovies.length }}
          </p>

          <RouterLink
            v-for="movie in filteredMovies"
            :key="movie.id"
            :to="{ name: 'movie-details', params: { id: movie.id } }"
            class="movie-card"
          >
            <img
              :src="movie.poster"
              :alt="movie.title"
              class="movie-card__poster"
            />

            <div class="movie-card__info">
              <h2>{{ movie.title }}</h2>
              <p>{{ movie.genres.join(', ') }}</p>
              <p>{{ movie.duration }} мин.</p>
              <span>{{ movie.ageRating }}</span>
            </div>
          </RouterLink>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped lang="scss">
.search-page {
  min-height: 100%;

  &__container {
    width: min(100% - 40px, 1100px);
    margin: 0 auto;
    padding: 40px 0;
  }

  &__title {
    margin: 0 0 24px;
    font-size: 30px;
  }

  &__input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
  }

  &__input {
    width: 100%;
    min-width: 0;
    padding: 14px 16px;
    border: 1px solid var(--color-border, #444);
    border-radius: 10px;
    background: var(--color-surface, #171717);
    color: inherit;
    font: inherit;
    outline: none;

    &:focus {
      border-color: var(--color-primary, #fff);
    }
  }

  &__clear {
    flex-shrink: 0;
    padding: 10px 14px;
    border: 0;
    border-radius: 8px;
    background: var(--color-surface, #333);
    color: inherit;
    cursor: pointer;
  }

  &__message {
    color: var(--color-text-secondary, #888);
    text-align: center;
    padding: 32px 0;

    &--error {
      color: #e05252;
    }
  }

  &__count {
    margin-bottom: 20px;
    color: var(--color-text-secondary, #888);
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.movie-card {
  display: flex;
  gap: 18px;
  padding: 14px;
  border: 1px solid var(--color-border, #333);
  border-radius: 12px;
  color: inherit;
  text-decoration: none;

  &__poster {
    width: 100px;
    height: 140px;
    flex-shrink: 0;
    border-radius: 8px;
    object-fit: cover;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 8px;

    h2 {
      margin: 0;
      font-size: 18px;
    }

    p {
      margin: 0;
      color: var(--color-text-secondary, #888);
      font-size: 14px;
    }

    span {
      font-size: 13px;
    }
  }
}
</style>
