
import type { AddBankCardData, BankCard } from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

function getCards(userId: BankCard['userId']): BankCard[] {
  return (
    storage
      .get<BankCard[]>(STORAGE_KEYS.BANK_CARDS)
      ?.filter((card) => card.userId === userId) ?? []
  );
}

export const bankCardApi = {
  async getAll(userId: BankCard['userId']): Promise<BankCard[]> {
    return getCards(userId);
  },

  async add(
    userId: BankCard['userId'],
    data: AddBankCardData,
  ): Promise<BankCard> {
    const cardNumber = data.cardNumber.replace(/\s/g, '');

    if (!/^\d{12,19}$/.test(cardNumber)) {
      throw new Error('Проверьте номер карты');
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiryDate)) {
      throw new Error('Введите срок действия в формате ММ/ГГ');
    }

    const card: BankCard = {
      id: crypto.randomUUID(),
      userId,
      bankName: data.bankName.trim(),
      holderName: data.holderName.trim().toUpperCase(),
      lastFourDigits: cardNumber.slice(-4),
      expiryDate: data.expiryDate,
    };

    if (!card.bankName || !card.holderName) {
      throw new Error('Заполните все поля');
    }

    storage.set(
      STORAGE_KEYS.BANK_CARDS,
      [
        ...(storage.get<BankCard[]>(STORAGE_KEYS.BANK_CARDS) ?? []),
        card,
      ],
    );

    return card;
  },

  async remove(
    cardId: string,
    userId: BankCard['userId'],
  ): Promise<void> {
    const cards =
      storage.get<BankCard[]>(STORAGE_KEYS.BANK_CARDS) ?? [];

    storage.set(
      STORAGE_KEYS.BANK_CARDS,
      cards.filter(
        (card) => !(card.id === cardId && card.userId === userId),
      ),
    );
  },
};
