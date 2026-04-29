import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  ShoppingBag,
  Plus,
  X,
  Trash2,
  FileText,
  Hash,
  Package,
  CheckCircle,
  Banknote,
  Edit2,
  Clock
} from 'lucide-react';
import './ToBuy.css';

const ToBuy = () => {
  const { toBuy = [], setToBuy, toBuyHistory = [], setToBuyHistory, products = [], setProducts, setStockHistory } = useAppContext();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    notes: ''
  });

  const handleEditClick = (item) => {
    setEditingItemId(item.id);
    setFormData({
      productName: item.productName,
      quantity: item.quantity.toString(),
      notes: item.notes || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItemId(null);
    setFormData({ productName: '', quantity: '', notes: '' });
  };

  const handleSubmitItem = (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity) {
      alert('Por favor ingresa el nombre del producto y la cantidad.');
      return;
    }

    if (editingItemId) {
      const updatedToBuy = toBuy.map(item => 
        item.id === editingItemId 
          ? { 
              ...item, 
              productName: formData.productName, 
              quantity: parseInt(formData.quantity), 
              notes: formData.notes 
            } 
          : item
      );
      setToBuy(updatedToBuy);
    } else {
      const newItem = {
        id: Date.now(),
        productName: formData.productName,
        quantity: parseInt(formData.quantity),
        notes: formData.notes || 'Agregado manualmente',
        status: 'Pendiente',
        dateAdded: new Date().toISOString()
      };
      setToBuy([newItem, ...toBuy]);
    }

    handleCancelForm();
  };

  const handleDeleteItem = (id, isHistory = false) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      if (isHistory) {
        setToBuyHistory(toBuyHistory.filter(item => item.id !== id));
      } else {
        setToBuy(toBuy.filter(item => item.id !== id));
      }
    }
  };

  const handleConfirmPurchase = (e) => {
    e.preventDefault();
    if (!selectedItem || !purchasePrice) return;

    const qty = parseInt(selectedItem.quantity);
    const price = parseFloat(purchasePrice);

    // 1. Buscar si el producto existe en el inventario
    const existingProduct = products.find(p => p.name.toLowerCase() === selectedItem.productName.toLowerCase());

    if (existingProduct) {
      const updatedProducts = products.map(p => {
        if (p.id === existingProduct.id) {
          const newStock = p.stock + qty;
          return {
            ...p,
            stock: newStock,
            price: price,
            status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock'
          };
        }
        return p;
      });
      setProducts(updatedProducts);
    } else {
      const newProduct = {
        id: Date.now(),
        name: selectedItem.productName,
        category: 'Otros',
        stock: qty,
        price: price,
        status: qty > 10 ? 'En Stock' : qty > 0 ? 'Bajo Stock' : 'Sin Stock'
      };
      setProducts([newProduct, ...products]);
    }

    // 2. Agregar al historial global de inventario
    const historyEntry = {
      id: Date.now() + 1,
      date: new Date().toISOString(),
      type: 'Entrada',
      productName: selectedItem.productName,
      customer: 'Compra Directa (Lista de Faltantes)',
      quantity: qty,
      orderId: selectedItem.orderId || 'N/A',
      notes: `Compra realizada desde la lista de "Por comprar". ${selectedItem.notes || ''}`
    };
    setStockHistory(prev => [historyEntry, ...(prev || [])]);

    // 3. MOVER AL HISTORIAL DE POR COMPRAR (Interrelation)
    const boughtItem = {
      ...selectedItem,
      status: 'Comprado',
      dateBought: new Date().toISOString(),
      purchasePrice: price
    };
    setToBuyHistory([boughtItem, ...toBuyHistory]);

    // 4. Quitar de la lista de pendientes
    setToBuy(toBuy.filter(item => item.id !== selectedItem.id));

    // 5. Limpiar estado
    setBuyModalOpen(false);
    setSelectedItem(null);
    setPurchasePrice('');
    alert(`Se han agregado ${qty} unidades de "${selectedItem.productName}" al inventario.`);
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
        <button className="add-item-btn" onClick={() => editingItemId ? handleCancelForm() : setShowForm(!showForm)}>
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm ? 'Cancelar' : 'Agregar'}</span>
        </button>
      </div>

      <div className="orders-tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          <Clock size={18} /> Pendientes ({toBuy.length})
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <CheckCircle size={18} /> Historial ({toBuyHistory.length})
        </button>
      </div>

      {showForm && (
        <div className="item-form-container glass animate-fade-in">
          <h3>{editingItemId ? 'Editar Producto Faltante' : 'Anexar Producto Faltante'}</h3>
          <form onSubmit={handleSubmitItem} className="item-form">
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
              {editingItemId ? 'Guardar Cambios' : 'Agregar a la Lista'}
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
            {(activeTab === 'pending' ? toBuy : toBuyHistory).length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-table-msg">
                  <div className="empty-state">
                    <ShoppingBag size={48} />
                    <p>{activeTab === 'pending' ? 'No hay productos pendientes.' : 'El historial de compras está vacío.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              (activeTab === 'pending' ? toBuy : toBuyHistory).map((item) => (
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
                      <span className="item-date">
                        {activeTab === 'pending' 
                          ? new Date(item.dateAdded).toLocaleDateString() 
                          : `Comprado: ${new Date(item.dateBought).toLocaleDateString()}`}
                      </span>
                      <span className="item-notes-small">{item.notes}</span>
                      {item.orderId && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>Pedido: <strong>{item.orderId}</strong></span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge-to-buy ${item.status?.toLowerCase()}`}>
                      {item.status || 'Pendiente'}
                    </span>
                  </td>
                  <td>
                    <div className="to-buy-actions">
                      {activeTab === 'pending' ? (
                        <>
                          <button 
                            className="bought-btn" 
                            onClick={() => {
                              setSelectedItem(item);
                              setBuyModalOpen(true);
                            }}
                            title="Marcar como Comprado"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button className="edit-btn-table" onClick={() => handleEditClick(item)} title="Editar">
                            <Edit2 size={18} />
                          </button>
                        </>
                      ) : null}
                      <button className="delete-btn-table" onClick={() => handleDeleteItem(item.id, activeTab === 'history')} title="Borrar">
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

      {buyModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setBuyModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Registrar Compra</h3>
              <button className="close-btn" onClick={() => setBuyModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
                Confirmar que has comprado <strong>{selectedItem?.quantity} unds</strong> de <strong>{selectedItem?.productName}</strong>.
              </p>
              {selectedItem?.orderId && (
                <p style={{ marginBottom: '20px', fontSize: '0.85rem', padding: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Este artículo está vinculado al pedido <strong>{selectedItem.orderId}</strong> ({selectedItem.customer}).
                </p>
              )}
              <form onSubmit={handleConfirmPurchase}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label><Banknote size={14} /> Precio de Venta/Unitario ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    autoFocus
                    placeholder="0.00" 
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                  <small style={{ opacity: 0.6, marginTop: '8px', display: 'block' }}>Este será el precio asignado al producto en el inventario.</small>
                </div>
                <button type="submit" className="submit-item-btn" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Ingresar al Inventario
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToBuy;
