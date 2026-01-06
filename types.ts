
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export type Currency = 'OLD_SYP' | 'NEW_SYP' | 'USD';

export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Normalized amount in NEW_SYP for calculations
  originalAmount: number;
  inputCurrency: Currency;
  usdRate?: number; // Rate of 1 USD to NEW_SYP at time of transaction
  description: string;
  notes?: string; // Additional details for the payment
  type: TransactionType;
  date: string; // ISO string format YYYY-MM-DD
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  password?: string;
}
