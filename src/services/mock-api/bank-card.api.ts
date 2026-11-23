
import type { AddBankCardData, BankCard } from '@/types';

import { storage, STORAGE_KEYS } from '@/services/storage';

function getCards(): BankCard[] {
  return storage.get<BankCard[]>(STORAGE_KEYS.BANK_CARDS) ?? [];
}

export const bankCardApi = {
  async getAll(): Promise<BankCard[]> {
    return getCards();
  },

  async add(data: AddBankCardData): Promise<BankCard> {
    const cardNumber = data.cardNumber.replace(/\s/g, '');

    if (!/^\d{12,19}$/.test(cardNumber)) {
      throw new Error('Проверьте номер карты');
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiryDate)) {
      throw new Error('Введите срок действия в формате ММ/ГГ');
    }

    const card: BankCard = {
      id: crypto.randomUUID(),
      bankName: data.bankName.trim(),
      holderName: data.holderName.trim().toUpperCase(),
      lastFourDigits: cardNumber.slice(-4),
      expiryDate: data.expiryDate,
    };

    if (!card.bankName || !card.holderName) {
      throw new Error('Заполните все поля');
    }

    storage.set(STORAGE_KEYS.BANK_CARDS, [...getCards(), card]);

    return card;
  },

  async remove(cardId: string): Promise<void> {
    const cards = getCards().filter((card) => card.id !== cardId);
    storage.set(STORAGE_KEYS.BANK_CARDS, cards);
  },
};
