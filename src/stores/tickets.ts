
import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { Order, Ticket } from '@/types';

import { ticketApi } from '@/services/mock-api';

export const useTicketsStore = defineStore('tickets', () => {
  const tickets = ref<Ticket[]>([]);

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function createTickets(order: Order): Promise<Ticket[]> {
    const createdTickets = await ticketApi.createForOrder(order);

    const existingIds = new Set(tickets.value.map((ticket) => ticket.id));

    const newTickets = createdTickets.filter(
      (ticket) => !existingIds.has(ticket.id),
    );

    tickets.value.push(...newTickets);

    return createdTickets;
  }

  async function fetchUserTickets(userId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      tickets.value = await ticketApi.getByUserId(userId);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось загрузить билеты';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    tickets,
    isLoading,
    error,
    createTickets,
    fetchUserTickets,
  };
});
