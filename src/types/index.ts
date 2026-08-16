export * from './auth';

export interface Product {
  id: string;
  name: string;
  category?: string | null;
  stock: number;
  price: number;
  cost?: number | null;
  minStock?: number | null;
  status?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface Payment {
  id: number;
  orderId?: string;
  amount: number;
  date?: string | null;
  paymentDate?: string | null;
  method?: string | null;
  notes?: string | null;
  transactionId?: string | number | null;
}

export interface Order {
  id: string;
  customerId?: string | null;
  customer?: string | null;
  productName?: string | null;
  productId?: string | null;
  date?: string | null;
  deliveryDate?: string | null;
  total: number;
  status: string;
  desc?: string | null;
  quantity: number;
  pendingStockToSubtract?: number | null;
  payments?: Payment[];
}

export interface Transaction {
  id: string;
  date?: string | null;
  amount: number;
  type: string;
  category?: string | null;
  method?: string | null;
  description?: string | null;
  orderId?: string | null;
}

export interface StockHistoryItem {
  id: string | number;
  date?: string | null;
  type?: string | null;
  productName?: string | null;
  customer?: string | null;
  quantity?: number | null;
  orderId?: string | null;
  notes?: string | null;
}

export interface ToBuyItem {
  id: string;
  productName: string;
  quantity: number;
  notes?: string | null;
  orderDescription?: string | null;
  status: string;
  dateAdded?: string | null;
  orderId?: string | null;
  customer?: string | null;
  productId?: string | null;
}

export interface ToBuyHistoryItem {
  id: string;
  productName: string;
  quantity: number;
  notes?: string | null;
  orderDescription?: string | null;
  status?: string | null;
  dateAdded?: string | null;
  orderId?: string | null;
  customer?: string | null;
  dateBought?: string | null;
  purchasePrice?: number | null;
  productId?: string | null;
  transactionId?: string | null;
}

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
