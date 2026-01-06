
import { Transaction, User, TransactionType } from '../types';

const USERS_KEY = 'wallet_users';
const TRANSACTIONS_KEY = 'wallet_transactions';
const CURRENT_USER_KEY = 'wallet_current_user';
const GLOBAL_USD_RATE_KEY = 'wallet_global_usd_rate';

export const storageService = {
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(USERS_KEY);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  },

  saveUser: (user: User) => {
    try {
      const users = storageService.getUsers();
      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) { console.error("Error saving user", e); }
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
      if (!Array.isArray(all)) return [];
      return all.filter(t => t.userId === userId);
    } catch { return []; }
  },

  addTransaction: (transaction: Transaction) => {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      const all: Transaction[] = data ? JSON.parse(data) : [];
      const updated = Array.isArray(all) ? [...all, transaction] : [transaction];
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
    } catch (e) { console.error("Error adding transaction", e); }
  },

  deleteTransaction: (id: string) => {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      const all: Transaction[] = data ? JSON.parse(data) : [];
      if (!Array.isArray(all)) return;
      const filtered = all.filter(t => t.id !== id);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
    } catch (e) { console.error("Error deleting transaction", e); }
  },

  getGlobalUsdRate: (): number => {
    const rate = localStorage.getItem(GLOBAL_USD_RATE_KEY);
    return rate ? parseFloat(rate) : 15000;
  },

  setGlobalUsdRate: (rate: number) => {
    localStorage.setItem(GLOBAL_USD_RATE_KEY, rate.toString());
  },

  exportData: () => {
    const data = {
      transactions: localStorage.getItem(TRANSACTIONS_KEY),
      users: localStorage.getItem(USERS_KEY),
      rate: localStorage.getItem(GLOBAL_USD_RATE_KEY)
    };
    return JSON.stringify(data);
  },

  downloadBackup: () => {
    const data = storageService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.transactions) localStorage.setItem(TRANSACTIONS_KEY, parsed.transactions);
      if (parsed.users) localStorage.setItem(USERS_KEY, parsed.users);
      if (parsed.rate) localStorage.setItem(GLOBAL_USD_RATE_KEY, parsed.rate);
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  },

  // Generates a link containing the compressed data
  generateSyncUrl: () => {
    const data = storageService.exportData();
    const encoded = btoa(unescape(encodeURIComponent(data)));
    const url = new URL(window.location.href);
    url.searchParams.set('sync', encoded);
    return url.toString();
  },

  // Loads data from a sync link if present
  loadFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const syncData = params.get('sync');
    if (syncData) {
      try {
        const decoded = decodeURIComponent(escape(atob(syncData)));
        if (storageService.importData(decoded)) {
          // Clear URL and reload to apply
          const url = new URL(window.location.href);
          url.searchParams.delete('sync');
          window.history.replaceState({}, '', url.toString());
          return true;
        }
      } catch (e) {
        console.error("Sync link invalid", e);
      }
    }
    return false;
  }
};
