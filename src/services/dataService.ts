import { apiClient } from './apiClient';
import { Product, Order, Transaction, Customer, ToBuyItem, ToBuyHistoryItem, StockHistoryItem } from '../types';

export interface FullDatabaseResponse {
  products: Product[];
  orders: Order[];
  transactions: Transaction[];
  customers: Customer[];
  toBuy: ToBuyItem[];
  stockHistory: StockHistoryItem[];
  toBuyHistory: ToBuyHistoryItem[];
  lastSync: number;
}

export interface SyncPayload {
  products?: Product[];
  orders?: Order[];
  transactions?: Transaction[];
  customers?: Customer[];
  toBuy?: ToBuyItem[];
  stockHistory?: StockHistoryItem[];
  toBuyHistory?: ToBuyHistoryItem[];
  timestamp?: number;
}

export const dataService = {
  fetchData: async (): Promise<FullDatabaseResponse> => {
    return apiClient<FullDatabaseResponse>('/api/data', {
      method: 'GET',
      requiresAuth: false,
    });
  },

  syncData: async (payload: SyncPayload): Promise<{ message: string; lastSync: number }> => {
    return apiClient<{ message: string; lastSync: number }>('/api/data/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: false,
    });
  },
};
