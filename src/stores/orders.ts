
import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { Order } from '@/types';

import { orderApi } from '@/services/mock-api';

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([]);
  const currentOrder = ref<Order | null>(null);

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function createOrder(
    data: Omit<Order, 'id' | 'status' | 'createdAt' | 'paidAt'>,
  ): Promise<Order> {
    isLoading.value = true;
    error.value = null;

    try {
      const order = await orderApi.create(data);

      orders.value.push(order);
      currentOrder.value = order;

      return order;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось создать заказ';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateOrderStatus(
    orderId: string,
    status: Order['status'],
  ): Promise<Order> {
    const order = await orderApi.updateStatus(orderId, status);

    const index = orders.value.findIndex((item) => item.id === orderId);

    if (index !== -1) {
      orders.value[index] = order;
    }

    if (currentOrder.value?.id === orderId) {
      currentOrder.value = order;
    }

    return order;
  }

  async function fetchUserOrders(userId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      orders.value = await orderApi.getByUserId(userId);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось загрузить заказы';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    orders,
    currentOrder,
    isLoading,
    error,
    createOrder,
    updateOrderStatus,
    fetchUserOrders,
  };
});
