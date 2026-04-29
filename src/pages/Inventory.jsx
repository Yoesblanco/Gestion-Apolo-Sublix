import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  ArrowLeft,
  Trash2,
  X,
  Package,
  Tag,
  Hash,
  Banknote,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, formatUSD } from '../context/AppContext';
import './Inventory.css';

const Inventory = () => {
  const navigate = useNavigate();
  const { products, setProducts, stockHistory = [], setStockHistory } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Sublimación',
    stock: '',
    price: ''
  });
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stock || !formData.price) return;

    const newProduct = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      stock: parseInt(formData.stock),
      price: parseFloat(formData.price),
      status: parseInt(formData.stock) > 10 ? 'En Stock' : parseInt(formData.stock) > 0 ? 'Bajo Stock' : 'Sin Stock'
    };

    if (newProduct.stock > 0) {
      const historyEntry = {
        id: Date.now() + 1,
        date: new Date().toISOString(),
        type: 'Entrada',
        productName: newProduct.name,
        customer: 'Inventario Inicial',
        quantity: newProduct.stock,
        orderId: 'N/A',
        notes: 'Registro de producto nuevo'
      };
      setStockHistory(prev => [historyEntry, ...(prev || [])]);
    }

    setProducts([newProduct, ...products]);
    setFormData({ name: '', category: 'Sublimación', stock: '', price: '' });
    setShowForm(false);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('¿Deseas eliminar este producto del inventario?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="inventory animate-fade-in">
      <div className="page-header">
        <div className="header-title-area">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2>Inventario</h2>
            <p>Gestión de stock de Apolo Sublix</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="add-btn" onClick={() => setHistoryModalOpen(true)} style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
            <Clock size={20} />
            <span>Historial Global</span>
          </button>
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={20} /> : <Plus size={20} />}
            <span>{showForm ? 'Cancelar' : 'Añadir Producto'}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="inventory-form-card glass animate-fade-in">
          <h3>Registrar Nuevo Producto</h3>
          <form onSubmit={handleAddProduct} className="inventory-form">
            <div className="form-group">
              <label><Package size={14} /> Nombre del Producto</label>
              <input
                type="text"
                required
                placeholder="Ej: Taza Blanca 11oz"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><Tag size={14} /> Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Sublimación">Sublimación</option>
                <option value="Textil">Textil</option>
                <option value="Papelería">Papelería</option>
                <option value="Vinilo">Vinilo</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div className="form-group">
              <label><Hash size={14} /> Stock Inicial</label>
              <input
                type="number"
                required
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><Banknote size={14} /> Precio Unitario ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <button type="submit" className="submit-inv-btn">
              Guardar en Inventario
            </button>
          </form>
        </div>
      )}

      <div className="table-controls glass">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Buscar productos..." />
        </div>
        <button className="filter-btn">
          <Filter size={18} />
          <span>Filtros</span>
        </button>
      </div>

      <div className="table-container glass">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-table-msg">No hay productos en el inventario</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className={p.stock === 0 ? 'out-of-stock-row' : ''}>
                  <td className="product-name">
                    <div className="name-with-alert">
                      {p.name}
                      {p.stock === 0 && <AlertTriangle size={14} className="alert-icon-pulse" />}
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td className={p.stock === 0 ? 'text-danger font-bold' : ''}>
                    {p.stock} unidades
                  </td>
                  <td>${typeof p.price === 'number' ? formatUSD(p.price) : p.price}</td>
                  <td>
                    <span className={`status-badge ${p.status.toLowerCase().replace(' ', '-')}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="inv-actions">
                      <button className="inv-delete-btn" onClick={() => handleDeleteProduct(p.id)} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                      <button className="action-btn" title="Opciones">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {historyModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setHistoryModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '90vw' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} className="text-primary" />
                Historial Global de Movimientos
              </h3>
              <button className="close-btn" onClick={() => setHistoryModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              {(!stockHistory || stockHistory.length === 0) ? (
                <div className="empty-state" style={{ padding: '30px 0', textAlign: 'center', opacity: 0.6 }}>
                  <Package size={32} style={{ marginBottom: '10px' }} />
                  <p>Aún no hay movimientos de inventario registrados.</p>
                </div>
              ) : (
                <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {stockHistory.map(record => (
                    <div key={record.id} className="history-item glass" style={{ 
                      padding: '15px', 
                      borderRadius: '12px', 
                      borderLeft: `3px solid ${record.type === 'Entrada' ? '#10b981' : 'var(--primary-color)'}` 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--text-color)' }}>
                          {record.type === 'Entrada' ? 'Entrada al Inventario' : `Pedido: ${record.customer}`}
                        </strong>
                        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                          {new Date(record.date).toLocaleDateString()} {new Date(record.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>
                          Producto: <strong>{record.productName}</strong>
                          {record.orderId && record.orderId !== 'N/A' && <span style={{opacity: 0.7, marginLeft: '10px'}}>Ord: {record.orderId}</span>}
                        </span>
                        <span className="qty-badge" style={{ 
                          background: record.type === 'Entrada' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 62, 108, 0.1)', 
                          color: record.type === 'Entrada' ? '#10b981' : 'var(--primary-color)', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.9rem', 
                          fontWeight: 'bold' 
                        }}>
                          {record.type === 'Entrada' ? '+' : '-'}{record.quantity} unds
                        </span>
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

export default Inventory;
