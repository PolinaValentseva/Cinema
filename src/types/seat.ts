import type { ID } from './common';

export interface Seat {
  id: ID;
  sessionId: ID;
  row: number;
  number: number;
}

export type SeatStatus =
  | 'available'
  | 'occupied'
  | 'selected';
