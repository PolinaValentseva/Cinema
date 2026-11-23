
<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useAuthStore } from '@/stores/auth';
import { useTicketsStore } from '@/stores/tickets';

import {
    movieApi,
    seatApi,
    sessionApi,
} from '@/services/mock-api';

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
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusLabel(status: Ticket['status']): string {
  const labels = {
    active: 'Активен',
    used: 'Использован',
    refunded: 'Возвращён',
  };

  return labels[status];
}

onMounted(loadTickets);
</script>

<template>
  <main class="tickets-page">
    <div class="tickets-page__container">
      <header class="tickets-page__header">
        <h1 class="tickets-page__title">Мои билеты</h1>
        <p class="tickets-page__description">
          Здесь хранятся ваши купленные билеты
        </p>
      </header>

      <div v-if="isLoading" class="tickets-page__message">
        Загружаем билеты...
      </div>

      <div v-else-if="error" class="tickets-page__message tickets-page__message--error">
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
          <img
            v-if="item.movie?.poster"
            :src="item.movie.poster"
            :alt="item.movie.title"
            class="ticket-card__poster"
          />

          <div class="ticket-card__content">
            <div class="ticket-card__top">
              <h2 class="ticket-card__title">
                {{ item.movie?.title ?? 'Фильм не найден' }}
              </h2>

              <span
                class="ticket-card__status"
                :class="`ticket-card__status--${item.ticket.status}`"
              >
                {{ getStatusLabel(item.ticket.status) }}
              </span>
            </div>

            <div v-if="item.session" class="ticket-card__details">
              <div class="ticket-card__detail">
                <span>Дата</span>
                <strong>{{ formatDate(item.session.startsAt) }}</strong>
              </div>

              <div class="ticket-card__detail">
                <span>Время</span>
                <strong>{{ formatTime(item.session.startsAt) }}</strong>
              </div>

              <div v-if="item.seat" class="ticket-card__detail">
                <span>Ряд</span>
                <strong>{{ item.seat.row }}</strong>
              </div>

              <div v-if="item.seat" class="ticket-card__detail">
                <span>Место</span>
                <strong>{{ item.seat.number }}</strong>
              </div>

              <div class="ticket-card__detail">
                <span>Стоимость</span>
                <strong>{{ item.session.price }} ₽</strong>
              </div>
            </div>

            <div class="ticket-card__footer">
              <span>Электронный билет</span>
              <span>{{ item.ticket.id.slice(0, 8) }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.tickets-page {
  min-height: 100%;
  padding: 40px 0 60px;

  &__container {
    width: min(100% - 40px, 1100px);
    margin: 0 auto;
  }

  &__header {
    margin-bottom: 32px;
  }

  &__title {
    margin: 0 0 10px;
    font-size: 32px;
    font-weight: 600;
  }

  &__description {
    margin: 0;
    color: var(--color-text-secondary, #888);
    font-size: 15px;
  }

  &__message {
    padding: 40px 20px;
    text-align: center;
    color: var(--color-text-secondary, #888);

    &--error {
      color: #e05252;
    }
  }

  &__retry {
    display: block;
    margin: 16px auto 0;
    padding: 10px 18px;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
  }

  &__empty {
    padding: 70px 20px;
    text-align: center;
    border: 1px solid var(--color-border, #333);
    border-radius: 16px;

    h2 {
      margin: 0 0 12px;
      font-size: 22px;
    }

    p {
      max-width: 440px;
      margin: 0 auto;
      color: var(--color-text-secondary, #888);
      line-height: 1.6;
    }
  }
}

.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ticket-card {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--color-border, #333);
  border-radius: 16px;
  background: var(--color-surface, #171717);

  &__poster {
    width: 150px;
    min-height: 210px;
    object-fit: cover;
  }

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    padding: 22px;
  }

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  &__status {
    flex-shrink: 0;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 12px;

    &--active {
      color: #36b77a;
      background: rgba(54, 183, 122, 0.12);
    }

    &--used {
      color: #999;
      background: rgba(153, 153, 153, 0.12);
    }

    &--refunded {
      color: #e05252;
      background: rgba(224, 82, 82, 0.12);
    }
  }

  &__details {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
  }

  &__detail {
    display: flex;
    flex-direction: column;
    gap: 7px;

    span {
      color: var(--color-text-secondary, #888);
      font-size: 13px;
    }

    strong {
      font-size: 15px;
      font-weight: 500;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: auto;
    padding-top: 20px;
    color: var(--color-text-secondary, #888);
    font-size: 12px;
  }
}

@media (max-width: 600px) {
  .tickets-page {
    padding-top: 28px;

    &__title {
      font-size: 26px;
    }
  }

  .ticket-card {
    flex-direction: column;

    &__poster {
      width: 100%;
      height: 190px;
      min-height: 0;
      object-position: center 30%;
    }

    &__content {
      padding: 18px;
    }

    &__top {
      flex-direction: column;
      margin-bottom: 20px;
    }

    &__details {
      gap: 18px;
    }
  }
}
</style>
