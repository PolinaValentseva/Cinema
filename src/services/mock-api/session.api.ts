
import type { Session } from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

const delay = (ms = 300) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function createSessionDate(daysFromNow: number, hours: number): string {
  const date = new Date();

  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, 0, 0, 0);

  return date.toISOString();
}

const initialSessions: Session[] = [
  {
    id: 'session-1',
    movieId: 'movie-1',
    startsAt: createSessionDate(0, 18),
    price: 450,
  },
  {
    id: 'session-2',
    movieId: 'movie-1',
    startsAt: createSessionDate(0, 21),
    price: 500,
  },
  {
    id: 'session-3',
    movieId: 'movie-2',
    startsAt: createSessionDate(0, 19),
    price: 450,
  },
  {
    id: 'session-4',
    movieId: 'movie-2',
    startsAt: createSessionDate(1, 16),
    price: 400,
  },
  {
    id: 'session-5',
    movieId: 'movie-3',
    startsAt: createSessionDate(1, 20),
    price: 350,
  },
];

function getSessions(): Session[] {
  const storedSessions = storage.get<Session[]>(STORAGE_KEYS.SESSIONS);

  if (storedSessions) {
    return storedSessions;
  }

  storage.set(STORAGE_KEYS.SESSIONS, initialSessions);

  return initialSessions;
}

export const sessionApi = {
  async getAll(): Promise<Session[]> {
    await delay();

    return getSessions();
  },

  async getById(sessionId: string): Promise<Session | null> {
    await delay();

    return getSessions().find((session) => session.id === sessionId) ?? null;
  },

  async getByMovieId(movieId: string): Promise<Session[]> {
    await delay();

    return getSessions().filter((session) => session.movieId === movieId);
  },
};
