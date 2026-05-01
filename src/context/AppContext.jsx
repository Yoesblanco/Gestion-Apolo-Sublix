import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { formatUSD } from '../utils/formatters';

const AppContext = createContext();
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
        theme: parsed.theme || 'dark'
      };
    }
  } catch (e) {
    console.warn('Error leyendo localStorage:', e);
  }
  return { transactions: [], orders: [], customers: [], products: [], toBuy: [], toBuyHistory: [], stockHistory: [], theme: 'dark' };
};

const saveToStorage = (data) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Error guardando en localStorage:', e);
  }
};

export const AppProvider = ({ children }) => {
  const storedData = useMemo(() => loadFromStorage(), []);
  
  const [transactions, setTransactions] = useState(storedData.transactions);
  const [orders, setOrders] = useState(storedData.orders);
  const [customers, setCustomers] = useState(storedData.customers);
  const [products, setProducts] = useState(storedData.products);
  const [toBuy, setToBuy] = useState(storedData.toBuy);
  const [toBuyHistory, setToBuyHistory] = useState(storedData.toBuyHistory);
  const [stockHistory, setStockHistory] = useState(storedData.stockHistory);
  const [theme, setTheme] = useState(storedData.theme);
  const [toasts, setToasts] = useState([]);

  // Flag para evitar guardar en localStorage en el primer render (ya viene de allí)
  const isFirstRender = useRef(true);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Guardar en localStorage cada vez que cambia el estado (omitir primera carga)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToStorage({ transactions, orders, customers, products, toBuy, toBuyHistory, stockHistory, theme });
  }, [transactions, orders, customers, products, toBuy, toBuyHistory, stockHistory, theme]);

  // Aplicar tema al body
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Función para fusionar datos evitando duplicados por ID
  const mergeData = (local, remote) => {
    const map = new Map();
    local.forEach(item => map.set(item.id, item));
    remote.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  };

  // Carga inicial desde el servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:5000/api/data`);
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        const data = await res.json();
        
        // Al iniciar, el servidor es la fuente de verdad definitiva
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (Array.isArray(data.customers)) setCustomers(data.customers);
        if (Array.isArray(data.products)) setProducts(data.products);
        if (Array.isArray(data.toBuy)) setToBuy(data.toBuy);
        if (Array.isArray(data.toBuyHistory)) setToBuyHistory(data.toBuyHistory);
        if (Array.isArray(data.stockHistory)) setStockHistory(data.stockHistory);
        
        console.log('Datos sincronizados desde el servidor correctamente.');
      } catch (err) {
        console.warn('Usando datos locales: No se pudo contactar con el servidor.');
      }
    };
    fetchData();
  }, []);

  // Sincronizar al backend cuando hay cambios
  useEffect(() => {
    if (isFirstRender.current) return;
    const ctrl = new AbortController();
    fetch(`http://${window.location.hostname}:5000/api/data/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, orders, transactions, customers, toBuy, toBuyHistory, stockHistory }),
      signal: ctrl.signal,
    }).catch(() => { });
    return () => ctrl.abort();
  }, [transactions, orders, customers, products, toBuy, toBuyHistory, stockHistory]);

  const salesTotals = useMemo(() => {
    const ingresos = transactions
      .filter(t => t.type?.toLowerCase() === 'ingreso')
      .reduce((acc, t) => {
        const val = typeof t.amount === 'string' ? parseFloat(t.amount.replace(',', '.')) : Number(t.amount);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    const egresos = transactions
      .filter(t => t.type?.toLowerCase() === 'egreso')
      .reduce((acc, t) => {
        const val = typeof t.amount === 'string' ? parseFloat(t.amount.replace(',', '.')) : Number(t.amount);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    return {
      total: ingresos - egresos,
      ingresos,
      egresos,
      count: transactions.length,
    };
  }, [transactions]);

  const value = {
    transactions, setTransactions,
    orders, setOrders,
    customers, setCustomers,
    products, setProducts,
    toBuy, setToBuy,
    toBuyHistory, setToBuyHistory,
    stockHistory, setStockHistory,
    salesTotals,
    theme, setTheme,
    toasts, addToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
