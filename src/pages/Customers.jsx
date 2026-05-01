import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { formatUSD } from '../utils/formatters';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Plus, 
  Trash2, 
  ArrowLeft,
  X,
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  Calendar,
  ChevronRight,
  Edit2
} from 'lucide-react';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();
  const { customers, setCustomers, orders, setOrders } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: ''
  });

  const handleEditClick = (customer) => {
    setEditingCustomerId(customer.id);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      city: customer.city || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCustomerId(null);
    setFormData({ name: '', email: '', phone: '', city: '' });
  };

  const handleSubmitCustomer = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingCustomerId) {
      // Update existing customer
      const updatedCustomers = customers.map(c => 
        c.id === editingCustomerId ? { ...c, ...formData } : c
      );
      setCustomers(updatedCustomers);

      // Interrelation: Update customer name in existing orders if it changed
      const oldCustomer = customers.find(c => c.id === editingCustomerId);
      if (oldCustomer && oldCustomer.name !== formData.name) {
        // Update Orders
        const updatedOrders = orders.map(o => 
          (o.customerId === editingCustomerId || o.customer === oldCustomer.name)
            ? { ...o, customer: formData.name }
            : o
        );
        setOrders(updatedOrders);

        // Update Stock History (Interrelation with Inventory)
        const updatedStockHistory = stockHistory.map(h => 
          (h.customer === oldCustomer.name)
            ? { ...h, customer: formData.name }
            : h
        );
        setStockHistory(updatedStockHistory);
      }
    } else {
      // Add new customer
      const newCustomer = {
        id: Date.now(),
        ...formData
      };
      setCustomers([newCustomer, ...customers]);
    }

    handleCancelForm();
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm('¿Eliminar este cliente de la base de datos?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const getCustomerOrders = (customer) => {
    return orders.filter(o => o.customerId === customer.id || o.customer === customer.name);
  };

  const hasActiveOrder = (customer) => {
    return orders.some(o => 
      (o.customerId === customer.id || o.customer === customer.name) && 
      (o.status === 'Pendiente' || o.status === 'En Proceso')
    );
  };

  return (
    <div className="customers animate-fade-in">
      <div className="page-header">
        <div className="header-title-area">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
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
          <button className="add-btn" onClick={() => editingCustomerId ? handleCancelForm() : setShowForm(!showForm)}>
            {showForm ? <X size={20} /> : <Plus size={20} />}
            <span>{showForm ? 'Cancelar' : 'Nuevo Cliente'}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="customer-form-card glass animate-fade-in">
          <h3>{editingCustomerId ? 'Editar Cliente' : 'Registrar Cliente'}</h3>
          <form onSubmit={handleSubmitCustomer} className="customer-form">
            <div className="form-group">
              <label>Nombre Completo</label>
              <input 
                type="text" 
                required
                placeholder="Nombre del cliente" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="ejemplo@correo.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input 
                type="tel" 
                placeholder="+58 ..." 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Ciudad / Ubicación</label>
              <input 
                type="text" 
                placeholder="Ciudad" 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
            <button type="submit" className="submit-customer-btn">
              {editingCustomerId ? 'Guardar Cambios' : 'Guardar Cliente'}
            </button>
          </form>
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
              // Obtener el pedido pendiente más próximo de cada cliente
              const getUrgency = (customer) => {
                const pending = orders.filter(o => 
                  (o.customerId === customer.id || o.customer === customer.name) && 
                  (o.status === 'Pendiente' || o.status === 'En Proceso')
                );
                if (pending.length === 0) return new Date('9999-12-31');
                
                const dates = pending.map(o => new Date(o.deliveryDate));
                return new Date(Math.min(...dates));
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

      {/* Modal de Historial */}
      {selectedCustomer && (
        <div className="history-modal-overlay animate-fade-in">
          <div className="history-modal glass animate-slide-up">
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
              <button className="close-modal" onClick={() => setSelectedCustomer(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-content">
              {getCustomerOrders(selectedCustomer).length === 0 ? (
                <div className="empty-history">
                  <ShoppingBag size={48} />
                  <p>Este cliente aún no tiene pedidos registrados.</p>
                </div>
              ) : (
                <div className="history-list">
                  {getCustomerOrders(selectedCustomer).map(order => (
                    <div key={order.id} className="history-item">
                      <div className="history-item-main">
                        <div className="history-id">#{order.id}</div>
                        <h4>{order.productName}</h4>
                        <div className="history-meta">
                          <span><Calendar size={12} /> {order.date}</span>
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

