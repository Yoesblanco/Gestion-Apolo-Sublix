import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatUSD } from '../utils/formatters';
import {
  Package,
  Users,
  Wallet,
  ShoppingBag,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
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
    { label: 'Pedidos', sub: 'Pendientes por entregar', value: (orders || []).filter((o) => o && (o.status || 'Pendiente') !== 'Entregado').length.toString(), icon: ShoppingBag, color: '#8b5cf6', path: '/pedidos' },
  ];

  const upcomingOrders = useMemo(() => {
    return (orders || [])
      .filter((o) => o && (o.status || 'Pendiente') !== 'Entregado')
      .sort((a, b) => new Date(a?.deliveryDate || 0).getTime() - new Date(b?.deliveryDate || 0).getTime())
      .slice(0, 5);
  }, [orders]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, { ingresos: number; egresos: number }> = {};

    const days: { key: string; dateObj: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ key, dateObj: d });
      dataMap[key] = { ingresos: 0, egresos: 0 };
    }

    (transactions || []).forEach((t) => {
      if (!t?.date) return;
      try {
        let dateStr = '';

        if (typeof t.date === 'string') {
          if (t.date.includes('T')) {
            dateStr = t.date.split('T')[0];
          } else {
            const parts = t.date.split(/[/\s,-]+/);
            if (parts.length >= 3) {
              if (parts[0].length === 4) dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              else dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        } else if (typeof t.date === 'object' && t.date !== null && 'toISOString' in (t.date as unknown as Record<string, unknown>)) {
          dateStr = (t.date as unknown as Date).toISOString().split('T')[0];
        }

        if (dataMap[dateStr]) {
          const amt = Number(t.amount) || 0;
          if (t.type?.toLowerCase() === 'ingreso') dataMap[dateStr].ingresos += amt;
          else if (t.type?.toLowerCase() === 'egreso') dataMap[dateStr].egresos += amt;
        }
      } catch {
        /* Ignorar fallos */
      }
    });

    return days.map((d) => ({
      day: d.dateObj.toLocaleDateString('es-ES', { weekday: 'short' }),
      date: d.dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      ingresos: dataMap[d.key].ingresos,
      egresos: dataMap[d.key].egresos,
    }));
  }, [transactions]);

  const maxVal = useMemo(() => {
    const vals = chartData.map((d) => Math.max(d.ingresos, d.egresos));
    return Math.max(...vals, 10);
  }, [chartData]);

  const hasData = chartData.some((d) => d.ingresos > 0 || d.egresos > 0);

  return (
    <div className="dashboard animate-fade-in">
      <div className="welcome-header">
        <div className="welcome-text">
          <span className="dashboard-date-badge">
            <Calendar size={14} />
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <h1>{contextLabel}</h1>
          <p>
            Bienvenido de nuevo, <span>{user?.name || 'Administrador'}</span>. Centro de mando de Apolo Sublix.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card glass clickable-card" onClick={() => navigate(stat.path)}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-sub">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="main-content-row">
        <div className="dashboard-card glass evolution-chart-section">
          <div className="card-header">
            <div className="header-title-with-icon">
              <ArrowUpRight className="text-accent" size={20} />
              <h3>Flujo de Caja Semanal</h3>
            </div>
            <div className="chart-legend-large">
              <span className="legend-item ingresos">Ingresos</span>
              <span className="legend-item egresos">Egresos</span>
            </div>
          </div>

          {!hasData ? (
            <div className="no-data-msg">No hay actividad financiera registrada esta semana</div>
          ) : (
            <>
              <div className="main-chart-container">
                <div className="evolution-bars">
                  {chartData.map((d, i) => (
                    <div key={i} className="evolution-column">
                      <div className="evolution-bar-group">
                        <div className="evo-bar income" style={{ height: `${(d.ingresos / maxVal) * 100}%` }} />
                        <div className="evo-bar expense" style={{ height: `${(d.egresos / maxVal) * 100}%` }} />
                      </div>
                      <span className="evo-label">{d.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-data-table">
                <div className="chart-table-header">
                  <span>Fecha</span>
                  <span className="col-ingreso">Ingreso</span>
                  <span className="col-egreso">Egreso</span>
                  <span className="col-balance">Balance</span>
                </div>
                {chartData.map((d, i) => {
                  const balance = d.ingresos - d.egresos;
                  const hasActivity = d.ingresos > 0 || d.egresos > 0;
                  return (
                    <div key={i} className={`chart-table-row ${hasActivity ? 'has-activity' : 'no-activity'}`}>
                      <span className="col-date">{d.date}</span>
                      <span className="col-ingreso">{d.ingresos > 0 ? `+$${formatUSD(d.ingresos)}` : '—'}</span>
                      <span className="col-egreso">{d.egresos > 0 ? `-$${formatUSD(d.egresos)}` : '—'}</span>
                      <span className={`col-balance ${balance >= 0 ? 'positive' : 'negative'}`}>
                        {hasActivity ? `${balance >= 0 ? '+' : ''}$${formatUSD(Math.abs(balance))}` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="dashboard-card glass upcoming-orders-compact">
          <div className="card-header">
            <h3>Entregas Críticas</h3>
            <button className="view-all-btn" onClick={() => navigate('/pedidos')}>
              Ver todos
            </button>
          </div>

          <div className="compact-orders-list">
            {upcomingOrders.length === 0 ? (
              <div className="empty-msg">Sin entregas pendientes</div>
            ) : (
              upcomingOrders.map((order) => (
                <div key={order.id} className="compact-order-item" onClick={() => navigate('/pedidos')}>
                  <div className="order-info">
                    <span className="o-client">{order.customer}</span>
                    <span className="o-date">
                      {order.deliveryDate
                        ? new Date(order.deliveryDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Sin fecha'}
                    </span>
                  </div>
                  <span className="o-amount">${formatUSD(order.total || 0)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
