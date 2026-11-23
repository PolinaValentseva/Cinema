import type { ID, ISODateString } from './common';

export type PaymentStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'cancelled';

export type PaymentMethod =
  | 'bank-card'
  | 'pushkin-card';

export interface Payment {
  id: ID;
  orderId: ID;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: ISODateString;
  completedAt?: ISODateString;
}
