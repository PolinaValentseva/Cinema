
import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { Order, Payment, PaymentMethod } from '@/types';

import { orderApi, paymentApi } from '@/services/mock-api';

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
