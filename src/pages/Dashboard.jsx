import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatUSD } from '../utils/formatters';
import { 
  TrendingUp, 
  Package, 
  Users, 
  Wallet,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import './Dashboard.css';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { salesTotals, products, customers, orders, transactions } = useAppContext();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  }, []);

  const stats = [
    { label: 'Balance Total', sub: 'Dinero en caja', value: `$${formatUSD(salesTotals.total)}`, icon: Wallet, color: '#0ea5e9', path: '/ventas' },
    { label: 'Inventario', sub: 'Productos registrados', value: products.length.toString(), icon: Package, color: '#10b981', path: '/inventario' },
    { label: 'Clientes', sub: 'Base de datos', value: customers.length.toString(), icon: Users, color: '#f59e0b', path: '/clientes' },
    { label: 'Pedidos', sub: 'Pendientes por entregar', value: (orders || []).filter(o => o && (o.status || 'Pendiente') !== 'Entregado').length.toString(), icon: ShoppingBag, color: '#8b5cf6', path: '/pedidos' },
  ];


  const upcomingOrders = useMemo(() => {
    return (orders || [])
      .filter(o => o && (o.status || 'Pendiente') !== 'Entregado')
      .sort((a, b) => new Date(a?.deliveryDate || 0) - new Date(b?.deliveryDate || 0))
      .slice(0, 3);
  }, [orders]);

  const recentTransactions = (transactions || []).slice(0, 5);

  const chartData = useMemo(() => {
    // 1. Crear un mapa para acceso rápido por fecha (YYYY-MM-DD)
    const dataMap = {};
    
    // 2. Generar las claves de los últimos 7 días
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ key, dateObj: d });
      dataMap[key] = { ingresos: 0, egresos: 0 };
    }

    // 3. Procesar transacciones una sola vez (O(n))
    (transactions || []).forEach(t => {
      if (!t?.date) return;
      try {
        let dateStr = "";
        
        if (typeof t.date === 'string') {
          // Si ya es ISO (contiene T), cortamos en la T
          if (t.date.includes('T')) {
            dateStr = t.date.split('T')[0];
          } else {
            // Intentamos parsear formatos como DD/MM/YYYY o YYYY-MM-DD
            const parts = t.date.split(/[\/\-,\s]+/);
            if (parts.length >= 3) {
              // Asumimos YYYY-MM-DD si la primera parte es de 4 dígitos, si no DD/MM/YYYY
              if (parts[0].length === 4) dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              else dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        } else if (t.date instanceof Date) {
          dateStr = t.date.toISOString().split('T')[0];
        }

        if (dataMap[dateStr]) {
          const amt = Number(t.amount) || 0;
          if (t.type?.toLowerCase() === 'ingreso') dataMap[dateStr].ingresos += amt;
          else if (t.type?.toLowerCase() === 'egreso') dataMap[dateStr].egresos += amt;
        }
      } catch (e) { /* Ignorar fallos de parseo en registros corruptos */ }
    });

    // 4. Convertir mapa a arreglo para la gráfica
    return days.map(d => ({
      day: d.dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
      ingresos: dataMap[d.key].ingresos,
      egresos: dataMap[d.key].egresos
    }));
  }, [transactions]);

  const maxVal = useMemo(() => {
    const vals = chartData.map(d => Math.max(d.ingresos, d.egresos));
    return Math.max(...vals, 10);
  }, [chartData]);

  const hasData = chartData.some(d => d.ingresos > 0 || d.egresos > 0);

  return (
    <div className="dashboard animate-fade-in">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-text">
          <h1>{greeting}, {user?.name?.split(' ')[0] || 'Administrador'}!</h1>
          <p>Esto es lo que está pasando en <span>{user?.businessName || 'Apolo Sublix'}</span> hoy.</p>
        </div>
        <div className="quick-actions-bar">
          <button className="action-btn" style={{ background: 'var(--danger)', color: 'white', border: 'none' }} onClick={() => {
            const finalData = {"users":[{"id":1,"email":"admin@apolosublix.com","password":"$2b$10$/2SvMH48cyWEnhlsfc7ORuwx3lumHS3cqJSaD.wxP7UVgYZQVmDqy","name":"Administrador"}],"products":[{"id":1777599513404,"name":"Termo skyni ","category":"Otros","stock":1,"price":9.05,"status":"Bajo Stock"},{"id":1777599426247,"name":"Llaveros","category":"Sublimación","stock":113,"price":0.26,"status":"En Stock"},{"id":1777220555022,"name":"Taza Blanca 11 Onz","category":"Sublimación","stock":67,"price":1.3,"status":"En Stock"},{"id":1777177327820,"name":"Sueter","category":"Sublimación","stock":2,"price":15,"status":"Bajo Stock"},{"id":1777175993294,"name":"Taza Magica 11onz","category":"Sublimación","stock":6,"price":2,"status":"Bajo Stock"}],"orders":[{"id":"ORD-387","customerId":1777578159094,"customer":"Yolimar Alfonzo","productName":"Taza Blanca 11 Onz","date":"2026-04-30","deliveryDate":"0026-05-08","total":8,"status":"Pendiente","desc":"","quantity":1,"pendingStockToSubtract":0,"payments":[]},{"id":"ORD-335","customerId":1777570301125,"customer":"Milagros","productName":"Taza Blanca 11 Onz","date":"2026-04-30","deliveryDate":"2026-04-02","total":16,"status":"Pendiente","desc":"","quantity":2,"pendingStockToSubtract":0,"payments":[]},{"id":"ORD-334","customer":"Cristina Devera","productName":"Termo skyni","date":"2026-04-26","deliveryDate":"2026-04-27","total":0,"status":"Pendiente","desc":"Pedido recuperado del historial","quantity":1,"pendingStockToSubtract":1,"payments":[]},{"id":"ORD-822","customer":"Hilaria Figueroa ","productName":"Taza Blanca ","date":"2026-04-26","deliveryDate":"2026-04-27","total":8,"status":"Entregado","desc":"Pedido recuperado del historial","quantity":1,"pendingStockToSubtract":0,"payments":[{"id":1777606398388.1028,"amount":8,"date":"2026-04-27","method":"Efectivo","notes":"Pago total recuperado"}]},{"id":"ORD-736","customer":"Keilys Flores","productName":"Taza Blanca ","date":"2026-04-26","deliveryDate":"2026-04-27","total":8,"status":"Entregado","desc":"Pedido recuperado del historial","quantity":1,"pendingStockToSubtract":0,"payments":[{"id":1777606398388.3118,"amount":8,"date":"2026-04-27","method":"Efectivo","notes":"Pago total recuperado"}]},{"id":"ORD-557","customerId":1777176385005,"customer":"Blaruth Mendoza","productName":"Sueter","date":"2026-04-26","deliveryDate":"2026-04-27","total":25,"status":"Pendiente","desc":"Pedido recuperado del historial","quantity":1,"pendingStockToSubtract":0,"payments":[]}],"transactions":[{"id":1777599513406,"date":"2026-05-01T01:38:33.404Z","amount":9.05,"type":"Egreso","category":"Inventario/Materia Prima","description":"Historial: Compra realizada desde la lista de \"Por comprar\". Producto nuevo solicitado para pedido de Cristina Devera (ORD-334) (1 unds de Termo skyni )","orderId":"ORD-334"},{"id":1777599449600,"date":"2026-05-01T01:37:29.599Z","amount":3.38,"type":"Egreso","category":"Inventario/Materia Prima","description":"Historial: Llegada de nueva mercancía (13 unds de Llaveros)","orderId":null},{"id":1777599426249,"date":"2026-05-01T01:37:06.247Z","amount":26,"type":"Egreso","category":"Inventario/Materia Prima","description":"Historial: Registro de producto nuevo (100 unds de Llaveros)","orderId":null},{"id":1777588519439,"date":"2026-04-30T22:35:19.438Z","amount":15,"type":"Egreso","category":"Inventario/Materia Prima","description":"Historial: Llegada de nueva mercancía (1 unds de Sueter)","orderId":null},{"id":1777588482824,"date":"2026-04-30T22:34:42.822Z","amount":26,"type":"Egreso","category":"Inventario/Materia Prima","description":"Historial: Registro de producto nuevo (100 unds de llaveros )","orderId":null},{"id":1777429509571,"date":"2026-04-29T02:25:09.570Z","amount":2,"type":"Egreso","category":"Inventario/Materia Prima","description":"Historial: Llegada de nueva mercancía (1 unds de Taza Magica 11onz)","orderId":null},{"id":1777177327822,"date":"2026-04-26T04:22:07.820Z","amount":15,"type":"Egreso","category":"Inventario/Materia Prima","description":"Historial: Registro de producto nuevo (1 unds de Sueter)","orderId":null},{"id":1777175993296,"date":"2026-04-26T03:59:53.294Z","amount":10,"type":"Egreso","category":"Inventario/Materia Prima","description":"Historial: Registro de producto nuevo (5 unds de Taza Magica 11onz)","orderId":null},{"id":1777606398389.1028,"date":"2026-04-27","amount":8,"type":"Ingreso","category":"Venta/Pedido","description":"Pago pedido ORD-822","orderId":"ORD-822"},{"id":1777606398389.3118,"date":"2026-04-27","amount":8,"type":"Ingreso","category":"Venta/Pedido","description":"Pago pedido ORD-736","orderId":"ORD-736"}],"customers":[{"id":1777578159094,"name":"Yolimar Alfonzo","phone":"0424968281","email":"","city":"No especificada"},{"id":1777570301125,"name":"Milagros","phone":"04167987651","email":"","city":"Puerto Ordaz"},{"id":1777220742698,"name":"Hilaria Figueroa ","phone":"04120550368","email":"","city":"No especificada"},{"id":1777220449689,"name":"Cristina Devera","phone":"04121937873","email":"","city":"No especificada"},{"id":1777176385005,"name":"Blaruth Mendoza","email":"","phone":"04161905593","city":"Guayana"},{"id":1777176249798,"name":"Keilys Flores","phone":"04249048235","email":"","city":"No especificada"}],"toBuy":[],"stockHistory":[{"id":1777599780758,"date":"2026-05-01T01:43:00.758Z","type":"Salida","productName":"Sueter","customer":"Blaruth Mendoza","quantity":1,"orderId":"ORD-557","notes":"Reserva para pedido"},{"id":1777599513405,"date":"2026-05-01T01:38:33.404Z","type":"Entrada","productName":"Termo skyni ","customer":"Compra Directa (Lista de Faltantes)","quantity":1,"orderId":"ORD-334","notes":"Compra realizada desde la lista de \"Por comprar\". Producto nuevo solicitado para pedido de Cristina Devera (ORD-334)"},{"id":1777599449599,"date":"2026-05-01T01:37:29.599Z","type":"Entrada","productName":"Llaveros","customer":"Reposición de Mercancía","quantity":13,"orderId":"N/A","notes":"Llegada de nueva mercancía"},{"id":1777599426248,"date":"2026-05-01T01:37:06.247Z","type":"Entrada","productName":"Llaveros","customer":"Inventario Inicial","quantity":100,"orderId":"N/A","notes":"Registro de producto nuevo"},{"id":1777588519438,"date":"2026-04-30T22:35:19.438Z","type":"Entrada","productName":"Sueter","customer":"Reposición de Mercancía","quantity":1,"orderId":"N/A","notes":"Llegada de nueva mercancía"},{"id":1777588482823,"date":"2026-04-30T22:34:42.822Z","type":"Entrada","productName":"llaveros ","customer":"Inventario Inicial","quantity":100,"orderId":"N/A","notes":"Registro de producto nuevo"},{"id":1777578159095,"date":"2026-04-30T19:42:39.095Z","type":"Salida","productName":"Taza Blanca 11 Onz","customer":"yoi","quantity":1,"orderId":"ORD-387","notes":"Reserva para pedido"},{"id":1777570301125,"date":"2026-04-30T17:31:41.125Z","type":"Salida","productName":"Taza Blanca 11 Onz","customer":"milagro","quantity":2,"orderId":"ORD-335","notes":"Reserva para pedido"},{"id":1777429509570,"date":"2026-04-29T02:25:09.570Z","type":"Entrada","productName":"Taza Magica 11onz","customer":"Reposición de Mercancía","quantity":1,"orderId":"N/A","notes":"Llegada de nueva mercancía"},{"id":1777220742698,"date":"2026-04-26T16:25:42.698Z","type":"Salida","productName":"Taza Blanca ","customer":"Hilaria Figueroa ","quantity":1,"orderId":"ORD-822","notes":"Reserva para pedido"},{"id":1777220581447,"date":"2026-04-26T16:23:01.447Z","type":"Salida","productName":"Taza Blanca ","customer":"Keilys Flores","quantity":1,"orderId":"ORD-736","notes":"Reserva para pedido"},{"id":1777220555023,"date":"2026-04-26T16:22:35.022Z","type":"Entrada","productName":"Taza Blanca ","customer":"Inventario Inicial","quantity":72,"orderId":"N/A","notes":"Registro de producto nuevo"},{"id":1777177327821,"date":"2026-04-26T04:22:07.820Z","type":"Entrada","productName":"Sueter","customer":"Inventario Inicial","quantity":1,"orderId":"N/A","notes":"Registro de producto nuevo"},{"id":1777175993295,"date":"2026-04-26T03:59:53.294Z","type":"Entrada","productName":"Taza Magica 11onz","customer":"Inventario Inicial","quantity":5,"orderId":"N/A","notes":"Registro de producto nuevo"}]};
            localStorage.setItem('apolo_app_data', JSON.stringify(finalData));
            window.location.reload();
          }}>
            <Clock size={18} /> Restaurar Final
          </button>
          <button className="action-btn primary" onClick={() => navigate('/pedidos')}>
            <Plus size={18} /> Nuevo Pedido
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="stat-card glass clickable-card" 
            onClick={() => navigate(stat.path)}
            style={{ '--accent-color': stat.color }}
          >
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-sub">{stat.sub}</span>
            </div>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="card-glow"></div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="main-content-row">
          {/* Gráfica de Evolución Temporal (Grande) */}
          <div className="dashboard-card glass evolution-chart-section">
            <div className="section-header-row">
              <div className="header-titles">
                <h3>Evolución Semanal</h3>
              </div>
              <div className="chart-legend-large">
                <div className="legend-item"><span className="dot income"></span> Ingresos</div>
                <div className="legend-item"><span className="dot expense"></span> Egresos</div>
              </div>
            </div>
            
            <div className="main-chart-container">
              {!hasData ? (
                <div className="empty-chart-msg">
                  <Clock size={40} opacity={0.2} />
                  <p>Sin movimientos</p>
                </div>
              ) : (
                <div className="evolution-bars">
                  {chartData.map((data, i) => (
                    <div key={i} className="evolution-column">
                      <div className="evolution-bar-group">
                        <div 
                          className="evo-bar income" 
                          style={{ height: `${(data.ingresos / maxVal) * 100}%` }}
                        >
                          {data.ingresos > 0 && <span className="evo-tooltip">${formatUSD(data.ingresos)}</span>}
                        </div>
                        <div 
                          className="evo-bar expense" 
                          style={{ height: `${(data.egresos / maxVal) * 100}%` }}
                        >
                          {data.egresos > 0 && <span className="evo-tooltip">-${formatUSD(data.egresos)}</span>}
                        </div>
                      </div>
                      <span className="evo-label">{data.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Próximas Entregas (Al lado, más pequeño) */}
          <div className="dashboard-card glass upcoming-orders-compact">
            <div className="section-header-row">
              <h3>Pedidos</h3>
              <Link to="/pedidos" className="view-link">Ver todo</Link>
            </div>
            <div className="compact-orders-list">
              {upcomingOrders.length === 0 ? (
                <p className="empty-msg">Todo al día</p>
              ) : (
                upcomingOrders.slice(0, 5).map(o => (
                  <div key={o.id || Math.random()} className="compact-order-item">
                    <div className="order-info">
                      <span className="o-client">{o.customerName}</span>
                      <span className="o-date">{o.deliveryDate}</span>
                    </div>
                    <span className="o-amount">${formatUSD(o.total || 0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
