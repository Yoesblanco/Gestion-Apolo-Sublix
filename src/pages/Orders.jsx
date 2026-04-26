import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  Plus, 
  X,
  Calendar,
  User,
  FileText,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { orders, setOrders } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    description: '',
    emissionDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    quantity: '',
    price: ''
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Entregado': return <CheckCircle size={16} />;
      case 'Pendiente': return <Clock size={16} />;
      case 'Cancelado': return <XCircle size={16} />;
      default: return null;
    }
  };

  const handleAddOrder = (e) => {
    e.preventDefault();
    const newOrder = {
      id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
      customer: formData.customer,
      date: formData.emissionDate,
      deliveryDate: formData.deliveryDate,
      total: `Bs. ${parseFloat(formData.price || 0).toFixed(2)}`,
      status: 'Pendiente',
      desc: formData.description,
      quantity: formData.quantity
    };

    setOrders([newOrder, ...orders]);
    setShowForm(false);
    setFormData({
      customer: '',
      description: '',
      emissionDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      quantity: '',
      price: ''
    });
  };

  const handleDeleteOrder = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
      setOrders(orders.filter(order => order.id !== id));
    }
  };

  return (
    <div className="orders animate-fade-in">
      <div className="page-header">
        <div className="header-title-area">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2>Gestión de Pedidos</h2>
            <p>Seguimiento y registro de trabajos de personalización</p>
          </div>
        </div>
        <button className="add-order-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm ? 'Cancelar' : 'Nuevo Pedido'}</span>
        </button>
      </div>

      {showForm && (
        <div className="order-form-container glass animate-fade-in">
          <h3>Registrar Nuevo Pedido</h3>
          <form onSubmit={handleAddOrder} className="order-form">
            <div className="form-row">
              <div className="form-group">
                <label><User size={14} /> Cliente</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nombre del cliente" 
                  value={formData.customer}
                  onChange={(e) => setFormData({...formData, customer: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label><Calendar size={14} /> Fecha Entrega</label>
                <input 
                  type="date" 
                  required
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label><FileText size={14} /> Descripción del Pedido</label>
              <textarea 
                placeholder="Detalles de la personalización..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cantidad</label>
                <input 
                  type="number" 
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Precio Total (Bs.)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="submit-order-btn">
              Guardar Pedido
            </button>
          </form>
        </div>
      )}

      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="empty-state glass">
            <ShoppingBag size={48} />
            <p>No hay pedidos registrados.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-item glass">
              <div className="order-main">
                <div className="order-icon-wrapper">
                  <ShoppingBag size={24} />
                </div>
                <div className="order-info">
                  <div className="id-badge">{order.id}</div>
                  <h3>{order.customer}</h3>
                  <p className="order-desc">{order.desc}</p>
                </div>
              </div>
              
              <div className="order-meta">
                <div className="order-details-grid">
                  <div className="detail-item">
                    <span className="label">Entrega</span>
                    <span>{order.deliveryDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Cant.</span>
                    <span>{order.quantity}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total</span>
                    <span className="amount">{order.total}</span>
                  </div>
                </div>
                <div className={`order-status ${order.status.toLowerCase()}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status}</span>
                </div>
                <div className="order-actions">
                  <button className="delete-btn" onClick={() => handleDeleteOrder(order.id)}>
                    <Trash2 size={18} />
                  </button>
                  <button className="view-details">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
