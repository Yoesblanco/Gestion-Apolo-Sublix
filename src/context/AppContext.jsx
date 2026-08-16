import { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
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
        theme: parsed.theme || 'dark',
        lastUpdated: parsed.lastUpdated || 0
      };
    }
  } catch (e) {
    console.warn('Error leyendo localStorage:', e);
  }
  return { transactions: [], orders: [], customers: [], products: [], toBuy: [], toBuyHistory: [], stockHistory: [], theme: 'dark', lastUpdated: 0 };
};

const saveToStorage = (data) => {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Error guardando en localStorage:', e);
  }
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://gestion-apolo-sublix.onrender.com';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataLoadedCorrectly, setDataLoadedCorrectly] = useState(false); // Nuevo candado de seguridad

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

  // Carga inicial desde el servidor
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/data`);
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        const data = await res.json();
        
        const localData = loadFromStorage();

        // --- LÓGICA DE RECUPERACIÓN INTELIGENTE ---
        // El servidor es SIEMPRE la fuente de verdad cuando tiene datos.
        // El localStorage solo se usa como respaldo offline o para recuperar
        // una base de datos que quedó vacía por error.
        const serverHasData = (
          (Array.isArray(data.products)      && data.products.length > 0) ||
          (Array.isArray(data.orders)        && data.orders.length > 0)   ||
          (Array.isArray(data.customers)     && data.customers.length > 0) ||
          (Array.isArray(data.transactions)  && data.transactions.length > 0)
        );
        const localIsEmpty = (
          localData.orders.length === 0 &&
          localData.customers.length === 0 &&
          localData.products.length === 0
        );

        if (!serverHasData && !localIsEmpty) {
          // MODO RECUPERACIÓN: El servidor está completamente vacío pero tenemos
          // datos locales. Mantenemos lo local para que el sync lo suba.
          console.log('⚠️ Base de datos vacía en servidor. Iniciando modo recuperación desde datos locales...');
          addToast('Recuperando datos desde este dispositivo...', 'info');
        } else if (serverHasData) {
          // CASO NORMAL: El servidor tiene datos → siempre gana.
          // Esto previene que un dispositivo con datos locales stale
          // sobreescriba eliminaciones hechas desde otro dispositivo.
          console.log('✅ Sincronizando desde servidor (fuente de verdad)...');
          if (Array.isArray(data.transactions)) setTransactions(data.transactions);
          if (Array.isArray(data.orders))       setOrders(data.orders);
          if (Array.isArray(data.customers))    setCustomers(data.customers);
          if (Array.isArray(data.products))     setProducts(data.products);
          if (Array.isArray(data.toBuy))        setToBuy(data.toBuy);
          if (Array.isArray(data.toBuyHistory)) setToBuyHistory(data.toBuyHistory);
          if (Array.isArray(data.stockHistory)) setStockHistory(data.stockHistory);
        } else {
          // Servidor y local ambos vacíos: no hay nada que hacer.
          console.log('ℹ️ Sin datos en servidor ni local.');
        }
        
        setDataLoadedCorrectly(true);
      } catch (err) {
        console.warn('⚠️ Usando datos locales: No se pudo contactar con el servidor.');
        // Si hay datos locales, permitimos operar en modo offline.
        // En este caso NO sincronizamos hacia el servidor para evitar
        // subir datos que podrían estar desactualizados.
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

  const syncTimestamp = useRef(Date.now());

  // Sincronizar al backend cuando hay cambios
  useEffect(() => {
    // EL CANDADO: Solo sincronizamos si la app está inicializada Y los datos cargaron correctamente
    if (!isInitialized || !dataLoadedCorrectly) return;
    
    syncTimestamp.current = Date.now();
    
    fetch(`${API_BASE_URL}/api/data/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        products, orders, transactions, customers, toBuy, toBuyHistory, stockHistory,
        timestamp: syncTimestamp.current
      }),
    }).catch(() => { });
  }, [transactions, orders, customers, products, toBuy, toBuyHistory, stockHistory, isInitialized, dataLoadedCorrectly]);

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
