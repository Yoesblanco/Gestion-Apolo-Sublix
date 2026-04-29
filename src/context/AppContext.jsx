import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';

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
        stockHistory: Array.isArray(parsed.stockHistory) ? parsed.stockHistory : [],
      };
    }
  } catch (e) {
    console.warn('Error leyendo localStorage:', e);
  }
  return { transactions: [], orders: [], customers: [], products: [], toBuy: [], stockHistory: [] };
};

const saveToStorage = (data) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Error guardando en localStorage:', e);
  }
};

export const formatUSD = (val) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val ?? 0);

export const AppProvider = ({ children }) => {
  // Lazy initializer: se ejecuta UNA SOLA VEZ al montar el componente
  const [transactions, setTransactions] = useState(() => loadFromStorage().transactions);
  const [orders, setOrders] = useState(() => loadFromStorage().orders);
  const [customers, setCustomers] = useState(() => loadFromStorage().customers);
  const [products, setProducts] = useState(() => loadFromStorage().products);
  const [toBuy, setToBuy] = useState(() => loadFromStorage().toBuy);
  const [stockHistory, setStockHistory] = useState(() => loadFromStorage().stockHistory);

  // Flag para evitar guardar en localStorage en el primer render (ya viene de allí)
  const isFirstRender = useRef(true);

  // Guardar en localStorage cada vez que cambia el estado (omitir primera carga)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToStorage({ transactions, orders, customers, products, toBuy, stockHistory });
  }, [transactions, orders, customers, products, toBuy, stockHistory]);

  // Intentar sincronizar con el backend solo si está disponible (opcional)
  useEffect(() => {
    fetch(`http://${window.location.hostname}:5000/api/data`)
      .then(res => res.json())
      .then(data => {
        // Solo usamos los datos del backend si contienen información real
        if (Array.isArray(data.transactions) && data.transactions.length > 0) setTransactions(data.transactions);
        if (Array.isArray(data.orders) && data.orders.length > 0) setOrders(data.orders);
        if (Array.isArray(data.customers) && data.customers.length > 0) setCustomers(data.customers);
        if (Array.isArray(data.products) && data.products.length > 0) setProducts(data.products);
        if (Array.isArray(data.toBuy) && data.toBuy.length > 0) setToBuy(data.toBuy);
        if (Array.isArray(data.stockHistory) && data.stockHistory.length > 0) setStockHistory(data.stockHistory);
      })
      .catch(() => { /* Backend offline — localStorage es la fuente de verdad */ });
  }, []);

  // Sincronizar al backend cuando hay cambios (no bloquea, falla silenciosamente)
  useEffect(() => {
    if (isFirstRender.current) return;
    const ctrl = new AbortController();
    fetch(`http://${window.location.hostname}:5000/api/data/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, orders, transactions, customers, toBuy, stockHistory }),
      signal: ctrl.signal,
    }).catch(() => { });
    return () => ctrl.abort();
  }, [transactions, orders, customers, products, toBuy, stockHistory]);

  // Calcular saldos reactivamente (se recalcula automáticamente cuando transactions cambia)
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
    stockHistory, setStockHistory,
    salesTotals,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
