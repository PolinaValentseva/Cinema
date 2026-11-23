
import type { ID } from './common';

export interface BankCard {
  id: ID;
  bankName: string;
  holderName: string;
  lastFourDigits: string;
  expiryDate: string;
}

export interface AddBankCardData {
  bankName: string;
  holderName: string;
  cardNumber: string;
  expiryDate: string;
}
