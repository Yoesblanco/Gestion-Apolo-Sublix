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
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './Inventory.css';

const Inventory = () => {
  const navigate = useNavigate();
  const { products, setProducts } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Sublimación',
    stock: '',
    price: ''
  });

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stock || !formData.price) return;

    const newProduct = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      stock: parseInt(formData.stock),
      price: `Bs. ${parseFloat(formData.price).toFixed(2)}`,
      status: parseInt(formData.stock) > 10 ? 'En Stock' : parseInt(formData.stock) > 0 ? 'Bajo Stock' : 'Sin Stock'
    };

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
        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm ? 'Cancelar' : 'Añadir Producto'}</span>
        </button>
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
              <label><DollarSign size={14} /> Precio Unitario (Bs.)</label>
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
                  <td>{p.price}</td>
                  <td>
                    <span className={`status-badge ${p.status.toLowerCase().replace(' ', '-')}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="inv-actions">
                      <button className="inv-delete-btn" onClick={() => handleDeleteProduct(p.id)}>
                        <Trash2 size={18} />
                      </button>
                      <button className="action-btn">
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
    </div>
  );
};

export default Inventory;
