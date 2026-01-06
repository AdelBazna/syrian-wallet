
import { Transaction, User } from '../types';

const USERS_KEY = 'wallet_v2_users';
const TRANSACTIONS_KEY = 'wallet_v2_transactions';
const CURRENT_USER_KEY = 'wallet_v2_current_user';
const GLOBAL_USD_RATE_KEY = 'wallet_v2_usd_rate';

export const storageService = {
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveUser: (user: User) => {
    try {
      const users = storageService.getUsers();
      if (!users.find(u => u.username === user.username)) {
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } catch (e) { console.error("Database Error", e); }
  },

  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  getTransactions: (userId: string): Transaction[] => {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      const all: Transaction[] = data ? JSON.parse(data) : [];
      return all.filter(t => t.userId === userId);
    } catch { return []; }
  },

  addTransaction: (transaction: Transaction) => {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      const all: Transaction[] = data ? JSON.parse(data) : [];
      all.push(transaction);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(all));
    } catch (e) { console.error("Database Write Error", e); }
  },

  updateTransaction: (transaction: Transaction) => {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      const all: Transaction[] = data ? JSON.parse(data) : [];
      const index = all.findIndex(t => t.id === transaction.id);
      if (index !== -1) {
        all[index] = transaction;
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(all));
      }
    } catch (e) { console.error("Database Update Error", e); }
  },

  deleteTransaction: (id: string) => {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      const all: Transaction[] = data ? JSON.parse(data) : [];
      const filtered = all.filter(t => t.id !== id);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
    } catch (e) { console.error("Database Delete Error", e); }
  },

  getGlobalUsdRate: (): number => {
    const rate = localStorage.getItem(GLOBAL_USD_RATE_KEY);
    return rate ? parseFloat(rate) : 15000;
  },

  setGlobalUsdRate: (rate: number) => {
    localStorage.setItem(GLOBAL_USD_RATE_KEY, rate.toString());
  }
};
