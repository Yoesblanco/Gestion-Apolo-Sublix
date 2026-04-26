import React, { createContext, useContext, useState, useMemo } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const salesTotals = useMemo(() => {
    const ingresos = transactions
      .filter(t => t.type === 'ingreso')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const egresos = transactions
      .filter(t => t.type === 'egreso')
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { 
      total: ingresos - egresos, 
      ingresos, 
      egresos, 
      count: transactions.length 
    };
  }, [transactions]);

  const value = {
    transactions,
    setTransactions,
    orders,
    setOrders,
    customers,
    setCustomers,
    products,
    setProducts,
    salesTotals
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
