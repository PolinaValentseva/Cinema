import { storage, STORAGE_KEYS } from '@/services/storage';
import type { Payment, PaymentMethod } from '@/types';

import { authApi } from './auth.api';
import { bankCardApi } from './bank-card.api';
import { movieApi } from './movie.api';
import { sessionApi } from './session.api';

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
  userId: string,
  sessionId: string,
): Promise<Payment> {
  await delay();

  const user = await authApi.getUserById(userId);

  if (!user) {
    throw new Error('Пользователь не найден.');
  }

  if (method === 'bank-card') {
    const cards = await bankCardApi.getAll(userId);

    if (cards.length === 0) {
      throw new Error('Добавьте банковскую карту в личном кабинете.');
    }
  }

  if (method === 'pushkin-card') {
    if (!user.isPushkinCardConnected) {
      throw new Error('Сначала подключите Пушкинскую карту в личном кабинете.');
    }

    const session = await sessionApi.getById(sessionId);

    if (!session) {
      throw new Error('Сеанс не найден.');
    }

    const movie = await movieApi.getById(session.movieId);

    if (!movie || !movie.isPushkinCardAvailable) {
      throw new Error('Этот фильм нельзя оплатить Пушкинской картой.');
    }
  }

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
