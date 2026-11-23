
import type { Order, Ticket } from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

function getTickets(): Ticket[] {
  return storage.get<Ticket[]>(STORAGE_KEYS.TICKETS) ?? [];
}

export const ticketApi = {
  async createForOrder(order: Order): Promise<Ticket[]> {
    if (order.status !== 'paid') {
      throw new Error('Нельзя создать билеты для неоплаченного заказа');
    }

    const tickets = getTickets();

    // Защита от повторного создания билетов для одного заказа.
    const existingTickets = tickets.filter(
      (ticket) => ticket.orderId === order.id,
    );

    if (existingTickets.length > 0) {
      return existingTickets;
    }

    const newTickets: Ticket[] = order.seatIds.map((seatId) => ({
      id: crypto.randomUUID(),
      orderId: order.id,
      userId: order.userId,
      sessionId: order.sessionId,
      seatId,
      status: 'active',
      createdAt: new Date().toISOString(),
    }));

    storage.set(STORAGE_KEYS.TICKETS, [
      ...tickets,
      ...newTickets,
    ]);

    return newTickets;
  },

  async getByUserId(userId: string): Promise<Ticket[]> {
    return getTickets().filter((ticket) => ticket.userId === userId);
  },
};
