
import type { Payment, PaymentMethod } from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

function getPayments(): Payment[] {
  return storage.get<Payment[]>(STORAGE_KEYS.PAYMENTS) ?? [];
}

const delay = (ms = 1200) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const paymentApi = {
  async pay(
    orderId: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<Payment> {
    await delay();

    // Временная имитация: 90% успешных оплат.
    const isSuccessful = Math.random() < 0.9;
    const completedAt = new Date().toISOString();

    const payment: Payment = {
      id: crypto.randomUUID(),
      orderId,
      amount,
      method,
      status: isSuccessful ? 'success' : 'failed',
      createdAt: completedAt,
      completedAt,
    };

    storage.set(STORAGE_KEYS.PAYMENTS, [
      ...getPayments(),
      payment,
    ]);

    if (!isSuccessful) {
      throw new Error('Не удалось выполнить оплату. Попробуйте ещё раз.');
    }

    return payment;
  },
  
  async getAll(): Promise<Payment[]> {
    return getPayments();
  },
};
