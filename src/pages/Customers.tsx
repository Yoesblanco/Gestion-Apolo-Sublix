import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatUSD } from '../utils/formatters';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  X,
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  Calendar,
  Edit2,
} from 'lucide-react';
import { Customer } from '../types';
import './Customers.css';
import useScrollLock from '../hooks/useScrollLock';

const MODAL_OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(10px)',
  zIndex: 3000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  boxSizing: 'border-box',
  overflowY: 'auto',
};

const modalContentStyle = (maxW = '480px'): React.CSSProperties => ({
  background: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '20px',
  width: '100%',
  maxWidth: maxW,
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '28px',
  boxSizing: 'border-box',
  margin: 'auto',
});

const MODAL_INPUT: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};

const MODAL_LABEL: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.82rem',
  color: 'var(--text-muted)',
  fontWeight: 600,
  marginBottom: '6px',
};

const MODAL_GROUP: React.CSSProperties = { display: 'flex', flexDirection: 'column', marginBottom: '16px' };

const MODAL_BTN_PRIMARY: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, var(--primary), #0284c7)',
  color: 'white',
  border: 'none',
  fontWeight: 700,
  fontSize: '1rem',
  cursor: 'pointer',
  marginTop: '4px',
};

interface ModalHeaderProps {
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ icon: Icon, title, subtitle, onClose }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {Icon && (
        <div style={{ background: 'rgba(14,165,233,0.12)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
          <Icon size={20} style={{ color: 'var(--primary)' }} />
        </div>
      )}
      <div>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
        {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
    <button
      onClick={onClose}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        cursor: 'pointer',
        borderRadius: '10px',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <X size={18} />
    </button>
  </div>
);

export const Customers: React.FC = () => {
  const { customers, setCustomers, orders, setOrders, stockHistory, setStockHistory } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
  });

  useScrollLock(showForm);

  const handleEditClick = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      city: customer.city || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCustomerId(null);
    setFormData({ name: '', email: '', phone: '', city: '' });
  };

  const handleSubmitCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingCustomerId) {
      const updatedCustomers = customers.map((c) =>
        c.id === editingCustomerId ? { ...c, ...formData } : c
      );
      setCustomers(updatedCustomers);

      const oldCustomer = customers.find((c) => c.id === editingCustomerId);
      if (oldCustomer && oldCustomer.name !== formData.name) {
        const updatedOrders = orders.map((o) =>
          o.customerId === editingCustomerId || o.customer === oldCustomer.name
            ? { ...o, customer: formData.name }
            : o
        );
        setOrders(updatedOrders);

        const updatedStockHistory = stockHistory.map((h) =>
          h.customer === oldCustomer.name ? { ...h, customer: formData.name } : h
        );
        setStockHistory(updatedStockHistory);
      }
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...formData,
      };
      setCustomers([newCustomer, ...customers]);
    }

    handleCancelForm();
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('¿Eliminar este cliente de la base de datos?')) {
      setCustomers(customers.filter((c) => c.id !== id));
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  const getCustomerOrders = (customer: Customer) => {
    return orders.filter((o) => o.customerId === customer.id || o.customer === customer.name);
  };

  const hasActiveOrder = (customer: Customer) => {
    return orders.some(
      (o) =>
        (o.customerId === customer.id || o.customer === customer.name) &&
        (o.status === 'Pendiente' || o.status === 'En Proceso')
    );
  };

  return (
    <div className="customers animate-fade-in">
      <div className="page-header">
        <div className="header-title-area">
          <div>
            <h2>Clientes</h2>
            <p>Base de datos de clientes de Apolo Sublix</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="search-box-wrapper glass">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={() => (editingCustomerId ? handleCancelForm() : setShowForm(!showForm))}>
            {showForm ? <X size={20} /> : <Plus size={20} />}
            <span>{showForm ? 'Cancelar' : 'Nuevo Cliente'}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div style={MODAL_OVERLAY_STYLE} onClick={handleCancelForm}>
          <div style={modalContentStyle('450px')} onClick={(e) => e.stopPropagation()}>
            <ModalHeader
              icon={User}
              title={editingCustomerId ? 'Editar Cliente' : 'Registrar Cliente'}
              subtitle="Completa la información del contacto"
              onClose={handleCancelForm}
            />
            <form onSubmit={handleSubmitCustomer}>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}>
                  <User size={14} /> Nombre Completo
                </label>
                <input
                  style={MODAL_INPUT}
                  type="text"
                  required
                  placeholder="Nombre del cliente"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}>
                  <Mail size={14} /> Correo Electrónico
                </label>
                <input
                  style={MODAL_INPUT}
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}>
                  <Phone size={14} /> Teléfono
                </label>
                <input
                  style={MODAL_INPUT}
                  type="tel"
                  placeholder="+58 ..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}>
                  <MapPin size={14} /> Ciudad / Ubicación
                </label>
                <input
                  style={MODAL_INPUT}
                  type="text"
                  placeholder="Ciudad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <button type="submit" style={MODAL_BTN_PRIMARY}>
                {editingCustomerId ? 'Guardar Cambios' : 'Registrar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="customers-grid">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state-customers glass">
            <User size={48} />
            <p>{searchTerm ? 'No se encontraron clientes con esa búsqueda.' : 'No hay clientes registrados aún.'}</p>
          </div>
        ) : (
          [...filteredCustomers]
            .sort((a, b) => {
              const getUrgency = (customer: Customer) => {
                const pending = orders.filter(
                  (o) =>
                    (o.customerId === customer.id || o.customer === customer.name) &&
                    (o.status === 'Pendiente' || o.status === 'En Proceso')
                );
                if (pending.length === 0) return 9999999999999;
                const dates = pending.map((o) => (o.deliveryDate ? new Date(o.deliveryDate).getTime() : 9999999999999));
                return Math.min(...dates);
              };

              return getUrgency(a) - getUrgency(b);
            })
            .map((c) => {
              const isActive = hasActiveOrder(c);
              return (
                <div key={c.id} className={`customer-card glass ${isActive ? 'has-active-order' : ''}`}>
                  {isActive && (
                    <div className="active-order-badge animate-pulse">
                      <Clock size={10} /> Pedido Activo
                    </div>
                  )}
                  <div className="customer-actions">
                    <button className="edit-customer-btn" onClick={() => handleEditClick(c)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="delete-customer-btn" onClick={() => handleDeleteCustomer(c.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="customer-avatar">
                    <User size={32} />
                  </div>
                  <div className="customer-info">
                    <h3>{c.name}</h3>
                    <div className="info-row">
                      <Mail size={16} />
                      <span>{c.email || 'Sin correo'}</span>
                    </div>
                    <div className="info-row">
                      <Phone size={16} />
                      <span>{c.phone || 'Sin teléfono'}</span>
                    </div>
                    <div className="info-row">
                      <MapPin size={16} />
                      <span>{c.city || 'Sin ciudad'}</span>
                    </div>
                  </div>
                  <button className="view-history-btn" onClick={() => setSelectedCustomer(c)}>
                    <ShoppingBag size={16} />
                    <span>Ver Historial</span>
                  </button>
                </div>
              );
            })
        )}
      </div>

      {selectedCustomer && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass animate-slide-up">
            <div className="modal-header">
              <div className="customer-header-info">
                <div className="modal-avatar">
                  <User size={24} />
                </div>
                <div>
                  <h3>Historial: {selectedCustomer.name}</h3>
                  <p>{getCustomerOrders(selectedCustomer).length} pedidos en total</p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedCustomer(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {getCustomerOrders(selectedCustomer).length === 0 ? (
                <div className="empty-history">
                  <ShoppingBag size={48} />
                  <p>Este cliente aún no tiene pedidos registrados.</p>
                </div>
              ) : (
                <div className="history-list">
                  {getCustomerOrders(selectedCustomer).map((order) => (
                    <div key={order.id} className="history-item">
                      <div className="history-item-main">
                        <div className="history-id">#{order.id}</div>
                        <h4>{order.productName}</h4>
                        <div className="history-meta">
                          <span>
                            <Calendar size={12} /> {order.date}
                          </span>
                          <span>{order.quantity} unds</span>
                        </div>
                      </div>
                      <div className="history-status-area">
                        <div className={`status-badge ${order.status?.toLowerCase() || 'pendiente'}`}>
                          {order.status === 'Entregado' ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {order.status || 'Pendiente'}
                        </div>
                        <div className="history-amount">${formatUSD(order.total)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
