
import type { Movie } from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

const delay = (ms = 300) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const initialMovies: Movie[] = [
  {
    id: 'movie-1',
    title: 'Начало',
    description:
      'Профессиональный вор проникает в подсознание людей, чтобы похищать секреты. Теперь ему предстоит выполнить практически невозможную задачу.',
    poster: 'https://placehold.co/300x450/171717/FFFFFF?text=Inception',
    duration: 148,
    ageRating: '12+',
    isPushkinCardAvailable: false,
    genres: ['Фантастика', 'Боевик', 'Триллер'],
  },
  {
    id: 'movie-2',
    title: 'Интерстеллар',
    description:
      'Группа исследователей отправляется за пределы нашей галактики, чтобы найти человечеству новый дом.',
    poster: 'https://placehold.co/300x450/171717/FFFFFF?text=Interstellar',
    duration: 169,
    ageRating: '12+',
    isPushkinCardAvailable: true,
    genres: ['Фантастика', 'Драма', 'Приключения'],
  },
  {
    id: 'movie-3',
    title: 'Побег из Шоушенка',
    description:
      'История дружбы и надежды двух заключённых, которые пытаются сохранить веру в свободу.',
    poster: 'https://placehold.co/300x450/171717/FFFFFF?text=Shawshank',
    duration: 142,
    ageRating: '18+',
    isPushkinCardAvailable: true,
    genres: ['Драма'],
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
