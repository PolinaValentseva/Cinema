
import type { Order, OrderStatus } from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

function getOrders(): Order[] {
  return storage.get<Order[]>(STORAGE_KEYS.ORDERS) ?? [];
}

export const orderApi = {
  async create(data: Omit<Order, 'id' | 'status' | 'createdAt' | 'paidAt'>): Promise<Order> {
    const order: Order = {
      ...data,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    storage.set(STORAGE_KEYS.ORDERS, [...getOrders(), order]);

    return order;
  },

  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const orders = getOrders();
    const orderIndex = orders.findIndex((item) => item.id === orderId);

    if (orderIndex === -1) {
      throw new Error('Заказ не найден');
    }

    const updatedOrder: Order = {
      ...orders[orderIndex],
      status,
      ...(status === 'paid'
        ? { paidAt: new Date().toISOString() }
        : {}),
    };

    orders[orderIndex] = updatedOrder;
    storage.set(STORAGE_KEYS.ORDERS, orders);

    return updatedOrder;
  },

  async getByUserId(userId: string): Promise<Order[]> {
    return getOrders().filter((order) => order.userId === userId);
  },
};
