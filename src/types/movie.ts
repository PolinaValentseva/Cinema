import type { ID } from './common';

export interface Movie {
  id: ID;
  title: string;
  description: string;
  poster: string;
  duration: number;
  ageRating: string;
  genres: string[];
}
