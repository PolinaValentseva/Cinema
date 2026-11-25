
<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useImage } from '@/composables/useProductImage';

import { useAuthStore } from '@/stores/auth';
import { useTicketsStore } from '@/stores/tickets';

import {
  movieApi,
  seatApi,
  sessionApi,
} from '@/services/mock-api';

const { getImagePath } = useImage()

import type { Movie, Seat, Session, Ticket } from '@/types';

interface TicketView {
  ticket: Ticket;
  movie?: Movie;
  session?: Session;
  seat?: Seat;
}

const authStore = useAuthStore();
const ticketsStore = useTicketsStore();

const ticketViews = ref<TicketView[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

const router = useRouter();

async function loadTickets(): Promise<void> {
  const userId = authStore.user?.id;

  if (!userId) {
    error.value = 'Не удалось определить пользователя';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    await ticketsStore.fetchUserTickets(userId);

    const sessionCache = new Map<string, Session>();
    const movieCache = new Map<string, Movie>();
    const seatCache = new Map<string, Seat[]>();

    const result = await Promise.all(
      ticketsStore.tickets.map(async (ticket): Promise<TicketView> => {
        let session = sessionCache.get(ticket.sessionId);

        if (!session) {
          const loadedSession = await sessionApi.getById(ticket.sessionId);

          if (loadedSession) {
            session = loadedSession;
            sessionCache.set(ticket.sessionId, loadedSession);
          }
        }

        let movie: Movie | undefined;

        if (session) {
          movie = movieCache.get(session.movieId);

          if (!movie) {
            const loadedMovie = await movieApi.getById(session.movieId);

            if (loadedMovie) {
              movie = loadedMovie;
              movieCache.set(session.movieId, loadedMovie);
            }
          }
        }

        let seats = seatCache.get(ticket.sessionId);

        if (!seats) {
          const loadedSeats = await seatApi.getBySessionId(
            ticket.sessionId,
          );

          seats = loadedSeats.map((item) => item.seat);
          seatCache.set(ticket.sessionId, seats);
        }

        const seat = seats.find((item) => item.id === ticket.seatId);

        return {
          ticket,
          movie,
          session,
          seat,
        };
      }),
    );

    ticketViews.value = result;
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'Не удалось загрузить билеты';
  } finally {
    isLoading.value = false;
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(loadTickets);
</script>


<template>
  <main class="page">
    <div class="tickets-page__container">
      <header class="page-header">
        <button
          class="page-header__back"
          type="button"
          aria-label="Назад"
          @click="router.back"
        >
          <ChevronLeft :size="20" :stroke-width="2.5" />
        </button>

        <h1 class="page-header__title">Мои билеты</h1>
        <div class="page-header__foo"></div>
      </header>

      <div v-if="isLoading" class="tickets-page__message">
        Загружаем билеты...
      </div>

      <div
        v-else-if="error"
        class="tickets-page__message tickets-page__message--error"
      >
        {{ error }}

        <button class="tickets-page__retry" @click="loadTickets">
          Попробовать снова
        </button>
      </div>

      <div
        v-else-if="ticketViews.length === 0"
        class="tickets-page__empty"
      >
        <h2>У вас пока нет билетов</h2>

        <p>
          Выберите фильм, забронируйте места и оплатите заказ.
          Купленные билеты появятся здесь.
        </p>
      </div>

      <div v-else class="tickets-list">
        <article
          v-for="item in ticketViews"
          :key="item.ticket.id"
          class="ticket-card"
        >
          <svg
            class="ticket-card__background"
            viewBox="0 0 345 130"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M81.4331 0C88.3736 0 95.0595 8 102 8C108.94 8 115.626 0 122.567 0H319.4C328.361 3.79809e-10 332.841 0.000294194 336.264 1.74414C339.274 3.27811 341.722 5.72574 343.256 8.73633C345 12.1589 345 16.6391 345 25.5996V104.4C345 113.361 345 117.841 343.256 121.264C341.722 124.274 339.274 126.722 336.264 128.256C332.841 130 328.361 130 319.4 130H122.567C115.626 130 108.94 122 102 122C95.0595 122 88.3736 130 81.4331 130H25.5996C16.6391 130 12.1589 130 8.73633 128.256C5.72574 126.722 3.27811 124.274 1.74414 121.264C0.000290614 117.841 3.65393e-10 113.361 0 104.4V25.5996C0 16.6391 0.000291122 12.1589 1.74414 8.73633C3.27811 5.72574 5.72574 3.27811 8.73633 1.74414C12.1589 0.000291248 16.6391 0 25.5996 0H81.4331Z"
              fill="white"
            />
          </svg>
          <!-- Постер фильма -->
          <img
            v-if="item.movie"
            :src="getImagePath(item.movie.poster)"
            :alt="item.movie.title"
            class="ticket-card__poster"
          />

          <!-- Информация о билете -->
          <div class="ticket-card__content">
            <div class="ticket-card__top">
              <p
                v-if="item.movie"
                class="ticket-card__meta"
              >
                {{ item.movie.ageRating }}
                ·
                {{ item.movie.genres.join(' · ') }}
                ·
                {{ Math.floor(item.movie.duration / 60) }} ч
                {{ item.movie.duration % 60 }} мин
              </p>

              <h2 class="ticket-card__title">
                {{ item.movie?.title ?? 'Фильм не найден' }}
              </h2>
            </div>

            <div
              v-if="item.session"
              class="ticket-card__details"
            >
              <div class="ticket-card__detail">
                <span class="ticket-card__detail-icon">
                  <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.98517 10.2991C4.20309 10.4238 4.38528 10.5187 4.51394 10.5828L4.875 10.75L5.23606 10.5828C5.36472 10.5187 5.54691 10.4238 5.76483 10.2991C6.19981 10.0503 6.78149 9.68005 7.36507 9.19533C8.51962 8.23636 9.75 6.7706 9.75 4.85901C9.75 2.17545 7.56739 0 4.875 0C2.18261 0 0 2.17545 0 4.85901C0 6.7706 1.23038 8.23636 2.38493 9.19533C2.96851 9.68005 3.55019 10.0503 3.98517 10.2991ZM4.875 2.875C3.77043 2.875 2.875 3.77043 2.875 4.875C2.875 5.97957 3.77043 6.875 4.875 6.875C5.97957 6.875 6.875 5.97957 6.875 4.875C6.875 3.77043 5.97957 2.875 4.875 2.875Z" fill-rule="evenodd" clip-rule="evenodd" fill="#161A21" />
                  </svg>
                </span>

                <span>Буревестник</span>
              </div>

              <div class="ticket-card__detail">
                <span class="ticket-card__detail-icon">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.375 0C8.34353 0 10.75 2.40647 10.75 5.375C10.75 8.34353 8.34353 10.75 5.375 10.75C2.40647 10.75 0 8.34353 0 5.375C0 2.40647 2.40647 0 5.375 0ZM4.875 2.875V5.58203L6.27148 6.97852L6.97852 6.27148L5.875 5.16797V2.875H4.875Z" fill="#161A21" />
                  </svg>
                </span>

                <span>
                  {{ formatDate(item.session.startsAt) }},
                  {{ formatTime(item.session.startsAt) }}
                </span>
              </div>

              <div
                v-if="item.seat"
                class="ticket-card__detail"
              >
                <span class="ticket-card__detail-icon">
                  <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.25 6.5L9.25 0.375414C9.25 0.168328 9.08214 0.000443062 8.87505 0.00041446L5.5 -5.17388e-05L5.5 0.612243C5.5 1.09549 5.10825 1.48724 4.625 1.48724C4.14175 1.48724 3.75 1.09549 3.75 0.612244L3.75 -5.16623e-05L0.374948 0.000414832C0.167861 0.000443451 -4.6254e-07 0.168328 -4.53488e-07 0.375415L-1.85773e-07 6.5L9.25 6.5Z" fill="#161A21" />
                    <path d="M-1.5299e-07 7.25L-1.63918e-08 10.375C-7.33885e-09 10.5821 0.167893 10.75 0.375 10.75L3.75 10.75L3.75 10.1384C3.75 9.6552 4.14175 9.26345 4.625 9.26345C5.10825 9.26345 5.5 9.6552 5.5 10.1384L5.5 10.75L8.875 10.75C9.08211 10.75 9.25 10.5821 9.25 10.375L9.25 7.25L-1.5299e-07 7.25Z" fill="#161A21" />
                  </svg>
                </span>

                <strong>
                  {{ item.seat.row }} ряд · {{ item.seat.number }} место
                </strong>
              </div>
            </div>
          </div>

          <!-- Область штрихкода -->
          <div class="ticket-card__barcode">
            <svg width="25" height="108" viewBox="0 0 25 108" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.4994 -5.46419e-07L0 -1.09278e-06L-1.49005e-08 0.340883L-2.9801e-08 0.681766L12.4994 0.681767L24.9988 0.681768L24.9988 0.340884L24.9988 0L12.4994 -5.46419e-07ZM12.4994 3.48905L-1.52511e-07 3.48904L-1.67412e-07 3.82993L-1.82312e-07 4.17081L12.4994 4.17081L24.9988 4.17081L24.9988 3.82993L24.9988 3.48905L12.4994 3.48905ZM12.4994 4.85258L-2.12113e-07 4.85258L-2.69962e-07 6.17601L-3.27811e-07 7.49944L12.4994 7.49944L24.9988 7.49944L24.9988 6.17601L24.9988 4.85258L12.4994 4.85258ZM12.4994 8.18121L-3.57612e-07 8.18121L-4.09326e-07 9.36428L-4.61039e-07 10.5473L12.4994 10.5473L24.9988 10.5473L24.9988 9.36428L24.9988 8.18121L12.4994 8.18121ZM12.4994 11.6703L-5.10123e-07 11.6703L-5.25024e-07 12.0111L-5.39924e-07 12.352L12.4994 12.352L24.9988 12.352L24.9988 12.0111L24.9988 11.6703L12.4994 11.6703ZM12.4994 13.4749L-5.89008e-07 13.4749L-6.40722e-07 14.658L-6.92435e-07 15.8411L12.4994 15.8411L24.9988 15.8411L24.9988 14.658L24.9988 13.4749L12.4994 13.4749ZM12.4994 16.5228L-7.22236e-07 16.5228L-7.7395e-07 17.7059L-8.25663e-07 18.889L12.4994 18.889L24.9988 18.889L24.9988 17.7059L24.9988 16.5228L12.4994 16.5228ZM12.4994 21.8567L-9.55385e-07 21.8567L-9.70286e-07 22.1975L-9.85186e-07 22.5384L12.4994 22.5384L24.9988 22.5384L24.9988 22.1975L24.9988 21.8567L12.4994 21.8567ZM12.4994 23.3405L-1.02025e-06 23.3405L-1.03515e-06 23.6814L-1.05005e-06 24.0223L12.4994 24.0223L24.9988 24.0223L24.9988 23.6814L24.9988 23.3405L12.4994 23.3405ZM12.4994 24.8244L-1.08511e-06 24.8244L-1.10001e-06 25.1652L-1.11491e-06 25.5061L12.4994 25.5061L24.9988 25.5061L24.9988 25.1652L24.9988 24.8244L12.4994 24.8244ZM12.4994 26.3483L-1.15172e-06 26.3483L-1.16662e-06 26.6892L-1.18152e-06 27.0301L12.4994 27.0301L24.9988 27.0301L24.9988 26.6892L24.9988 26.3483L12.4994 26.3483ZM12.4994 28.5139L-1.24638e-06 28.5139L-1.2981e-06 29.697L-1.34981e-06 30.8801L12.4994 30.8801L24.9988 30.8801L24.9988 29.697L24.9988 28.5139L12.4994 28.5139ZM24.9721 33.4735C24.9575 33.4587 19.3328 33.4467 12.4727 33.4467L-1.462e-06 33.4467L-1.47778e-06 33.8076L-1.49356e-06 34.1686L12.4994 34.1686L24.9988 34.1686L24.9988 33.8344C24.9988 33.6506 24.9868 33.4881 24.9721 33.4735ZM12.4994 35.4118L-1.5479e-06 35.4118L-1.59961e-06 36.5949L-1.65133e-06 37.7779L12.4994 37.7779L24.9988 37.7779L24.9988 36.5949L24.9988 35.4118L12.4994 35.4118ZM12.4994 38.58L-1.68639e-06 38.58L-1.70129e-06 38.9209L-1.71619e-06 39.2618L12.4994 39.2618L24.9988 39.2618L24.9988 38.9209L24.9988 38.58L12.4994 38.58ZM12.4994 39.9035L-1.74424e-06 39.9035L-1.79595e-06 41.0865L-1.84766e-06 42.2696L12.4994 42.2696L24.9988 42.2696L24.9988 41.0865L24.9988 39.9035L12.4994 39.9035ZM24.9736 43.5811C24.9581 43.5656 19.3328 43.5529 12.4727 43.5529L-1.90376e-06 43.5529L-1.91954e-06 43.9139L-1.93532e-06 44.2749L12.4894 44.2648L24.9788 44.2547L24.9903 43.9321C24.9966 43.7546 24.9891 43.5967 24.9736 43.5811ZM12.4994 47.0821L-2.05802e-06 47.0821L-2.07292e-06 47.4229L-2.08782e-06 47.7638L12.4994 47.7638L24.9988 47.7638L24.9988 47.4229L24.9988 47.0821L12.4994 47.0821ZM12.4994 48.7664L-2.13165e-06 48.7664L-2.14655e-06 49.1073L-2.16145e-06 49.4482L12.4994 49.4482L24.9988 49.4482L24.9988 49.1073L24.9988 48.7664L12.4994 48.7664ZM12.4994 50.4107L-2.20352e-06 50.4107L-2.25523e-06 51.5938L-2.30695e-06 52.7768L12.4994 52.7768L24.9988 52.7768L24.9988 51.5938L24.9988 50.4107L12.4994 50.4107ZM12.4994 53.4586L-2.33675e-06 53.4586L-2.35165e-06 53.7995L-2.36655e-06 54.1404L12.4994 54.1404L24.9988 54.1404L24.9988 53.7995L24.9988 53.4586L12.4994 53.4586ZM12.4994 55.3836L-2.42089e-06 55.3836L-2.47261e-06 56.5667L-2.52432e-06 57.7497L12.4994 57.7497L24.9988 57.7497L24.9988 56.5667L24.9988 55.3836L12.4994 55.3836ZM12.4994 59.9554L-2.62074e-06 59.9554L-2.63564e-06 60.2963L-2.65054e-06 60.6372L12.4994 60.6372L24.9988 60.6372L24.9988 60.2963L24.9988 59.9554L12.4994 59.9554ZM12.4994 61.9606L-2.70839e-06 61.9606L-2.72329e-06 62.3015L-2.73819e-06 62.6424L12.4994 62.6424L24.9988 62.6424L24.9988 62.3015L24.9988 61.9606L12.4994 61.9606ZM12.4994 63.8054L-2.78902e-06 63.8054L-2.84074e-06 64.9885L-2.89245e-06 66.1716L12.4994 66.1716L24.9988 66.1716L24.9988 64.9885L24.9988 63.8054L12.4994 63.8054ZM12.4994 66.9335L-2.92576e-06 66.9335L-2.97747e-06 68.1166L-3.02918e-06 69.2997L12.4994 69.2997L24.9988 69.2997L24.9988 68.1166L24.9988 66.9335L12.4994 66.9335ZM12.4994 69.9814L-3.05899e-06 69.9814L-3.1107e-06 71.1645L-3.16241e-06 72.3476L12.4994 72.3476L24.9988 72.3476L24.9988 71.1645L24.9988 69.9814L12.4994 69.9814ZM12.4994 75.4757L-3.29915e-06 75.4757L-3.31405e-06 75.8166L-3.32895e-06 76.1574L12.4994 76.1574L24.9988 76.1574L24.9988 75.8166L24.9988 75.4757L12.4994 75.4757ZM12.4994 77.0798L-3.36927e-06 77.0798L-3.38417e-06 77.4207L-3.39907e-06 77.7616L12.4994 77.7616L24.9988 77.7616L24.9988 77.4207L24.9988 77.0798L12.4994 77.0798ZM12.4994 78.7241L-3.44114e-06 78.7241L-3.45604e-06 79.065L-3.47094e-06 79.4059L12.4994 79.4059L24.9988 79.4059L24.9988 79.065L24.9988 78.7241L12.4994 78.7241ZM12.4994 80.3283L-3.51126e-06 80.3283L-3.52616e-06 80.6691L-3.54106e-06 81.01L12.4994 81.01L24.9988 81.01L24.9988 80.6691L24.9988 80.3283L12.4994 80.3283ZM12.4994 81.9324L-3.58138e-06 81.9324L-3.59628e-06 82.2733L-3.61118e-06 82.6142L12.4994 82.6142L24.9988 82.6142L24.9988 82.2733L24.9988 81.9324L12.4994 81.9324ZM12.4994 85.3413L-3.73038e-06 85.3413L-3.7821e-06 86.5243L-3.83381e-06 87.7074L12.4994 87.7074L24.9988 87.7074L24.9988 86.5243L24.9988 85.3413L12.4994 85.3413ZM12.4994 88.71L-3.87764e-06 88.71L-3.89254e-06 89.0509L-3.90744e-06 89.3918L12.4994 89.3918L24.9988 89.3918L24.9988 89.0509L24.9988 88.71L12.4994 88.71ZM12.4994 90.3944L-3.95126e-06 90.3944L-4.00298e-06 91.5774L-4.05469e-06 92.7605L12.4994 92.7605L24.9988 92.7605L24.9988 91.5774L24.9988 90.3944L12.4994 90.3944ZM12.4994 94.0438L-4.11079e-06 94.0438L-4.12569e-06 94.3847L-4.14059e-06 94.7256L12.4994 94.7256L24.9988 94.7256L24.9988 94.3847L24.9988 94.0438L12.4994 94.0438ZM12.4994 95.4876L-4.17389e-06 95.4876L-4.22561e-06 96.6706L-4.27732e-06 97.8537L12.4994 97.8537L24.9988 97.8537L24.9988 96.6706L24.9988 95.4876L12.4994 95.4876ZM12.5 100.581L-4.39652e-06 100.581L-4.44824e-06 101.764L-4.49996e-06 102.947L12.4894 102.937L24.9788 102.927L24.9894 101.754L25 100.581L12.5 100.581ZM12.4994 105.634L-4.6174e-06 105.634L-4.66912e-06 106.817L-4.72083e-06 108L12.4994 108L24.9988 108L24.9988 106.817L24.9988 105.634L12.4994 105.634Z" fill-rule="evenodd" clip-rule="evenodd" fill="black" />
            </svg>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>


<style scoped lang="scss">
.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.ticket-card {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 150px;
  overflow: hidden;
  color: #171717;
  background: #fff;
  border-radius: 12px;
  position: relative;
  isolation: isolate;
  background: transparent;
  padding: 6px;
  overflow: hidden;

  &__background {
    position: absolute;
    z-index: -1;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  &__poster {
    flex: 0 0 112px;
    width: 112px;
    min-height: 150px;
    object-fit: cover;
    border-radius: 12px;
  }

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    padding: 14px 18px;
    margin-left: 22px;
  }

  &__top {
    margin-bottom: 14px;
  }

  &__meta {
    margin: 0 0 7px;
    color: #ACADB9;
    font-size: 10px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.25;
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: 10px 22px;
  }

  &__detail {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #ACADB9;
    font-size: 12px;
  }

  &__detail-icon {
    color: #555;
    font-size: 16px;
  }

  // Область штрихкода
  &__barcode {
    display: flex;
    flex: 0 0 45px;
    align-items: center;
    justify-content: center;
    margin: 10px 0;
    border-left: 1px dashed #bdbdbd;

    svg {
      display: block;
      width: 25px;
      height: 108px;
      flex-shrink: 0;
    }
  }
}

@media (max-width: 600px) {
  .tickets-list {
    gap: 14px;
  }

  .ticket-card {
    min-height: 125px;

    &__poster {
      flex-basis: 88px;
      width: 88px;
      min-height: 125px;
    }

    &__content {
      padding: 10px 12px;
    }

    &__top {
      margin-bottom: 10px;
    }

    &__title {
      font-size: 18px;
    }

    &__meta {
      font-size: 10px;
    }

    &__details {
      gap: 7px 12px;
    }

    &__detail {
      gap: 6px;
      font-size: 12px;
    }
  }
}

</style>
