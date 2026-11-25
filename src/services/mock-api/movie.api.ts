
import type { Movie } from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

const delay = (ms = 300) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const initialMovies: Movie[] = [
  {
    id: 'movie-1',
    title: 'Девятая планета',
    description:
      'Бывший военный возвращается на далёкую планету за потерянной любовью. Фантастический боевик с Юрой Борисовым',
    poster: "posters/9-planeta.jpg",
    duration: 103,
    ageRating: '18+',
    isPushkinCardAvailable: false,
    genres: ['Фантастика'],
  },
  {
    id: 'movie-2',
    title: 'Приключения мамонтёнка',
    description:
      'Группа исследователей отправляется за пределы нашей галактики, чтобы найти человечеству новый дом.',
    poster: "posters/mamontenok.jpg",
    duration: 79,
    ageRating: '6+',
    isPushkinCardAvailable: true,
    genres: ['Анимация'],
  },
  {
    id: 'movie-3',
    title: 'Руки вверх! 2',
    description:
      'История дружбы и надежды двух заключённых, которые пытаются сохранить веру в свободу.',
    poster: "posters/ruki-vverh.jpg",
    duration: 101,
    ageRating: '16+',
    isPushkinCardAvailable: true,
    genres: ['Биография'],
  },
];

function getMovies(): Movie[] {
  const storedMovies = storage.get<Movie[]>(STORAGE_KEYS.MOVIES);

  if (storedMovies) {
    return storedMovies;
  }

  storage.set(STORAGE_KEYS.MOVIES, initialMovies);

  return initialMovies;
}

export const movieApi = {
  async getAll(): Promise<Movie[]> {
    await delay();

    return getMovies();
  },

  async getById(movieId: string): Promise<Movie | null> {
    await delay();

    return getMovies().find((movie) => movie.id === movieId) ?? null;
  },
};
