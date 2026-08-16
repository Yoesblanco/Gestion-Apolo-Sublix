import React, { createContext, useContext, useState, useMemo, useEffect, useRef, ReactNode, Dispatch, SetStateAction } from 'react';
import { Product, Order, Customer, Transaction, ToBuyItem, ToBuyHistoryItem, StockHistoryItem, ToastItem } from '../types';
import { dataService } from '../services/dataService';

export interface AppContextType {
  transactions: Transaction[];
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  orders: Order[];
  setOrders: Dispatch<SetStateAction<Order[]>>;
  customers: Customer[];
  setCustomers: Dispatch<SetStateAction<Customer[]>>;
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  toBuy: ToBuyItem[];
  setToBuy: Dispatch<SetStateAction<ToBuyItem[]>>;
  toBuyHistory: ToBuyHistoryItem[];
  setToBuyHistory: Dispatch<SetStateAction<ToBuyHistoryItem[]>>;
  stockHistory: StockHistoryItem[];
  setStockHistory: Dispatch<SetStateAction<StockHistoryItem[]>>;
  salesTotals: {
    total: number;
    ingresos: number;
    egresos: number;
    count: number;
  };
  theme: string;
  setTheme: Dispatch<SetStateAction<string>>;
  toasts: ToastItem[];
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const AppContext = createContext<AppContextType | null>(null);
const LS_KEY = 'apolo_app_data';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        products: Array.isArray(parsed.products) ? parsed.products : [],
        toBuy: Array.isArray(parsed.toBuy) ? parsed.toBuy : [],
        toBuyHistory: Array.isArray(parsed.toBuyHistory) ? parsed.toBuyHistory : [],
        stockHistory: Array.isArray(parsed.stockHistory) ? parsed.stockHistory : [],
        theme: parsed.theme || 'dark',
        lastUpdated: parsed.lastUpdated || 0,
      };
    }
  } catch (e) {
    console.warn('Error leyendo localStorage:', e);
  }
  return {
    transactions: [],
    orders: [],
    customers: [],
    products: [],
    toBuy: [],
    toBuyHistory: [],
    stockHistory: [],
    theme: 'dark',
    lastUpdated: 0,
  };
};

const saveToStorage = (data: any) => {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Error guardando en localStorage:', e);
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const storedData = useMemo(() => loadFromStorage(), []);

  const [transactions, setTransactions] = useState<Transaction[]>(storedData.transactions);
  const [orders, setOrders] = useState<Order[]>(storedData.orders);
  const [customers, setCustomers] = useState<Customer[]>(storedData.customers);
  const [products, setProducts] = useState<Product[]>(storedData.products);
  const [toBuy, setToBuy] = useState<ToBuyItem[]>(storedData.toBuy);
  const [toBuyHistory, setToBuyHistory] = useState<ToBuyHistoryItem[]>(storedData.toBuyHistory);
  const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>(storedData.stockHistory);
  const [theme, setTheme] = useState<string>(storedData.theme);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [dataLoadedCorrectly, setDataLoadedCorrectly] = useState<boolean>(false);

  const isFirstRender = useRef<boolean>(true);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToStorage({ transactions, orders, customers, products, toBuy, toBuyHistory, stockHistory, theme });
  }, [transactions, orders, customers, products, toBuy, toBuyHistory, stockHistory, theme]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Carga inicial desde el servidor usando dataService
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dataService.fetchData();
        const localData = loadFromStorage();

        const serverHasData =
          (Array.isArray(data.products) && data.products.length > 0) ||
          (Array.isArray(data.orders) && data.orders.length > 0) ||
          (Array.isArray(data.customers) && data.customers.length > 0) ||
          (Array.isArray(data.transactions) && data.transactions.length > 0);

        const localIsEmpty =
          localData.orders.length === 0 && localData.customers.length === 0 && localData.products.length === 0;

        if (!serverHasData && !localIsEmpty) {
          console.log('⚠️ Base de datos vacía en servidor. Iniciando modo recuperación desde datos locales...');
          addToast('Recuperando datos desde este dispositivo...', 'info');
        } else if (serverHasData) {
          console.log('✅ Sincronizando desde servidor (fuente de verdad)...');
          if (Array.isArray(data.transactions)) setTransactions(data.transactions);
          if (Array.isArray(data.orders)) setOrders(data.orders);
          if (Array.isArray(data.customers)) setCustomers(data.customers);
          if (Array.isArray(data.products)) setProducts(data.products);
          if (Array.isArray(data.toBuy)) setToBuy(data.toBuy);
          if (Array.isArray(data.toBuyHistory)) setToBuyHistory(data.toBuyHistory);
          if (Array.isArray(data.stockHistory)) setStockHistory(data.stockHistory);
        }

        setDataLoadedCorrectly(true);
      } catch {
        console.warn('⚠️ Usando datos locales: No se pudo contactar con el servidor.');
        const localData = loadFromStorage();
        if (localData.orders.length > 0 || localData.customers.length > 0 || localData.products.length > 0) {
          setDataLoadedCorrectly(true);
        }
      } finally {
        setIsInitialized(true);
      }
    };
    fetchData();
  }, []);

  const syncTimestamp = useRef<number>(Date.now());

  // Sincronizar al backend cuando hay cambios
  useEffect(() => {
    if (!isInitialized || !dataLoadedCorrectly) return;

    syncTimestamp.current = Date.now();

    dataService
      .syncData({
        products,
        orders,
        transactions,
        customers,
        toBuy,
        toBuyHistory,
        stockHistory,
        timestamp: syncTimestamp.current,
      })
      .catch(() => {});
  }, [transactions, orders, customers, products, toBuy, toBuyHistory, stockHistory, isInitialized, dataLoadedCorrectly]);

  const salesTotals = useMemo(() => {
    const ingresos = transactions
      .filter((t) => t.type?.toLowerCase() === 'ingreso')
      .reduce((acc, t) => {
        const val = typeof t.amount === 'string' ? parseFloat(String(t.amount).replace(',', '.')) : Number(t.amount);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    const egresos = transactions
      .filter((t) => t.type?.toLowerCase() === 'egreso')
      .reduce((acc, t) => {
        const val = typeof t.amount === 'string' ? parseFloat(String(t.amount).replace(',', '.')) : Number(t.amount);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    return {
      total: ingresos - egresos,
      ingresos,
      egresos,
      count: transactions.length,
    };
  }, [transactions]);

  const value: AppContextType = {
    transactions,
    setTransactions,
    orders,
    setOrders,
    customers,
    setCustomers,
    products,
    setProducts,
    toBuy,
    setToBuy,
    toBuyHistory,
    setToBuyHistory,
    stockHistory,
    setStockHistory,
    salesTotals,
    theme,
    setTheme,
    toasts,
    addToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe ser usado dentro de un AppProvider');
  }
  return context;
};
