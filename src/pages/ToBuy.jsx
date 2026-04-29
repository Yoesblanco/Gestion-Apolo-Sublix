import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  ShoppingBag,
  Plus,
  X,
  Trash2,
  FileText,
  Hash,
  Package
} from 'lucide-react';
import './ToBuy.css';

const ToBuy = () => {
  const { toBuy = [], setToBuy, products = [] } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    notes: ''
  });

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity) {
      alert('Por favor ingresa el nombre del producto y la cantidad.');
      return;
    }

    const newItem = {
      id: Date.now(),
      productName: formData.productName,
      quantity: parseInt(formData.quantity),
      notes: formData.notes || 'Agregado manualmente',
      status: 'Pendiente',
      dateAdded: new Date().toISOString()
    };

    setToBuy([newItem, ...toBuy]);
    setShowForm(false);
    setFormData({ productName: '', quantity: '', notes: '' });
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este artículo de la lista?')) {
      setToBuy(toBuy.filter(item => item.id !== id));
    }
  };

  return (
    <div className="to-buy animate-fade-in">
      <div className="page-header">
        <div className="header-title-area">
          <div className="header-icon-wrapper">
            <ShoppingBag size={24} className="text-primary" />
          </div>
          <div>
            <h2>Por Comprar</h2>
            <p>Lista de productos faltantes y requeridos</p>
          </div>
        </div>
        <button className="add-item-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm ? 'Cancelar' : 'Agregar'}</span>
        </button>
      </div>

      {showForm && (
        <div className="item-form-container glass animate-fade-in">
          <h3>Anexar Producto Faltante</h3>
          <form onSubmit={handleAddItem} className="item-form">
            <div className="form-row">
              <div className="form-group">
                <label><Package size={14} /> Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre del producto"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  list="products-list"
                />
                <datalist id="products-list">
                  {products.map(p => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label><Hash size={14} /> Cantidad</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label><FileText size={14} /> Notas / Motivo</label>
                <input
                  type="text"
                  placeholder="Ej: Para el pedido de Carlos..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="submit-item-btn">
              Agregar a la Lista
            </button>
          </form>
        </div>
      )}

      <div className="table-container glass">
        <table className="to-buy-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Fecha y Notas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {toBuy.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-table-msg">
                  <div className="empty-state">
                    <ShoppingBag size={48} />
                    <p>No hay productos pendientes por comprar.</p>
                  </div>
                </td>
              </tr>
            ) : (
              toBuy.map((item) => (
                <tr key={item.id} className="to-buy-row">
                  <td className="product-name">
                    <div className="name-with-icon">
                      <Package size={16} className="text-primary" />
                      {item.productName}
                    </div>
                  </td>
                  <td>
                    <span className="qty-badge-table">{item.quantity} unds</span>
                  </td>
                  <td>
                    <div className="notes-col">
                      <span className="item-date">{new Date(item.dateAdded).toLocaleDateString()}</span>
                      <span className="item-notes-small">{item.notes}</span>
                      {item.orderId && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>Pedido: <strong>{item.orderId}</strong></span>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>Cliente: <strong>{item.customer}</strong></span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="status-badge-to-buy">{item.status || 'Pendiente'}</span>
                  </td>
                  <td>
                    <div className="to-buy-actions">
                      <button className="delete-btn-table" onClick={() => handleDeleteItem(item.id)} title="Borrar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ToBuy;
