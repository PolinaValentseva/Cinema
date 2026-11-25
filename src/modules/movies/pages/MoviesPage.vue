<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue';

import { ChevronDown, Search } from 'lucide-vue-next';

import { useMoviesStore } from '@/stores/movies';
import { useSessionsStore } from '@/stores/sessions';

import { useImage } from '@/composables/useProductImage';

const moviesStore = useMoviesStore();
const sessionsStore = useSessionsStore();
const { getImagePath } = useImage()

const isLoading = computed(
  () => moviesStore.isLoading || sessionsStore.isLoading,
);

const error = computed(
  () => moviesStore.error || sessionsStore.error,
);

const moviesWithSessions = computed(() =>
  moviesStore.movies.map((movie) => ({
    ...movie,
    sessions: sessionsStore.sessions
      .filter((session) => session.movieId === movie.id)
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() -
          new Date(b.startsAt).getTime(),
      ),
  })),
);

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} мин`;
  }

  return remainingMinutes
    ? `${hours} ч ${remainingMinutes} мин`
    : `${hours} ч`;
}

function formatTime(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatSessionTime(
  startsAt: string,
  duration: number,
): string {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + duration * 60_000);

  return `${formatTime(startsAt)} – ${formatTime(end.toISOString())}`;
}


type GenreFilter =
  | 'Все'
  | 'Боевик'
  | 'Драма'
  | 'Анимация'
  | 'Триллер'
  | 'Комедия';

type AdditionalFilter = 'Все' | '2D' | 'Пушкинская карта';

const genreOptions: GenreFilter[] = [
  'Все',
  'Боевик',
  'Драма',
  'Анимация',
  'Триллер',
  'Комедия',
];

const additionalOptions: AdditionalFilter[] = [
  'Все',
  '2D',
  'Пушкинская карта',
];

const selectedGenre = ref<GenreFilter>('Все');
const selectedAdditional = ref<AdditionalFilter>('Все');

const filteredMovies = computed(() => {
  return moviesWithSessions.value.filter((movie) => {
    const matchesGenre =
      selectedGenre.value === 'Все' ||
      movie.genres.includes(selectedGenre.value);

    const matchesAdditional =
      selectedAdditional.value === 'Все' ||
      (selectedAdditional.value === 'Пушкинская карта' &&
        movie.isPushkinCardAvailable);

    return matchesGenre && matchesAdditional;
  });
});

const activeFilterDropdown = ref<'genre' | 'additional' | null>(null);

function toggleFilterDropdown(type: 'genre' | 'additional') {
  activeFilterDropdown.value =
    activeFilterDropdown.value === type ? null : type;
}


// Логика карусели

const activeSlide = ref(0);
const carouselMovies = computed(() => moviesStore.movies);

let carouselTimer: ReturnType<typeof setInterval> | undefined;

function nextSlide() {
  if (carouselMovies.value.length > 1) {
    activeSlide.value =
      (activeSlide.value + 1) % carouselMovies.value.length;
  }
}

function previousSlide() {
  if (carouselMovies.value.length > 1) {
    activeSlide.value =
      (activeSlide.value - 1 + carouselMovies.value.length) %
      carouselMovies.value.length;
  }
}

function goToSlide(index: number) {
  activeSlide.value = index;
}

// Перезапускаем таймер после загрузки фильмов
function startCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer);
  }

  if (carouselMovies.value.length > 1) {
    carouselTimer = setInterval(nextSlide, 5000);
  }
}

watch(
  () => carouselMovies.value.length,
  () => {
    activeSlide.value = 0;
    startCarousel();
  },
  { immediate: true },
);

onUnmounted(() => {
  if (carouselTimer) {
    clearInterval(carouselTimer);
  }
});

// Перелистывание мышью и пальцем

const dragStartX = ref(0);
const dragEndX = ref(0);
const isDragging = ref(false);
const hasDragged = ref(false);

function handlePointerDown(event: PointerEvent) {
  dragStartX.value = event.clientX;
  dragEndX.value = event.clientX;
  isDragging.value = true;
  hasDragged.value = false;
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value) return;

  dragEndX.value = event.clientX;

  if (Math.abs(dragEndX.value - dragStartX.value) > 10) {
    hasDragged.value = true;
  }
}

function handlePointerUp() {
  if (!isDragging.value) return;

  const distance = dragEndX.value - dragStartX.value;

  if (Math.abs(distance) > 50) {
    if (distance < 0) {
      nextSlide();
    } else {
      previousSlide();
    }

    startCarousel();
  }

  isDragging.value = false;
}

function handlePointerCancel() {
  isDragging.value = false;
}

function handleSlideClick(event: MouseEvent) {
  if (hasDragged.value) {
    event.preventDefault();
    event.stopPropagation();
  }
}


///// СЕАНСЫ
const activeSessions = ref<Record<string, string>>({});

function handleSessionsScroll(movieId: string, event: Event) {
  const container = event.currentTarget as HTMLElement;

  const sessions = Array.from(
    container.querySelectorAll<HTMLElement>(
      '.movies-catalog__session',
    ),
  );

  if (!sessions.length) return;

  const containerCenter =
    container.getBoundingClientRect().left +
    container.clientWidth / 2;

  const activeSession = sessions.reduce((closest, session) => {
    const sessionCenter =
      session.getBoundingClientRect().left +
      session.offsetWidth / 2;

    const closestCenter =
      closest.getBoundingClientRect().left +
      closest.offsetWidth / 2;

    return Math.abs(sessionCenter - containerCenter) <
      Math.abs(closestCenter - containerCenter)
      ? session
      : closest;
  });

  activeSessions.value[movieId] = activeSession.dataset.sessionId ?? '';
}


onMounted(async () => {
  try {
    await Promise.all([
      moviesStore.fetchMovies(),
      sessionsStore.fetchSessions(),
    ]);
  } catch {
    // Ошибки отображаются на странице.
  }
});
</script>



<template>
  <main class="movies-page">
    <div class="movies-page__container">
      <header class="movies-header">
        <h1 class="title">Афиша</h1>

        <RouterLink
          to="/search"
          class="movies-header__search"
          aria-label="Поиск фильмов"
        >
          <Search :size="24" />
        </RouterLink>
      </header>

      <section class="movies-filters">
        <div class="movies-filters__controls">
          <button
            class="movies-filters__trigger"
            :class="{
              'movies-filters__trigger--active':
                activeFilterDropdown === 'genre',
            }"
            @click="toggleFilterDropdown('genre')"
          >
            По жанру
            <ChevronDown
              :size="16"
              :class="{
                'movies-filters__chevron--open':
                  activeFilterDropdown === 'genre',
              }"
            />
          </button>

          <button
            class="movies-filters__trigger"
            :class="{
              'movies-filters__trigger--active':
                activeFilterDropdown === 'additional',
            }"
            @click="toggleFilterDropdown('additional')"
          >
            Фильтры
            <ChevronDown
              :size="16"
              :class="{
                'movies-filters__chevron--open':
                  activeFilterDropdown === 'additional',
              }"
            />
          </button>
        </div>

        <div
          v-if="activeFilterDropdown === 'genre'"
          class="movies-filters__options"
        >
          <button
            v-for="genre in genreOptions"
            :key="genre"
            class="movies-filters__option"
            :class="{
              'movies-filters__option--selected':
                selectedGenre === genre,
            }"
            @click="selectedGenre = genre"
          >
            {{ genre }}
          </button>
        </div>

        <div
          v-else-if="activeFilterDropdown === 'additional'"
          class="movies-filters__options"
        >
          <button
            v-for="filter in additionalOptions"
            :key="filter"
            class="movies-filters__option"
            :class="{
              'movies-filters__option--selected':
                selectedAdditional === filter,
            }"
            @click="selectedAdditional = filter"
          >
            {{ filter }}
          </button>
        </div>
      </section>

      <section
        v-if="!isLoading && !error && carouselMovies.length"
        class="movies-carousel"
      >
        <div
          class="movies-carousel__track"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp"
          @pointercancel="handlePointerCancel"
          @pointerleave="handlePointerUp"
        >
          <RouterLink
            v-for="(movie, index) in carouselMovies"
            :key="movie.id"
            :to="{ name: 'movie-details', params: { id: movie.id } }"
            class="movies-carousel__slide"
            :class="{
              'movies-carousel__slide--active': index === activeSlide,
              'movies-carousel__slide--left':
                index === (activeSlide - 1 + carouselMovies.length) %
                  carouselMovies.length,
              'movies-carousel__slide--right':
                index === (activeSlide + 1) % carouselMovies.length,
            }"
            @click.prevent="goToSlide(index)"
            @click="handleSlideClick"
          >
            <img :src="getImagePath(movie.poster)" :alt="movie.title" class="movies-carousel__slide-image"/>

            <!-- <div class="movies-carousel__caption">
              {{ movie.title }}
            </div> -->
          </RouterLink>
        </div>

        <div class="movies-carousel__indicators">
          <button
            v-for="(movie, index) in carouselMovies"
            :key="movie.id"
            class="movies-carousel__indicator"
            :class="{
              'movies-carousel__indicator--active': index === activeSlide,
            }"
            :aria-label="`Перейти к фильму ${movie.title}`"
            @click="goToSlide(index)"
          />
        </div>
      </section>

      <p v-if="isLoading">
        Загружаем фильмы...
      </p>

      <p v-else-if="error" class="movies-page__error">
        {{ error }}
      </p>

      <p v-else-if="moviesStore.movies.length === 0">
        Пока нет доступных фильмов.
      </p>

      <p
        v-else-if="filteredMovies.length === 0"
        class="movies-page__empty"
      >
        По выбранному жанру фильмов пока нет.
      </p>

      <section
        v-if="!isLoading && !error && filteredMovies.length"
        class="movies-catalog"
      >
        <article
          v-for="movie in filteredMovies"
          :key="movie.id"
          class="movies-catalog__item"
        >
          <div class="movies-catalog__content">
            <RouterLink
              :to="{ name: 'movie-details', params: { id: movie.id } }"
              class="movies-catalog__info"
            >
              <img
                :src="getImagePath(movie.poster)"
                :alt="movie.title"
                class="movies-catalog__poster"
              />

              <div class="movies-catalog__details">
                <h2 class="movies-catalog__title">
                  {{ movie.title }}
                </h2>

                <div class="movies-catalog__meta">
                  <span>{{ movie.ageRating }}</span>
                  <span>{{ formatDuration(movie.duration) }}</span>
                  <span>{{ movie.genres.join(', ') }}</span>
                </div>
              </div>
            </RouterLink>

            <div
              v-if="movie.sessions.length"
              class="movies-catalog__sessions"
              @scroll="handleSessionsScroll(movie.id, $event)"
            >
              <RouterLink
                v-for="(session) in movie.sessions"
                :key="session.id"
                :to="`/booking/${session.id}`"
                class="movies-catalog__session"
                :data-session-id="session.id"
                :class="{
                  'movies-catalog__session--active':
                    (activeSessions[movie.id] || movie.sessions[0]?.id) === session.id,
                }"
              >
                <div class="movies-catalog__session-top">
                  <span class="movies-catalog__price">
                    {{ session.price }} ₽
                  </span>

                  <span class="movies-catalog__format">2D</span>
                </div>

                <span class="movies-catalog__session-time">
                  {{ formatSessionTime(session.startsAt, movie.duration) }}
                </span>
              </RouterLink>
            </div>
          </div>
        </article>
      </section>

    </div>
  </main>
</template>


<style scoped lang="scss">

.title {
  font-weight: 500;
  font-size: 22px;
  letter-spacing: -0.01em;
  color: #1e1b1c;
}

.movies-page {
  min-height: 100vh;
  padding: 30px 20px;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
  }

  &__error {
    color: #d33;
  }

  &__empty {
    color: #777;
  }
}

.movies-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-bottom: 28px;

  h1 {
    margin: 0;
    font-size: 30px;
    font-weight: 600;
  }

  &__search {
    position: absolute;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    color: #222;
    border-radius: 12px;
    transition: background 0.2s;

    &:hover {
      background: #f0f0f0;
    }
  }
}


.movies-filters {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;

  &__controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__chevron {
    transition: transform 0.2s ease;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    font-size: 14px;
    color: #fff;
    background: #1e1b1c;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover,
    &--active {
      background: #443e40;
    }
  }

  &__options {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  &__option {
    padding: 10px 16px;
    color: #1e1b1c;
    background: #f3f3f3;
    border: none;
    border-radius: 19px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: #e5e5e5;
    }

    &--selected {
      color: #fff;
      background: #222;

      &:hover {
        background: #333;
      }
    }
  }
}


.movies-carousel {
  margin-bottom: 35px;

  &__track {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 900px;
    height: 390px;
    margin: 0 auto;
    overflow: hidden;
    touch-action: pan-y;
    user-select: none;
  }

  &__slide {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    flex-direction: column;
    width: 240px;
    overflow: hidden;
    color: #fff;
    text-decoration: none;
    background: #222;
    border-radius: 16px;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, -50%) scale(0.75);
    transition:
      transform 0.5s ease,
      opacity 0.5s ease,
      filter 0.5s ease;
    
    img {
      display: block;
      width: 100%;
      height: 340px;
      object-fit: cover;
    }

    &--active {
      z-index: 3;
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, -50%) scale(1);
      box-shadow: 0 4px 28px 0 rgba(0, 0, 0, 0.4);
    }

    &--left {
      z-index: 2;
      opacity: 0.92;
      filter: brightness(0.6);
      pointer-events: auto;
      transform: translate(calc(-50% - 190px), -50%) scale(0.82);
      box-shadow: 0 4px 7px 0 rgba(0, 0, 0, 0.2);
    }

    &--right {
      z-index: 2;
      opacity: 0.92;
      filter: brightness(0.6);
      pointer-events: auto;
      transform: translate(calc(-50% + 190px), -50%) scale(0.82);
      box-shadow: 0 4px 7px 0 rgba(0, 0, 0, 0.2);
    }

    &-image {
      object-fit: cover;
    }
  }

  // &__caption {
  //   padding: 12px;
  //   font-size: 15px;
  //   font-weight: 600;
  //   text-align: center;
  // }

  &__indicators {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  &__indicator {
    width: 20px;
    height: 5px;
    padding: 0;
    background: #ddd;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s, width 0.2s;

    &--active {
      width: 30px;
      background: #E50000;
    }
  }
}

.movies-catalog {
  display: flex;
  flex-direction: column;
  gap: 32px;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  &__content {
    display: grid;
    min-height: 179px;
    grid-template-columns: 126px minmax(0, 1fr);
    grid-template-rows: 1fr auto;
    column-gap: 20px;
    row-gap: 16px;
  }

  &__info {
    display: contents;
  }

  &__poster {
    height: 100%;
    border-radius: 14px;
    grid-column: 1;
    grid-row: 1 / 3;
  }

  &__details {
    grid-column: 2;
    grid-row: 1;
  }

  &__sessions {
    grid-column: 2;
    grid-row: 2;
    display: flex;
    gap: 12px;
    min-width: 0;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: thin;
  }

  &__title {
    font-family: "Bebas Neue Cyrillic";
    margin: 0;
    margin-bottom: 8px;
    font-size: 32px;
    font-weight: normal;
  }

  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    color: #777;
    font-size: 13px;

    span + span {
      padding-left: 10px;
      border-left: 1px solid #ddd;
    }
  }

  &__sessions {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 6px;

    scrollbar-width: thin;

    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
  }

  &__session {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
    flex: 0 0 150px;
    min-height: 76px;
    padding: 12px;
    border-radius: 8px;

    background: #222;
    color: #fff;
    opacity: 0.35;
    filter: brightness(0.65);

    text-decoration: none;

    transition:
      opacity 0.25s ease,
      filter 0.25s ease,
      transform 0.25s ease;
    
    scroll-snap-align: center;
  }

  &__session--active {
    opacity: 1;
    filter: brightness(1);
    transform: scale(1.02);
  }

  &__session-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  &__price {
    font-size: 16px;
    font-weight: 600;
  }

  &__format {
    font-size: 12px;
  }

  &__session-time {
    font-size: 13px;
    white-space: nowrap;
  }
}

@media (max-width: 600px) {
  .movies-carousel {
    &__track {
      height: 310px;
    }

    &__slide {
      width: 180px;

      img {
        height: 257px;
      }

      &--left {
        transform: translate(calc(-50% - 125px), -50%) scale(0.85);
      }

      &--right {
        transform: translate(calc(-50% + 125px), -50%) scale(0.85);
      }
    }
  }
}

</style>
