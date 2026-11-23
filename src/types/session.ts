import type { ID, ISODateString } from './common';

export interface Session {
  id: ID;
  movieId: ID;
  startsAt: ISODateString;
  price: number;
}
