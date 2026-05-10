import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatUSD } from '../utils/formatters';
import { 
  Package, 
  Users, 
  Wallet,
  ShoppingBag,
  Plus,
  Clock,
  Calendar
} from 'lucide-react';
import './Dashboard.css';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { salesTotals, products, customers, orders, transactions } = useAppContext();

  const contextLabel = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Apertura de Jornada';
    if (hour < 18) return 'Continuidad Operativa';
    return 'Balance de Cierre';
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
          <span className="dashboard-date-badge">
            <Calendar size={14} />
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <h1>{contextLabel}</h1>
          <p>Bienvenido de nuevo, <span>{user?.name || 'Administrador'}</span>. Centro de mando de {user?.businessName || 'Apolo Sublix'}.</p>
        </div>
        <div className="quick-actions-bar">

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
                  <div key={o.id} className="compact-order-item">
                    <div className="order-info">
                      <span className="o-client">{o.customer}</span>
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
