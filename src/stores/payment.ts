
import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { Order, Payment, PaymentMethod } from '@/types';

import {
  authApi,
  bankCardApi,
  movieApi,
  orderApi,
  paymentApi,
  sessionApi,
} from '@/services/mock-api';

import { useTicketsStore } from './tickets';

interface CheckoutData {
  userId: string;
  sessionId: string;
  seatIds: string[];
  totalPrice: number;
  method: PaymentMethod;
}

export const usePaymentStore = defineStore('payment', () => {
  const currentPayment = ref<Payment | null>(null);
  const currentOrder = ref<Order | null>(null);

  const isLoading = ref(false);
  const isSuccess = ref(false);
  const error = ref<string | null>(null);

  async function checkout(data: CheckoutData): Promise<void> {
    if (isLoading.value) {
      return;
    }

    isLoading.value = true;
    isSuccess.value = false;
    error.value = null;
    currentPayment.value = null;
    currentOrder.value = null;

    let order: Order | null = null;

    try {
      const cards = await bankCardApi.getAll(data.userId);

      if (data.method === 'bank-card' && cards.length === 0) {
        throw new Error(
          'Добавьте банковскую карту в личном кабинете, чтобы оплатить заказ.',
        );
      }

      if (data.method === 'pushkin-card') {
        const user = await authApi.getUserById(data.userId);

        if (!user?.isPushkinCardConnected) {
          throw new Error('Сначала подключите Пушкинскую карту в личном кабинете.');
        }

        const session = await sessionApi.getById(data.sessionId);

        if (!session) {
          throw new Error('Сеанс не найден.');
        }

        const movie = await movieApi.getById(session.movieId);

        if (!movie?.isPushkinCardAvailable) {
          throw new Error('Этот фильм нельзя оплатить Пушкинской картой.');
        }
      }

      // 1. Создаём заказ.
      order = await orderApi.create({
        userId: data.userId,
        sessionId: data.sessionId,
        seatIds: data.seatIds,
        totalPrice: data.totalPrice,
      });

      currentOrder.value = order;

      // 2. Выполняем имитацию оплаты.
      try {
        const payment = await paymentApi.pay(
          order.id,
          data.totalPrice,
          data.method,
          data.userId,
          data.sessionId,
        );

        currentPayment.value = payment;
      } catch (err) {
        await orderApi.updateStatus(order.id, 'cancelled');
        throw err;
      }

      // 3. Подтверждаем заказ.
      const paidOrder = await orderApi.updateStatus(order.id, 'paid');

      currentOrder.value = paidOrder;

      // 4. Создаём электронные билеты.
      const ticketsStore = useTicketsStore();

      await ticketsStore.createTickets(paidOrder);

      isSuccess.value = true;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Произошла ошибка при оплате';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function reset(): void {
    currentPayment.value = null;
    currentOrder.value = null;
    isSuccess.value = false;
    error.value = null;
    isLoading.value = false;
  }

  return {
    currentPayment,
    currentOrder,
    isLoading,
    isSuccess,
    error,
    checkout,
    reset,
  };
});
