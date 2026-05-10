import { useState } from 'react';
import {
  Search, Plus, Filter, ArrowLeft, Trash2, X,
  Package, Tag, Hash, Banknote, AlertTriangle,
  Clock, PlusCircle, Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { formatUSD } from '../utils/formatters';
import useScrollLock from '../hooks/useScrollLock';
import './Inventory.css';

/* ── Estilos inline reutilizables para los modales ── */

/** Overlay: siempre centrado vertical y horizontal, incluso en mobile */
const MODAL_OVERLAY_STYLE = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
  zIndex: 3000,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '1rem',
  boxSizing: 'border-box',
  overflowY: 'auto'
};

/** Contenedor del modal: ancho máximo + altura máxima + scroll interno */
const modalContentStyle = (maxW = '480px') => ({
  background: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '20px',
  width: '100%',
  maxWidth: maxW,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
  padding: '28px',
  boxSizing: 'border-box',
  margin: 'auto'
});

const MODAL_INPUT = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text)', fontSize: '0.95rem', boxSizing: 'border-box'
};
const MODAL_LABEL = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600,
  marginBottom: '6px'
};
const MODAL_GROUP = { display: 'flex', flexDirection: 'column', marginBottom: '16px' };
const MODAL_BTN_PRIMARY = {
  width: '100%', padding: '0.85rem', borderRadius: '12px',
  background: 'linear-gradient(135deg, var(--primary), #0284c7)',
  color: 'white', border: 'none', fontWeight: 700,
  fontSize: '1rem', cursor: 'pointer', marginTop: '4px'
};
const MODAL_BTN_SUCCESS = {
  ...MODAL_BTN_PRIMARY,
  background: 'linear-gradient(135deg, var(--accent), #059669)'
};

/* ── Componente de cabecera de modal reutilizable ── */
const ModalHeader = ({ icon: Icon, title, subtitle, onClose }) => (
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
        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
        color: 'var(--text)', cursor: 'pointer', borderRadius: '10px',
        width: '36px', height: '36px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0
      }}
    >
      <X size={18} />
    </button>
  </div>
);

const Inventory = () => {
  const navigate = useNavigate();
  const {
    products, setProducts,
    stockHistory = [], setStockHistory,
    setTransactions, setToBuy, setToBuyHistory,
    orders = [], setOrders
  } = useAppContext();

  const [addModalOpen,     setAddModalOpen]     = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [stockModalOpen,   setStockModalOpen]   = useState(false);
  const [editModalOpen,    setEditModalOpen]     = useState(false);
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [stockToAdd,       setStockToAdd]       = useState('');

  const [formData, setFormData] = useState({ name: '', category: 'Sublimación', stock: '', price: '' });
  const [editFormData, setEditFormData] = useState({ name: '', category: 'Sublimación', price: '' });

  // Bloquea el scroll del body cuando cualquier modal está abierto
  useScrollLock(addModalOpen || historyModalOpen || stockModalOpen || editModalOpen);

  /* ── Handlers ── */
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stock || !formData.price) return;

    if (products.some(p => p.name.toLowerCase() === formData.name.toLowerCase())) {
      alert(`Ya existe un producto llamado "${formData.name}".`);
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
      setStockHistory(prev => [{
        id: Date.now() + 1, date: new Date().toISOString(), type: 'Entrada',
        productName: newProduct.name, customer: 'Inventario Inicial',
        quantity: newProduct.stock, orderId: 'N/A', notes: 'Registro de producto nuevo'
      }, ...(prev || [])]);

      setTransactions(prev => [{
        id: `TX-INV-${Date.now()}`, date: new Date().toISOString(),
        amount: newProduct.stock * (newProduct.price || 0),
        type: 'Egreso', method: 'EFECTIVO BCV', category: 'Inventario/Materia Prima',
        description: `Stock inicial de ${newProduct.stock} unds de ${newProduct.name}`
      }, ...prev]);
    }

    setProducts([newProduct, ...products]);
    setFormData({ name: '', category: 'Sublimación', stock: '', price: '' });
    setAddModalOpen(false);
  };

  const handleDeleteProduct = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const pending = orders.filter(o =>
      (o.productId === id || o.productName === p.name) &&
      o.status !== 'Entregado' && o.status !== 'Cancelado'
    ).length;
    const msg = pending > 0
      ? `¡ADVERTENCIA! "${p.name}" tiene ${pending} pedidos activos.\n¿Estás seguro de eliminarlo?`
      : `¿Deseas eliminar "${p.name}" del inventario?`;
    if (window.confirm(msg)) setProducts(products.filter(x => x.id !== id));
  };

  const handleUpdateStock = (e) => {
    e.preventDefault();
    if (!selectedProduct || !stockToAdd) return;
    const qty = parseInt(stockToAdd);
    const newStock = selectedProduct.stock + qty;

    setStockHistory(prev => [{
      id: Date.now(), date: new Date().toISOString(), type: 'Entrada',
      productName: selectedProduct.name, customer: 'Reposición de Mercancía',
      quantity: qty, orderId: 'N/A', notes: 'Llegada de nueva mercancía'
    }, ...(prev || [])]);

    if (qty > 0) {
      setTransactions(prev => [{
        id: `TX-REP-${Date.now()}`, date: new Date().toISOString(),
        amount: qty * (selectedProduct.price || 0),
        type: 'Egreso', method: 'EFECTIVO BCV', category: 'Inventario/Materia Prima',
        description: `Reposición de ${qty} unds de ${selectedProduct.name}`
      }, ...prev]);
    }

    setProducts(products.map(p => p.id === selectedProduct.id
      ? { ...p, stock: newStock, status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock' }
      : p
    ));
    setStockModalOpen(false);
    setStockToAdd('');
    setSelectedProduct(null);
  };

  const handleEditProduct = (e) => {
    e.preventDefault();
    if (!selectedProduct || !editFormData.name || !editFormData.price) return;
    const oldName = selectedProduct.name;
    const newName = editFormData.name.trim();

    if (newName.toLowerCase() !== oldName.toLowerCase() &&
        products.some(p => p.name.toLowerCase() === newName.toLowerCase() && p.id !== selectedProduct.id)) {
      alert(`Ya existe otro producto llamado "${newName}".`);
      return;
    }

    if (oldName !== newName) {
      setStockHistory(prev => (prev || []).map(h =>
        h.productName.toLowerCase() === oldName.toLowerCase() ? { ...h, productName: newName } : h
      ));
      setToBuy(prev => (prev || []).map(i =>
        (i.productId === selectedProduct.id || i.productName.toLowerCase() === oldName.toLowerCase())
          ? { ...i, productName: newName } : i
      ));
      setToBuyHistory(prev => (prev || []).map(i =>
        (i.productId === selectedProduct.id || i.productName.toLowerCase() === oldName.toLowerCase())
          ? { ...i, productName: newName } : i
      ));
      setOrders(prev => (prev || []).map(o =>
        (o.productId === selectedProduct.id || o.productName?.toLowerCase() === oldName.toLowerCase())
          ? { ...o, productName: newName } : o
      ));
    }

    setProducts(products.map(p => p.id === selectedProduct.id
      ? { ...p, name: newName, category: editFormData.category, price: parseFloat(editFormData.price) }
      : p
    ));
    setEditModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCleanupHistory = () => {
    if (window.confirm('¿Eliminar registros de productos que ya no existen?')) {
      const active = products.map(p => p.name);
      setStockHistory(prev => (prev || []).filter(h => active.includes(h.productName)));
    }
  };

  /* ── Categorías comunes ── */
  const CATEGORIES = ['Sublimación', 'Textil', 'Papelería', 'Vinilo', 'Tazas', 'Suéteres', 'Gorras', 'Termos', 'Otros'];

  return (
    <>
      {/* ══════════════ MODAL: AÑADIR PRODUCTO ══════════════ */}
      {addModalOpen && (
        <div style={MODAL_OVERLAY_STYLE} onClick={() => setAddModalOpen(false)}>
          <div style={modalContentStyle('480px')} onClick={e => e.stopPropagation()}>
            <ModalHeader icon={Plus} title="Registrar Nuevo Producto" subtitle="Completa los datos del producto" onClose={() => setAddModalOpen(false)} />
            <form onSubmit={handleAddProduct}>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}><Package size={14} /> Nombre del Producto</label>
                <input style={MODAL_INPUT} type="text" required autoFocus placeholder="Ej: Taza Blanca 11oz"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}><Tag size={14} /> Categoría</label>
                <select style={MODAL_INPUT} value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}><Hash size={14} /> Stock Inicial (unidades)</label>
                <input style={MODAL_INPUT} type="number" required placeholder="0" min="0"
                  value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}><Banknote size={14} /> Precio Unitario ($)</label>
                <input style={MODAL_INPUT} type="number" step="0.01" required placeholder="0.00" min="0"
                  value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <button type="submit" style={MODAL_BTN_SUCCESS}>Guardar en Inventario</button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: HISTORIAL GLOBAL ══════════════ */}
      {historyModalOpen && (
        <div style={MODAL_OVERLAY_STYLE} onClick={() => setHistoryModalOpen(false)}>
          <div style={modalContentStyle('680px')} onClick={e => e.stopPropagation()}>
            <ModalHeader 
              icon={Clock} 
              title="Historial Global de Movimientos" 
              subtitle={`${stockHistory?.length || 0} registro${(stockHistory?.length || 0) !== 1 ? 's' : ''} en total`} 
              onClose={() => setHistoryModalOpen(false)} 
            />
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '16px' }}>
              {stockHistory?.length > 0 && (
                <button onClick={handleCleanupHistory} style={{
                  background: 'rgba(239,68,68,0.08)', color: 'var(--danger)',
                  border: '1px solid rgba(239,68,68,0.2)', padding: '6px 14px',
                  borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                }}>Depurar Historial</button>
              )}
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(!stockHistory || stockHistory.length === 0) ? (
                <div style={{ padding: '48px 0', textAlign: 'center', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Package size={36} />
                  <p style={{ margin: 0 }}>Aún no hay movimientos registrados.</p>
                </div>
              ) : stockHistory.map(record => {
                const isEntrada = record.type === 'Entrada';
                return (
                  <div key={record.id} style={{
                    padding: '16px 20px', borderRadius: '14px',
                    background: isEntrada ? 'rgba(16,185,129,0.05)' : 'rgba(14,165,233,0.05)',
                    border: `1px solid ${isEntrada ? 'rgba(16,185,129,0.15)' : 'rgba(14,165,233,0.15)'}`,
                    borderLeft: `4px solid ${isEntrada ? '#10b981' : '#0ea5e9'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                        padding: '3px 10px', borderRadius: '20px',
                        background: isEntrada ? 'rgba(16,185,129,0.15)' : 'rgba(14,165,233,0.15)',
                        color: isEntrada ? '#10b981' : '#0ea5e9'
                      }}>{isEntrada ? '▲ Entrada' : '▼ Salida'}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(record.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
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
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isEntrada ? '#10b981' : '#0ea5e9', whiteSpace: 'nowrap', paddingLeft: '16px' }}>
                        {isEntrada ? '+' : '-'}{record.quantity} unds
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: AGREGAR STOCK ══════════════ */}
      {stockModalOpen && (
        <div style={MODAL_OVERLAY_STYLE} onClick={() => setStockModalOpen(false)}>
          <div style={modalContentStyle('440px')} onClick={e => e.stopPropagation()}>
            <ModalHeader icon={PlusCircle} title="Agregar Stock" subtitle={`Producto: ${selectedProduct?.name}`} onClose={() => setStockModalOpen(false)} />
            <form onSubmit={handleUpdateStock}>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}><Package size={14} /> Producto Seleccionado</label>
                <input style={{ ...MODAL_INPUT, opacity: 0.7, cursor: 'not-allowed' }} type="text" readOnly value={selectedProduct?.name || ''} />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}><Plus size={14} /> Cantidad a sumar</label>
                <input style={MODAL_INPUT} type="number" required autoFocus placeholder="0" min="1"
                  value={stockToAdd} onChange={e => setStockToAdd(e.target.value)} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 20px', background: 'rgba(16,185,129,0.05)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Stock Actual: <strong>{selectedProduct?.stock || 0}</strong></span>
                <span>→</span>
                <span>Nuevo Stock: <strong style={{ color: 'var(--accent)' }}>{(selectedProduct?.stock || 0) + (parseInt(stockToAdd) || 0)}</strong></span>
              </p>
              <button type="submit" style={MODAL_BTN_SUCCESS}>Confirmar Entrada</button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: EDITAR PRODUCTO ══════════════ */}
      {editModalOpen && (
        <div style={MODAL_OVERLAY_STYLE} onClick={() => setEditModalOpen(false)}>
          <div style={modalContentStyle('480px')} onClick={e => e.stopPropagation()}>
            <ModalHeader icon={Edit} title="Editar Producto" subtitle="Modifica nombre, categoría o precio" onClose={() => setEditModalOpen(false)} />
            <form onSubmit={handleEditProduct}>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}><Package size={14} /> Nombre del Producto</label>
                <input style={MODAL_INPUT} type="text" required
                  value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}><Tag size={14} /> Categoría</label>
                <select style={MODAL_INPUT} value={editFormData.category}
                  onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}><Banknote size={14} /> Precio Unitario ($)</label>
                <input style={MODAL_INPUT} type="number" step="0.01" required placeholder="0.00" min="0"
                  value={editFormData.price} onChange={e => setEditFormData({ ...editFormData, price: e.target.value })} />
              </div>
              <button type="submit" style={MODAL_BTN_PRIMARY}>Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ PÁGINA PRINCIPAL ══════════════ */}
      <div className="inventory animate-fade-in">
        <div className="page-header">
          <div className="header-title-area">
            <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
            <div>
              <h2>Inventario</h2>
              <p>Gestión de stock de Apolo Sublix</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="add-btn" onClick={() => setHistoryModalOpen(true)}
              style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
              <Clock size={20} /><span>Historial Global</span>
            </button>
            <button className="add-btn" onClick={() => setAddModalOpen(true)}>
              <Plus size={20} /><span>Añadir Producto</span>
            </button>
          </div>
        </div>

        <div className="table-controls glass">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Buscar productos..." />
          </div>
          <button className="filter-btn">
            <Filter size={18} /><span>Filtros</span>
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
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No se encontraron productos.</td></tr>
              ) : (
                [...products]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(p => (
                    <tr key={p.id} className={p.stock === 0 ? 'out-of-stock-row' : ''}>
                      <td className="product-name">
                        <div className="name-with-alert">
                          {p.name}
                          {p.stock === 0 && <AlertTriangle size={14} className="alert-icon-pulse" />}
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td className={p.stock === 0 ? 'text-danger font-bold' : ''}>{p.stock} unds</td>
                      <td style={{ color: (p.reserved || 0) > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>{p.reserved || 0} unds</td>
                      <td>${typeof p.price === 'number' ? formatUSD(p.price) : p.price}</td>
                      <td>
                        <span className={`status-badge ${p.status?.toLowerCase().replace(' ', '-') || 'sin-status'}`}>
                          {p.status || 'Sin Stock'}
                        </span>
                      </td>
                      <td>
                        <div className="inv-actions">
                          <button className="inv-edit-btn" title="Editar Producto" onClick={() => {
                            setSelectedProduct(p);
                            setEditFormData({ name: p.name, category: p.category, price: p.price });
                            setEditModalOpen(true);
                          }}>
                            <Edit size={18} />
                          </button>
                          <button className="inv-add-stock-btn" title="Agregar Stock" onClick={() => {
                            setSelectedProduct(p);
                            setStockModalOpen(true);
                          }}>
                            <PlusCircle size={18} />
                          </button>
                          <button className="inv-delete-btn" title="Eliminar" onClick={() => handleDeleteProduct(p.id)}>
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
