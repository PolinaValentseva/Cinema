
<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';

import { useMoviesStore } from '@/stores/movies';
import { useSessionsStore } from '@/stores/sessions';

const route = useRoute();

const moviesStore = useMoviesStore();
const sessionsStore = useSessionsStore();

function formatSessionDate(date: string): string {
  return new Date(date).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

watch(
  () => route.params.id,
  async (id) => {
    const movieId = String(id);

    try {
      await Promise.all([
        moviesStore.fetchMovieById(movieId),
        sessionsStore.fetchSessionsByMovieId(movieId),
      ]);
    } catch {
      // Ошибки отображаются через состояние хранилищ.
    }
  },
  { immediate: true },
);
</script>

<template>
  <main class="movie-details-page">
    <div class="movie-details-page__container">
      <p v-if="moviesStore.isLoading">
        Загружаем информацию о фильме...
      </p>

      <p v-else-if="moviesStore.error" class="movie-details-page__error">
        {{ moviesStore.error }}
      </p>

      <template v-else-if="moviesStore.currentMovie">
        <section class="movie-info">
          <img
            :src="moviesStore.currentMovie.poster"
            :alt="moviesStore.currentMovie.title"
            class="movie-info__poster"
          />

          <div class="movie-info__content">
            <h1>{{ moviesStore.currentMovie.title }}</h1>

            <p>{{ moviesStore.currentMovie.description }}</p>

            <p>
              Жанры:
              {{ moviesStore.currentMovie.genres.join(', ') }}
            </p>

            <p>
              Продолжительность:
              {{ moviesStore.currentMovie.duration }} мин.
            </p>

            <p>
              Возрастное ограничение:
              {{ moviesStore.currentMovie.ageRating }}
            </p>
          </div>
        </section>

        <section class="sessions">
          <h2>Сеансы</h2>

          <p v-if="sessionsStore.isLoading">
            Загружаем сеансы...
          </p>

          <p v-else-if="sessionsStore.error" class="movie-details-page__error">
            {{ sessionsStore.error }}
          </p>

          <p v-else-if="sessionsStore.sessions.length === 0">
            Для этого фильма пока нет доступных сеансов.
          </p>

          <div v-else class="sessions__list">
            <div
              v-for="session in sessionsStore.sessions"
              :key="session.id"
              class="session-card"
            >
              <div>
                <p>{{ formatSessionDate(session.startsAt) }}</p>
                <strong>{{ session.price }} ₽</strong>
              </div>

              <RouterLink
                :to="{
                  name: 'booking',
                  params: { sessionId: session.id },
                }"
                class="session-card__button"
              >
                Выбрать
              </RouterLink>
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped lang="scss">
.movie-details-page {
  padding: 40px 20px;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__error {
    color: #d33;
  }
}

.movie-info {
  display: flex;
  gap: 32px;
  margin-bottom: 48px;

  &__poster {
    width: 260px;
    height: 390px;
    object-fit: cover;
    border-radius: 10px;
    background: #eee;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    h1,
    p {
      margin: 0;
    }
  }
}

.sessions {
  h2 {
    margin: 0 0 24px;
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
}

.session-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-width: 280px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;

  p {
    margin: 0 0 8px;
  }

  &__button {
    padding: 10px 16px;
    border-radius: 6px;
    background: #222;
    color: #fff;
    text-decoration: none;
  }
}

@media (max-width: 600px) {
  .movie-info {
    flex-direction: column;

    &__poster {
      width: 100%;
      max-width: 260px;
      height: auto;
      aspect-ratio: 2 / 3;
    }
  }

  .session-card {
    width: 100%;
    min-width: 0;
  }
}
</style>
