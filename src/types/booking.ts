import type { ID, ISODateString } from './common';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: ID;
  userId: ID;
  sessionId: ID;
  seatIds: ID[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: ISODateString;
  paidAt?: ISODateString;
}
