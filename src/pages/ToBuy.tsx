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
  Clock,
  CreditCard,
} from 'lucide-react';
import { ToBuyItem, ToBuyHistoryItem, Product } from '../types';
import './ToBuy.css';
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

const MODAL_BTN_SUCCESS: React.CSSProperties = {
  ...MODAL_BTN_PRIMARY,
  background: 'linear-gradient(135deg, var(--accent), #059669)',
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

export const ToBuy: React.FC = () => {
  const {
    toBuy = [],
    setToBuy,
    toBuyHistory = [],
    setToBuyHistory,
    products = [],
    setProducts,
    setStockHistory,
    setTransactions,
    orders = [],
    addToast,
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ToBuyItem | null>(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseMethod, setPurchaseMethod] = useState('EFECTIVO BCV');
  const [showForm, setShowForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    notes: '',
  });

  useScrollLock(buyModalOpen);

  const handleEditClick = (item: ToBuyItem) => {
    setEditingItemId(item.id);
    setFormData({
      productName: item.productName,
      quantity: item.quantity.toString(),
      notes: item.notes || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItemId(null);
    setFormData({ productName: '', quantity: '', notes: '' });
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity) return;

    const matchedProduct = products.find(
      (p) => p.name.toLowerCase() === formData.productName.toLowerCase()
    );

    if (editingItemId) {
      const updatedToBuy = toBuy.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              productName: formData.productName,
              productId: matchedProduct ? matchedProduct.id : null,
              quantity: parseInt(formData.quantity),
              notes: formData.notes,
            }
          : item
      );
      setToBuy(updatedToBuy);
    } else {
      const newItem: ToBuyItem = {
        id: Date.now().toString(),
        productId: matchedProduct ? matchedProduct.id : null,
        productName: formData.productName,
        quantity: parseInt(formData.quantity),
        notes: formData.notes || 'Agregado manualmente',
        status: 'Pendiente',
        dateAdded: new Date().toISOString(),
      };
      setToBuy([newItem, ...toBuy]);
    }

    handleCancelForm();
  };

  const handleDeleteItem = (id: string, isHistory = false) => {
    const warningMsg = isHistory
      ? '¡ADVERTENCIA DE SEGURIDAD! Estás a punto de ANULAR esta compra.\n\nEsto restará el stock del inventario, borrará el gasto de tus ventas y el producto volverá a aparecer como PENDIENTE.\n\n¿Estás SEGURO de que quieres deshacer esta operación?'
      : '¿Estás seguro de que deseas eliminar este registro de la lista de pendientes?';

    if (window.confirm(warningMsg)) {
      if (isHistory) {
        const itemToUndo = toBuyHistory.find((item) => item.id === id);
        if (itemToUndo) {
          const updatedProducts = products.map((p) => {
            const isMatch =
              (itemToUndo.productId && p.id === itemToUndo.productId) ||
              p.name.toLowerCase() === itemToUndo.productName.toLowerCase();

            if (isMatch) {
              const qtyToSubtract = itemToUndo.quantity || 0;
              const newStock = Math.max(0, p.stock - qtyToSubtract);

              return {
                ...p,
                stock: newStock,
                status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock',
              };
            }
            return p;
          });
          setProducts(updatedProducts);

          if (itemToUndo.transactionId) {
            setTransactions((prev) => prev.filter((t) => t.id !== itemToUndo.transactionId));
          }

          if (itemToUndo.orderId) {
            const restoredItem: ToBuyItem = {
              id: Date.now().toString(),
              productName: itemToUndo.productName,
              quantity: itemToUndo.quantity,
              notes: itemToUndo.notes,
              orderDescription: itemToUndo.orderDescription,
              status: 'Pendiente',
              dateAdded: new Date().toISOString(),
              orderId: itemToUndo.orderId,
              customer: itemToUndo.customer,
              productId: itemToUndo.productId,
            };
            setToBuy((prev) => [restoredItem, ...prev]);
          }

          setToBuyHistory(toBuyHistory.filter((item) => item.id !== id));
          addToast('Compra anulada y stock revertido correctamente.', 'info');
        }
      } else {
        setToBuy(toBuy.filter((item) => item.id !== id));
      }
    }
  };

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !purchasePrice) return;

    const qty = parseInt(String(selectedItem.quantity));
    const price = parseFloat(purchasePrice);

    const existingProduct = products.find(
      (p) =>
        (selectedItem.productId && p.id === selectedItem.productId) ||
        p.name.toLowerCase() === selectedItem.productName.toLowerCase()
    );

    if (existingProduct) {
      const updatedProducts = products.map((p) => {
        const isMatch =
          (selectedItem.productId && p.id === selectedItem.productId) ||
          (!selectedItem.productId && p.name.toLowerCase() === selectedItem.productName.toLowerCase());

        if (isMatch) {
          const newStock = p.stock + qty;
          return {
            ...p,
            stock: newStock,
            status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock',
          };
        }
        return p;
      });
      setProducts(updatedProducts);
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: selectedItem.productName,
        category: 'Otros',
        stock: qty,
        price: price,
        status: qty > 10 ? 'En Stock' : qty > 0 ? 'Bajo Stock' : 'Sin Stock',
      };
      setProducts([newProduct, ...products]);
    }

    const txId = `TX-BUY-${Date.now()}`;
    const totalCost = qty * (price || 0);
    const newTransaction = {
      id: txId,
      date: new Date().toISOString(),
      amount: totalCost,
      type: 'Egreso',
      category: 'Inventario/Materia Prima',
      method: purchaseMethod,
      description: `Compra de ${qty} unds de ${selectedItem.productName}`,
      orderId: selectedItem.orderId || null,
    };
    setTransactions((prev) => [newTransaction, ...prev]);

    const historyEntry = {
      id: Date.now() + 1,
      date: new Date().toISOString(),
      type: 'Entrada',
      productName: selectedItem.productName,
      customer: 'Compra Directa (Lista de Faltantes)',
      quantity: qty,
      orderId: selectedItem.orderId || 'N/A',
      notes: `Compra realizada desde la lista de "Por comprar". ${selectedItem.notes || ''}`,
    };
    setStockHistory((prev) => [historyEntry, ...(prev || [])]);

    const boughtItem: ToBuyHistoryItem = {
      ...selectedItem,
      status: 'Comprado',
      dateBought: new Date().toISOString(),
      purchasePrice: price,
      productId: existingProduct ? existingProduct.id : selectedItem.productId,
      transactionId: txId,
    };
    setToBuyHistory([boughtItem, ...toBuyHistory]);

    setToBuy(toBuy.filter((item) => item.id !== selectedItem.id));

    setBuyModalOpen(false);
    setSelectedItem(null);
    setPurchasePrice('');
    addToast(`Se han agregado ${qty} unidades de "${selectedItem.productName}" al inventario.`, 'success');
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
        <button
          className="add-item-btn"
          onClick={() => {
            if (editingItemId) {
              handleCancelForm();
            } else {
              const nextShow = !showForm;
              setShowForm(nextShow);
              if (nextShow) window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm ? 'Cancelar' : 'Agregar'}</span>
        </button>
      </div>

      <div className="orders-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={18} /> Pendientes ({toBuy.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <CheckCircle size={18} /> Historial ({toBuyHistory.length})
        </button>
        {activeTab === 'history' && toBuyHistory.length > 0 && (
          <button
            className="clear-view-btn"
            onClick={() => {
              const clearMsg =
                '¡AVISO! Esto solo vaciará la lista visual del historial.\n\nNO afectará al stock ni al dinero registrado.\n\n¿Deseas continuar?';
              if (window.confirm(clearMsg)) {
                setToBuyHistory([]);
                addToast('Vista de historial limpiada.', 'info');
              }
            }}
          >
            Limpiar Vista
          </button>
        )}
      </div>

      {showForm && (
        <div className="item-form-container glass animate-fade-in">
          <h3>{editingItemId ? 'Editar Producto Faltante' : 'Anexar Producto Faltante'}</h3>
          <form onSubmit={handleSubmitItem} className="item-form">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <Package size={14} /> Producto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nombre del producto"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  list="products-list"
                />
                <datalist id="products-list">
                  {products.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>
                  <Hash size={14} /> Cantidad
                </label>
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
                <label>
                  <FileText size={14} /> Notas / Motivo
                </label>
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
                <td colSpan={5} className="empty-table-msg">
                  <div className="empty-state">
                    <ShoppingBag size={48} />
                    <p>
                      {activeTab === 'pending'
                        ? 'No hay productos pendientes.'
                        : 'El historial de compras está vacío.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              (activeTab === 'pending' ? toBuy : toBuyHistory)
                .sort((a, b) => {
                  if (activeTab === 'pending') {
                    const orderA = a.orderId ? orders.find((o) => o.id === a.orderId) : null;
                    const orderB = b.orderId ? orders.find((o) => o.id === b.orderId) : null;

                    const dateA = orderA?.deliveryDate ? new Date(orderA.deliveryDate).getTime() : 9999999999999;
                    const dateB = orderB?.deliveryDate ? new Date(orderB.deliveryDate).getTime() : 9999999999999;

                    return dateA - dateB;
                  }
                  return 0;
                })
                .map((item) => (
                  <tr key={item.id} className="to-buy-row">
                    <td className="product-name">
                      <div className="name-with-icon">
                        <Package size={16} className="text-primary" />
                        {item.productName}
                        {item.productId && (
                          <span title="Vínculo Verificado" className="id-verified">
                            <Hash size={12} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="qty-badge-table">{item.quantity} unds</span>
                    </td>
                    <td>
                      <div className="notes-col">
                        <span className="item-date">
                          {activeTab === 'pending'
                            ? item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : '—'
                            : `Comprado: ${'dateBought' in item && item.dateBought ? new Date(item.dateBought).toLocaleDateString() : '—'}`}
                        </span>
                        <span className="item-notes-small">{item.notes}</span>
                        {(() => {
                          const description =
                            item.orderDescription ||
                            (item.orderId ? orders.find((o) => o.id === item.orderId)?.desc : null);
                          return description ? (
                            <span className="order-desc-small">"{description}"</span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge-to-buy ${
                          activeTab === 'pending' ? 'status-pending' : 'status-bought'
                        }`}
                      >
                        {activeTab === 'pending' ? <Clock size={12} /> : <CheckCircle size={12} />}
                        {activeTab === 'pending' ? 'Pendiente' : 'Comprado'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {activeTab === 'pending' ? (
                          <>
                            <button
                              className="action-btn-check"
                              title="Marcar como comprado"
                              onClick={() => {
                                setSelectedItem(item as ToBuyItem);
                                setBuyModalOpen(true);
                              }}
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              className="action-btn-edit"
                              title="Editar producto"
                              onClick={() => handleEditClick(item as ToBuyItem)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="action-btn-delete"
                              title="Eliminar de la lista"
                              onClick={() => handleDeleteItem(item.id, false)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            className="action-btn-delete undo-btn"
                            title="Anular compra y revertir stock"
                            onClick={() => handleDeleteItem(item.id, true)}
                          >
                            <Trash2 size={16} />
                            <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>Anular</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {buyModalOpen && selectedItem && (
        <div style={MODAL_OVERLAY_STYLE} onClick={() => setBuyModalOpen(false)}>
          <div style={modalContentStyle('450px')} onClick={(e) => e.stopPropagation()}>
            <ModalHeader
              icon={Banknote}
              title="Registrar Compra"
              subtitle={`Producto: ${selectedItem.productName}`}
              onClose={() => setBuyModalOpen(false)}
            />
            <form onSubmit={handleConfirmPurchase}>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}>
                  <Package size={14} /> Producto Seleccionado
                </label>
                <input
                  style={{ ...MODAL_INPUT, opacity: 0.7, cursor: 'not-allowed' }}
                  type="text"
                  readOnly
                  value={selectedItem.productName}
                />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}>
                  <Hash size={14} /> Cantidad Comprada
                </label>
                <input
                  style={{ ...MODAL_INPUT, opacity: 0.7, cursor: 'not-allowed' }}
                  type="text"
                  readOnly
                  value={`${selectedItem.quantity} unidades`}
                />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}>
                  <Banknote size={14} /> Precio Unitario de Compra ($)
                </label>
                <input
                  style={MODAL_INPUT}
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  placeholder="0.00"
                  min="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}>
                  <CreditCard size={14} /> Método de Pago
                </label>
                <select
                  style={MODAL_INPUT}
                  value={purchaseMethod}
                  onChange={(e) => setPurchaseMethod(e.target.value)}
                >
                  <option value="EFECTIVO BCV">EFECTIVO BCV</option>
                  <option value="TRANSFERENCIA BCV">TRANSFERENCIA BCV</option>
                  <option value="USD">USD</option>
                  <option value="USDT">USDT</option>
                  <option value="ZINLI">ZINLI</option>
                </select>
              </div>
              <button type="submit" style={MODAL_BTN_SUCCESS}>
                Confirmar y Añadir a Stock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToBuy;
