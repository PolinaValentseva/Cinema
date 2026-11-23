import type { ID, ISODateString } from './common';

export type TicketStatus =
  | 'active'
  | 'used'
  | 'refunded';

export interface Ticket {
  id: ID;
  orderId: ID;
  userId: ID;
  sessionId: ID;
  seatId: ID;
  status: TicketStatus;
  createdAt: ISODateString;
}
