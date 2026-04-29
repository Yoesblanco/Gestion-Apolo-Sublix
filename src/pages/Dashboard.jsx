import React, { useMemo } from 'react';
import { useAppContext, formatUSD } from '../context/AppContext';
import { 
  TrendingUp, 
  Package, 
  Users, 
  Wallet,
  ShoppingBag,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import './Dashboard.css';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { salesTotals, products, customers, orders, transactions } = useAppContext();

  const stats = [
    { label: 'Total Actual', value: `$${formatUSD(salesTotals.total)}`, icon: Wallet, color: '#0ea5e9' },
    { label: 'Productos', value: products.length.toString(), icon: Package, color: '#10b981' },
    { label: 'Clientes', value: customers.length.toString(), icon: Users, color: '#f59e0b' },
    { label: 'Pedidos Activos', value: orders.filter(o => o.status === 'Pendiente').length.toString(), icon: ShoppingBag, color: '#8b5cf6' },
  ];

  // Logic for the chart: Group by date (last 7 days)
  const chartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();

    return days.map(day => {
      const dayTxs = transactions.filter(t => t.date.split(',')[0] === day);
      const ingresos = dayTxs.filter(t => t.type === 'ingreso').reduce((acc, curr) => acc + curr.amount, 0);
      const egresos = dayTxs.filter(t => t.type === 'egreso').reduce((acc, curr) => acc + curr.amount, 0);
      return { day, ingresos, egresos };
    });
  }, [transactions]);

  const maxVal = Math.max(...chartData.map(d => Math.max(d.ingresos, d.egresos)), 100);

  const recentTransactions = transactions.slice(0, 5);

  const expiringOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inTwoDays = new Date(today);
    inTwoDays.setDate(today.getDate() + 2);

    return orders.filter(order => {
      if (order.status !== 'Pendiente') return false;
      if (!order.deliveryDate) return false;
      
      const delivery = new Date(order.deliveryDate);
      return delivery >= today && delivery <= inTwoDays;
    });
  }, [orders]);

  return (
    <div className="dashboard animate-fade-in">
      {expiringOrders.length > 0 && (
        <div className="alert-banner warning glass" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
          <AlertTriangle size={24} color="#f59e0b" />
          <div>
            <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '1.1rem' }}>¡Atención! Pedidos por vencer</h4>
            <p style={{ margin: '4px 0 0', opacity: 0.9 }}>
              Tienes {expiringOrders.length} pedido(s) que deben entregarse pronto:{' '}
              {expiringOrders.map(o => `${o.quantity} unds de ${o.productName} (${o.customer})`).join(', ')}.
            </p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card glass">
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="chart-container glass">
          <div className="section-header-row">
            <h3>Ingresos vs Egresos (Últimos 7 días)</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot income"></span> Ingresos</span>
              <span className="legend-item"><span className="dot expense"></span> Egresos</span>
            </div>
          </div>
          <div className="placeholder-chart">
            {chartData.map((data, i) => (
              <div key={i} className="chart-column">
                <div className="bar-wrapper">
                  <div 
                    className="bar income" 
                    style={{ height: `${(data.ingresos / maxVal) * 100}%` }}
                    title={`Ingreso: $${formatUSD(data.ingresos)}`}
                  ></div>
                  <div 
                    className="bar expense" 
                    style={{ height: `${(data.egresos / maxVal) * 100}%` }}
                    title={`Egreso: $${formatUSD(data.egresos)}`}
                  ></div>
                </div>
                <span className="bar-label">{data.day.split('/')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-activity glass">
          <div className="section-header-row">
            <h3>Actividad Reciente</h3>
            <Link to="/pedidos" className="view-more-link">Ver Pedidos <ArrowRight size={14} /></Link>
          </div>
          <div className="activity-list">
            {transactions.length === 0 ? (
              <p className="empty-msg-small">Sin actividad reciente</p>
            ) : (
              recentTransactions.map((tx, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-details">
                    <span className="activity-name">{tx.product}</span>
                    <span className="activity-time">{tx.date.split(',')[1] || tx.date}</span>
                  </div>
                  <span className={`activity-amount ${tx.type === 'egreso' ? 'text-danger' : 'text-accent'}`}>
                    {tx.type === 'egreso' ? '-' : '+'}${formatUSD(tx.amount)}
                  </span>
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
