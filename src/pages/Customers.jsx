import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Plus, 
  Trash2, 
  ArrowLeft,
  X,
  Search
} from 'lucide-react';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();
  const { customers, setCustomers } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: ''
  });

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const newCustomer = {
      id: Date.now(),
      ...formData
    };

    setCustomers([newCustomer, ...customers]);
    setFormData({ name: '', email: '', phone: '', city: '' });
    setShowForm(false);
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm('¿Eliminar este cliente de la base de datos?')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
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
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm ? 'Cancelar' : 'Nuevo Cliente'}</span>
        </button>
      </div>

      {showForm && (
        <div className="customer-form-card glass animate-fade-in">
          <h3>Registrar Cliente</h3>
          <form onSubmit={handleAddCustomer} className="customer-form">
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
              Guardar Cliente
            </button>
          </form>
        </div>
      )}

      <div className="customers-grid">
        {customers.length === 0 ? (
          <div className="empty-state-customers glass">
            <User size={48} />
            <p>No hay clientes registrados aún.</p>
          </div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="customer-card glass">
              <button className="delete-customer-btn" onClick={() => handleDeleteCustomer(c.id)}>
                <Trash2 size={16} />
              </button>
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Customers;
