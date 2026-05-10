import { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowLeft,
  Trash2,
  X,
  Package,
  Tag,
  Hash,
  Banknote,
  AlertTriangle,
  Clock,
  PlusCircle,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { formatUSD } from '../utils/formatters';
import './Inventory.css';

const Inventory = () => {
  const navigate = useNavigate();
  const { 
    products, 
    setProducts, 
    stockHistory = [], 
    setStockHistory, 
    setTransactions,
    setToBuy,
    setToBuyHistory,
    orders = [],
    setOrders
  } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Sublimación',
    stock: '',
    price: ''
  });
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockToAdd, setStockToAdd] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'Sublimación',
    price: ''
  });

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stock || !formData.price) return;

    if (products.some(p => p.name.toLowerCase() === formData.name.toLowerCase())) {
      alert(`Ya existe un producto llamado "${formData.name}". Por favor usa un nombre diferente.`);
      return;
    }

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

    if (newProduct.stock > 0) {
      const totalCost = newProduct.stock * (newProduct.price || 0);
      setTransactions(prev => [{
        id: `TX-INV-${Date.now()}`,
        date: new Date().toISOString(),
        amount: totalCost,
        type: 'Egreso',
        method: 'EFECTIVO BCV',
        category: 'Inventario/Materia Prima',
        description: `Stock inicial de ${newProduct.stock} unds de ${newProduct.name}`
      }, ...prev]);
    }

    setProducts([newProduct, ...products]);
    setFormData({ name: '', category: 'Sublimación', stock: '', price: '' });
    setShowForm(false);
  };

  const handleDeleteProduct = (id) => {
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) return;

    const pendingOrdersCount = orders.filter(o => 
      (o.productId === id || o.productName === productToDelete.name) && 
      o.status !== 'Entregado' && o.status !== 'Cancelado'
    ).length;

    const hasReserved = (productToDelete.reserved || 0) > 0;

    let warningMsg = `¿Deseas eliminar "${productToDelete.name}" del inventario?`;
    
    if (pendingOrdersCount > 0 || hasReserved) {
      warningMsg = `¡ADVERTENCIA! "${productToDelete.name}" tiene ${pendingOrdersCount} pedidos activos y unidades apartadas.\n\nSi lo borras, estos pedidos perderán su vínculo con el stock. ¿Estás SEGURO de que quieres eliminarlo?`;
    }

    if (window.confirm(warningMsg)) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleUpdateStock = (e) => {
    e.preventDefault();
    if (!selectedProduct || !stockToAdd) return;

    const addedQty = parseInt(stockToAdd);
    const newStock = selectedProduct.stock + addedQty;

    const historyEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: 'Entrada',
      productName: selectedProduct.name,
      customer: 'Reposición de Mercancía',
      quantity: addedQty,
      orderId: 'N/A',
      notes: 'Llegada de nueva mercancía'
    };

    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          stock: newStock,
          status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock'
        };
      }
      return p;
    });

    if (addedQty > 0) {
      const totalCost = addedQty * (selectedProduct.price || 0);
      const newTransaction = {
        id: `TX-REP-${Date.now()}`,
        date: new Date().toISOString(),
        amount: totalCost,
        type: 'Egreso',
        method: 'EFECTIVO BCV',
        category: 'Inventario/Materia Prima',
        description: `Reposición de ${addedQty} unds de ${selectedProduct.name}`
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }

    setProducts(updatedProducts);
    setStockHistory(prev => [historyEntry, ...(prev || [])]);
    setStockModalOpen(false);
    setStockToAdd('');
    setSelectedProduct(null);
  };

  const handleEditProduct = (e) => {
    e.preventDefault();
    if (!selectedProduct || !editFormData.name || !editFormData.price) return;

    const oldName = selectedProduct.name;
    const newName = editFormData.name;
    const normalizedNewName = newName.trim();
    
    if (normalizedNewName.toLowerCase() !== oldName.toLowerCase() && 
        products.some(p => p.name.toLowerCase() === normalizedNewName.toLowerCase() && p.id !== selectedProduct.id)) {
      alert(`Ya existe otro producto llamado "${normalizedNewName}". No puedes usar un nombre duplicado.`);
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          name: normalizedNewName,
          category: editFormData.category,
          price: parseFloat(editFormData.price)
        };
      }
      return p;
    });

    if (oldName !== normalizedNewName) {
      setStockHistory(prev => (prev || []).map(h => 
        h.productName.toLowerCase() === oldName.toLowerCase() ? { ...h, productName: normalizedNewName } : h
      ));

      setToBuy(prev => (prev || []).map(item => 
        (item.productId === selectedProduct.id || item.productName.toLowerCase() === oldName.toLowerCase()) 
          ? { ...item, productName: normalizedNewName } : item
      ));

      setToBuyHistory(prev => (prev || []).map(item => 
        (item.productId === selectedProduct.id || item.productName.toLowerCase() === oldName.toLowerCase()) 
          ? { ...item, productName: normalizedNewName } : item
      ));

      setOrders(prev => (prev || []).map(order => 
        (order.productId === selectedProduct.id || (order.productName && order.productName.toLowerCase() === oldName.toLowerCase()))
          ? { ...order, productName: normalizedNewName } 
          : order
      ));
    }

    setProducts(updatedProducts);
    setEditModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCleanupHistory = () => {
    if (window.confirm('¿Deseas eliminar del historial todos los registros de productos que ya no existen en el inventario?')) {
      const activeProductNames = products.map(p => p.name);
      setStockHistory(prev => (prev || []).filter(h => activeProductNames.includes(h.productName)));
      alert('Historial depurado con éxito.');
    }
  };

  return (
    <>
      {historyModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setHistoryModalOpen(false)}>
          <div
            className="modal-content glass"
            onClick={e => e.stopPropagation()}
            style={{ width: '700px', maxWidth: '94vw', padding: '28px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(14,165,233,0.12)', borderRadius: '12px', padding: '10px', display:'flex' }}>
                  <Clock size={22} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Historial Global de Movimientos</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {stockHistory?.length || 0} registro{(stockHistory?.length || 0) !== 1 ? 's' : ''} en total
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {stockHistory && stockHistory.length > 0 && (
                  <button
                    onClick={handleCleanupHistory}
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Depurar
                  </button>
                )}
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(!stockHistory || stockHistory.length === 0) ? (
                <div style={{ padding: '48px 0', textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Package size={36} />
                  <p style={{ margin: 0 }}>Aún no hay movimientos de inventario registrados.</p>
                </div>
              ) : (
                stockHistory.map(record => {
                  const isEntrada = record.type === 'Entrada';
                  return (
                    <div
                      key={record.id}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '14px',
                        background: isEntrada ? 'rgba(16,185,129,0.05)' : 'rgba(14,165,233,0.05)',
                        border: `1px solid ${isEntrada ? 'rgba(16,185,129,0.15)' : 'rgba(14,165,233,0.15)'}`,
                        borderLeft: `4px solid ${isEntrada ? '#10b981' : '#0ea5e9'}`,
                      }}
                    >
                      {/* Row 1: Type badge + Date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          background: isEntrada ? 'rgba(16,185,129,0.15)' : 'rgba(14,165,233,0.15)',
                          color: isEntrada ? '#10b981' : '#0ea5e9'
                        }}>
                          {isEntrada ? '▲ Entrada' : '▼ Salida'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(record.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}
                          {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Row 2: Product + Quantity */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{record.productName}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {isEntrada ? record.customer || 'Reposición' : `Pedido: ${record.customer}`}
                            {record.orderId && record.orderId !== 'N/A' && (
                              <span style={{ marginLeft: '10px', opacity: 0.7 }}># {record.orderId}</span>
                            )}
                          </p>
                        </div>
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: isEntrada ? '#10b981' : '#0ea5e9',
                          whiteSpace: 'nowrap',
                          paddingLeft: '16px'
                        }}>
                          {isEntrada ? '+' : '-'}{record.quantity} unds
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}


      {stockModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setStockModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Agregar Stock</h3>
              <button className="close-btn" onClick={() => setStockModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '20px', fontSize: '0.9rem', opacity: 0.8 }}>
                Ingresa la cantidad de <strong>{selectedProduct?.name}</strong> que ha llegado al inventario.
              </p>
              <form onSubmit={handleUpdateStock}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label><Hash size={14} /> Cantidad a sumar</label>
                  <input 
                    type="number" 
                    required 
                    autoFocus
                    placeholder="0" 
                    value={stockToAdd}
                    onChange={(e) => setStockToAdd(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <button type="submit" className="submit-inv-btn" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Confirmar Entrada
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Editar Producto</h3>
              <button className="close-btn" onClick={() => setEditModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditProduct} className="inventory-form">
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label><Package size={14} /> Nombre del Producto</label>
                  <input 
                    type="text" 
                    required 
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label><Filter size={14} /> Categoría</label>
                  <select 
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <option value="Tazas">Tazas</option>
                    <option value="Suéteres">Suéteres</option>
                    <option value="Gorras">Gorras</option>
                    <option value="Termos">Termos</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label><Banknote size={14} /> Precio Unitario ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <button type="submit" className="submit-inv-btn" style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  Guardar Cambios
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

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
            <button className="add-btn" onClick={() => {
              const nextShow = !showForm;
              setShowForm(nextShow);
              if (nextShow) window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
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
                <th>Disponible</th>
                <th>Apartado</th>
                <th>Precio (Venta)</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(products || []).length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                [...products]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <tr key={p.id} className={p.stock === 0 ? 'out-of-stock-row' : ''}>
                      <td className="product-name">
                        <div className="name-with-alert">
                          {p.name}
                          {p.stock === 0 && <AlertTriangle size={14} className="alert-icon-pulse" />}
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td className={p.stock === 0 ? 'text-danger font-bold' : ''}>
                        {p.stock} unds
                      </td>
                      <td style={{ color: (p.reserved || 0) > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {p.reserved || 0} unds
                      </td>
                      <td>${typeof p.price === 'number' ? formatUSD(p.price) : p.price}</td>
                      <td>
                        <span className={`status-badge ${p.status?.toLowerCase().replace(' ', '-') || 'sin-status'}`}>
                          {p.status || 'Sin Stock'}
                        </span>
                      </td>
                      <td>
                        <div className="inv-actions">
                          <button 
                            className="inv-edit-btn" 
                            onClick={() => {
                              setSelectedProduct(p);
                              setEditFormData({
                                name: p.name,
                                category: p.category,
                                price: p.price
                              });
                              setEditModalOpen(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            title="Editar Producto"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            className="inv-add-stock-btn" 
                            onClick={() => {
                              setSelectedProduct(p);
                              setStockModalOpen(true);
                            }} 
                            title="Agregar Stock"
                          >
                            <PlusCircle size={18} />
                          </button>
                          <button className="inv-delete-btn" onClick={() => handleDeleteProduct(p.id)} title="Eliminar">
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
    </>
  );
};

export default Inventory;
