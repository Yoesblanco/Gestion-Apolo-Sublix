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
  CreditCard
} from 'lucide-react';
import './ToBuy.css';

const ToBuy = () => {
  const { 
    toBuy = [], 
    setToBuy, 
    toBuyHistory = [], 
    setToBuyHistory, 
    products = [], 
    setProducts, 
    setStockHistory, 
    transactions, 
    setTransactions,
    orders = [] 
  } = useAppContext();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseMethod, setPurchaseMethod] = useState('EFECTIVO BCV');
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
    if (!formData.productName || !formData.quantity) return;

    // VALIDACIÓN AUTOMÁTICA DE ID:
    // Buscamos si el nombre que escribió el usuario ya existe en el inventario
    const matchedProduct = products.find(p => p.name.toLowerCase() === formData.productName.toLowerCase());

    if (editingItemId) {
      const updatedToBuy = toBuy.map(item =>
        item.id === editingItemId ? { 
          ...item, 
          productName: formData.productName,
          productId: matchedProduct ? matchedProduct.id : null, // Asignamos ID si existe
          quantity: parseInt(formData.quantity),
          notes: formData.notes
        } : item
      );
      setToBuy(updatedToBuy);
    } else {
      const newItem = {
        id: Date.now(),
        productId: matchedProduct ? matchedProduct.id : null, // Asignamos ID si existe
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
    const warningMsg = isHistory 
      ? '¡ADVERTENCIA DE SEGURIDAD! Estás a punto de ANULAR esta compra.\n\nEsto restará el stock del inventario, borrará el gasto de tus ventas y el producto volverá a aparecer como PENDIENTE.\n\n¿Estás SEGURO de que quieres deshacer esta operación?'
      : '¿Estás seguro de que deseas eliminar este registro de la lista de pendientes?';

    if (window.confirm(warningMsg)) {
      if (isHistory) {
        const itemToUndo = toBuyHistory.find(item => item.id === id);
        if (itemToUndo) {
          // 1. Revertir Stock en Inventario
          const updatedProducts = products.map(p => {
            // Buscamos coincidencia: por ID (si existe) o por nombre (si no hay ID)
            const isMatch = (itemToUndo.productId && p.id === itemToUndo.productId) || 
                            (p.name.toLowerCase() === itemToUndo.productName.toLowerCase());

            if (isMatch) {
              const qtyToSubtract = itemToUndo.quantity || 0;
              let currentQty = qtyToSubtract;
              let newReserved = p.reserved || 0;
              let newStock = p.stock || 0;

              if (itemToUndo.orderId) {
                // Si era un apartado, primero intentamos restar de "Apartados"
                const fromReserved = Math.min(newReserved, currentQty);
                newReserved -= fromReserved;
                currentQty -= fromReserved;
                
                // Si aún falta por restar (porque se movieron a disponible), restamos de "Disponible"
                if (currentQty > 0) {
                  newStock = Math.max(0, newStock - currentQty);
                }
              } else {
                // Si era stock general, restamos directo de "Disponible"
                newStock = Math.max(0, newStock - currentQty);
              }

              return { 
                ...p, 
                reserved: newReserved,
                stock: newStock, 
                status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock' 
              };
            }
            return p;
          });
          setProducts(updatedProducts);

          // 2. Eliminar Transacción (Gasto)
          if (itemToUndo.transactionId) {
            setTransactions(prev => prev.filter(t => t.id !== itemToUndo.transactionId));
          }

          // 3. Restaurar en Pendientes si era de un pedido
          if (itemToUndo.orderId) {
            const restoredItem = {
              ...itemToUndo,
              id: Date.now(),
              status: 'Pendiente',
              dateAdded: new Date().toISOString()
            };
            delete restoredItem.dateBought;
            delete restoredItem.purchasePrice;
            delete restoredItem.transactionId;
            setToBuy(prev => [restoredItem, ...prev]);
          }

          setToBuyHistory(toBuyHistory.filter(item => item.id !== id));
          addToast('Compra anulada y stock revertido correctamente.', 'info');
        }
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

    // 1. Buscar si el producto existe en el inventario (Prioridad ID, luego Nombre)
    const existingProduct = products.find(p => 
      (selectedItem.productId && p.id === selectedItem.productId) || 
      (p.name.toLowerCase() === selectedItem.productName.toLowerCase())
    );

    if (existingProduct) {
      const updatedProducts = products.map(p => {
        // Prioridad por ID, si no tiene ID (compras manuales), usamos el nombre
        const isMatch = (selectedItem.productId && p.id === selectedItem.productId) || 
                        (!selectedItem.productId && p.name.toLowerCase() === selectedItem.productName.toLowerCase());
        
        if (isMatch) {
          if (selectedItem.orderId) {
            const newReserved = (p.reserved || 0) + qty;
            return { ...p, reserved: newReserved };
          } else {
            const newStock = p.stock + qty;
            return {
              ...p,
              stock: newStock,
              status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock'
            };
          }
        }
        return p;
      });
      setProducts(updatedProducts);
    } else {
      // Si el producto es nuevo, también validamos si debe ir a Apartados
      const isReserved = !!selectedItem.orderId;
      const newProduct = {
        id: Date.now(),
        name: selectedItem.productName,
        category: 'Otros',
        stock: isReserved ? 0 : qty,
        reserved: isReserved ? qty : 0,
        price: price,
        status: (isReserved ? 0 : qty) > 10 ? 'En Stock' : (isReserved ? 0 : qty) > 0 ? 'Bajo Stock' : 'Sin Stock'
      };
      setProducts([newProduct, ...products]);
    }

    // Registrar gasto de la compra (Egreso)
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
      orderId: selectedItem.orderId || null
    };
    setTransactions(prev => [newTransaction, ...prev]);

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
      purchasePrice: price,
      productId: existingProduct ? existingProduct.id : selectedItem.productId, // ASEGURAMOS QUE EL ID SE GRABE
      transactionId: txId // VINCULAMOS PARA PODER REVERTIR
    };
    setToBuyHistory([boughtItem, ...toBuyHistory]);

    // 4. Quitar de la lista de pendientes
    setToBuy(toBuy.filter(item => item.id !== selectedItem.id));

    // 5. Limpiar estado
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
        <button className="add-item-btn" onClick={() => {
          if (editingItemId) {
            handleCancelForm();
          } else {
            const nextShow = !showForm;
            setShowForm(nextShow);
            if (nextShow) window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}>
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
        {activeTab === 'history' && toBuyHistory.length > 0 && (
          <button 
            className="clear-view-btn"
            onClick={() => {
              const clearMsg = '¡AVISO! Esto solo vaciará la lista visual del historial.\n\nNO afectará al stock ni al dinero registrado.\n\n¿Deseas continuar?';
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
              (activeTab === 'pending' ? toBuy : toBuyHistory)
                .sort((a, b) => {
                  if (activeTab === 'pending') {
                    // Obtener fechas de entrega de los pedidos anclados
                    const orderA = a.orderId ? orders.find(o => o.id === a.orderId) : null;
                    const orderB = b.orderId ? orders.find(o => o.id === b.orderId) : null;
                    
                    const dateA = orderA ? new Date(orderA.deliveryDate) : new Date('9999-12-31');
                    const dateB = orderB ? new Date(orderB.deliveryDate) : new Date('9999-12-31');
                    
                    return dateA - dateB;
                  }
                  return 0; // El historial se mantiene por fecha de compra (ya ordenado por push)
                })
                .map((item) => (
                <tr key={item.id} className="to-buy-row">
                  <td className="product-name">
                    <div className="name-with-icon">
                      <Package size={16} className="text-primary" />
                      {item.productName}
                      {item.productId && <span title="Vínculo Verificado" className="id-verified"><Hash size={12} /></span>}
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
                      {(() => {
                        const description = item.orderDescription || (item.orderId ? orders.find(o => o.id === item.orderId)?.desc : null);
                        return description ? (
                          <span className="order-desc-small">
                            " {description} "
                          </span>
                        ) : null;
                      })()}
                      {item.orderId && (
                        <div className="order-link-badge">
                          <span>Pedido: <strong>{item.orderId}</strong></span>
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
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content glass modal-content-sm">
            <div className="modal-header">
              <h3>Registrar Compra</h3>
              <button className="close-btn" onClick={() => setBuyModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p className="purchase-info">
                Confirmar que has comprado <strong>{selectedItem?.quantity} unds</strong> de <strong>{selectedItem?.productName}</strong>.
              </p>
              {selectedItem?.orderId && (
                <div className="purchase-order-link">
                  Este artículo está vinculado al pedido <strong>{selectedItem.orderId}</strong>.
                </div>
              )}
              <form onSubmit={handleConfirmPurchase} className="purchase-form">
                <div className="form-group">
                  <label><Banknote size={14} /> Costo Unitario ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    autoFocus
                    placeholder="0.00" 
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                  />
                  <small style={{ opacity: 0.6, marginTop: '8px', display: 'block' }}>Este precio actualizará el inventario.</small>
                </div>
                <div className="form-group">
                  <label><CreditCard size={14} /> Método de Pago</label>
                  <select 
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
                <button type="submit" className="submit-purchase-btn">
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
