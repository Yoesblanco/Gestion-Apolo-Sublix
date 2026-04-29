import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { formatUSD } from '../utils/formatters';
import confetti from 'canvas-confetti';
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
  ArrowLeft,
  Package,
  Hash,
  Banknote,
  Phone,
  Mail,
  AlertTriangle,
  Edit2,
  Maximize2
} from 'lucide-react';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { 
    orders, setOrders, 
    products, setProducts, 
    customers, setCustomers, 
    toBuy = [], setToBuy, 
    stockHistory = [], setStockHistory,
    addToast
  } = useAppContext();

  // Celebra la entrega
  const fireConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#10b981', '#f59e0b']
    });
  };
  const [activeTab, setActiveTab] = useState('pending');
  const [editingOrderId, setEditingOrderId] = useState(null);

  const pendingOrders = orders.filter(o => (o.status || 'Pendiente') !== 'Entregado');
  const finishedOrders = orders.filter(o => (o.status || 'Pendiente') === 'Entregado');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    description: '',
    emissionDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    quantity: '',
    price: '',
    // New customer fields
    newName: '',
    newPhone: '',
    newEmail: '',
    newProductName: ''
  });

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Entregado': return <CheckCircle size={16} />;
      case 'Pendiente': return <Clock size={16} />;
      case 'Cancelado': return <XCircle size={16} />;
      default: return null;
    }
  };

  const handleEditClick = (order) => {
    setEditingOrderId(order.id);
    
    // Buscar el producto y cliente por nombre si no tienen ID (para pedidos viejos)
    const product = products.find(p => p.id === order.productId || p.name === order.productName);
    const customer = customers.find(c => c.id === order.customerId || c.name === order.customer);
    
    setFormData({
      customerId: customer ? customer.id.toString() : '',
      productId: product ? product.id.toString() : '',
      description: order.desc || '',
      emissionDate: order.date || new Date().toISOString().split('T')[0],
      deliveryDate: order.deliveryDate || '',
      quantity: order.quantity ? order.quantity.toString() : '',
      price: order.total ? order.total.toString() : '',
      newName: '',
      newPhone: '',
      newEmail: '',
      newProductName: ''
    });
    setIsNewCustomer(false);
    setIsNewProduct(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingOrderId(null);
    setFormData({
      customerId: '',
      productId: '',
      description: '',
      emissionDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      quantity: '',
      price: '',
      newName: '',
      newPhone: '',
      newEmail: '',
      newProductName: ''
    });
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if ((!isNewProduct && !formData.productId) || !formData.quantity) {
      alert('Por favor selecciona un producto y la cantidad.');
      return;
    }

    let updatedProducts = [...products];
    let updatedStockHistory = [...(stockHistory || [])];
    let updatedToBuy = [...toBuy];

    // IF EDITING: First revert previous stock impact locally
    if (editingOrderId) {
      const oldOrder = orders.find(o => o.id === editingOrderId);
      if (oldOrder && oldOrder.status !== 'Entregado') {
        const orderHistoryEntries = updatedStockHistory.filter(h => h.orderId === editingOrderId && h.type === 'Salida');
        
        orderHistoryEntries.forEach(record => {
          updatedProducts = updatedProducts.map(p => {
            if (p.name === record.productName) {
              const restoredStock = p.stock + record.quantity;
              return {
                ...p,
                stock: restoredStock,
                status: restoredStock > 10 ? 'En Stock' : restoredStock > 0 ? 'Bajo Stock' : 'Sin Stock'
              };
            }
            return p;
          });
        });
        
        updatedStockHistory = updatedStockHistory.filter(h => h.orderId !== editingOrderId);
        updatedToBuy = updatedToBuy.filter(item => item.orderId !== editingOrderId);
      }
    }

    let customerName = '';
    let customerId = null;

    if (isNewCustomer) {
      const newId = Date.now();
      const newCustomer = {
        id: newId,
        name: formData.newName,
        phone: formData.newPhone,
        email: formData.newEmail,
        city: 'No especificada'
      };
      setCustomers([newCustomer, ...customers]);
      customerName = formData.newName;
      customerId = newId;
    } else {
      const selectedCustomer = customers.find(c => c.id === parseInt(formData.customerId));
      if (!selectedCustomer) {
        alert('Por favor selecciona un cliente.');
        return;
      }
      customerName = selectedCustomer.name;
      customerId = selectedCustomer.id;
    }

    const requiredQuantity = parseInt(formData.quantity);
    const orderId = editingOrderId || `ORD-${Math.floor(100 + Math.random() * 900)}`;
    let finalProductName = '';
    let missingAmount = 0;

    if (isNewProduct) {
      finalProductName = formData.newProductName;
      updatedToBuy = [{
        id: Date.now(),
        productName: finalProductName,
        quantity: requiredQuantity,
        notes: `Requerido para pedido de ${customerName} (${orderId})`,
        status: 'Pendiente',
        dateAdded: new Date().toISOString(),
        orderId: orderId,
        customer: customerName
      }, ...updatedToBuy];
    } else {
      const selectedProduct = updatedProducts.find(p => p.id === parseInt(formData.productId));
      if (!selectedProduct) return;
      finalProductName = selectedProduct.name;

      let newStock = selectedProduct.stock - requiredQuantity;

      if (newStock < 0) {
        missingAmount = Math.abs(newStock);
        newStock = 0;
        updatedToBuy = [{
          id: Date.now(),
          productName: selectedProduct.name,
          quantity: missingAmount,
          notes: `Faltante para pedido de ${customerName} (${orderId})`,
          status: 'Pendiente',
          dateAdded: new Date().toISOString(),
          orderId: orderId,
          customer: customerName
        }, ...updatedToBuy];
      }

      const subtractedQty = selectedProduct.stock - newStock;
      if (subtractedQty > 0) {
        updatedStockHistory = [{
          id: Date.now(),
          date: new Date().toISOString(),
          type: 'Salida',
          productName: selectedProduct.name,
          customer: customerName,
          quantity: subtractedQty,
          orderId: orderId,
          notes: 'Reserva para pedido'
        }, ...updatedStockHistory];
      }

      updatedProducts = updatedProducts.map(p => {
        if (p.id === selectedProduct.id) {
          return {
            ...p,
            stock: newStock,
            status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock'
          };
        }
        return p;
      });
    }

    const newOrderData = {
      id: orderId,
      customerId: customerId,
      customer: customerName,
      productName: finalProductName,
      date: formData.emissionDate,
      deliveryDate: formData.deliveryDate,
      total: parseFloat(formData.price || 0),
      status: editingOrderId ? orders.find(o => o.id === editingOrderId).status : 'Pendiente',
      desc: formData.description,
      quantity: requiredQuantity,
      pendingStockToSubtract: isNewProduct ? requiredQuantity : missingAmount
    };

    setProducts(updatedProducts);
    setStockHistory(updatedStockHistory);
    setToBuy(updatedToBuy);

    if (editingOrderId) {
      setOrders(orders.map(o => o.id === editingOrderId ? newOrderData : o));
    } else {
      setOrders([newOrderData, ...orders]);
    }

    handleCancelForm();
  };

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'Entregado') {
      const order = orders.find(o => o.id === id);
      if (order && order.pendingStockToSubtract > 0) {
        const updatedProducts = products.map(p => {
          if (p.name === order.productName) {
            const newStock = Math.max(0, p.stock - order.pendingStockToSubtract);
            return {
              ...p,
              stock: newStock,
              status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock'
            };
          }
          return p;
        });
        setProducts(updatedProducts);

        const historyEntry = {
          id: Date.now(),
          date: new Date().toISOString(),
          type: 'Salida',
          productName: order.productName,
          customer: order.customer,
          quantity: order.pendingStockToSubtract,
          orderId: order.id,
          notes: 'Salida de stock comprado para pedido'
        };
        setStockHistory(prev => [historyEntry, ...(prev || [])]);
      }

      setToBuy(toBuy.filter(item => item.orderId !== id));
      setOrders(orders.map(order => 
        order.id === id ? { ...order, status: newStatus, pendingStockToSubtract: 0 } : order
      ));
      
      fireConfetti();
      addToast(`¡Pedido de ${order ? order.customer : 'Cliente'} entregado!`, 'success');
    } else {
      setOrders(orders.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ));
      addToast(`Estado del pedido actualizado a ${newStatus}.`, 'info');
    }
  };

  const handleDeleteOrder = (id) => {
    const orderToDelete = orders.find(o => o.id === id);
    if (!orderToDelete) return;

    const isFinished = orderToDelete.status === 'Entregado';
    const confirmMsg = isFinished 
      ? '¿Estás seguro de que deseas eliminar este pedido finalizado?'
      : '¿Estás seguro de que deseas eliminar este pedido? (Se devolverá el stock al inventario)';

    if (window.confirm(confirmMsg)) {
      setOrders(orders.filter(order => order.id !== id));
      if (!isFinished) {
        setToBuy(toBuy.filter(item => item.orderId !== id));
        const orderHistoryEntries = (stockHistory || []).filter(h => h.orderId === id && h.type === 'Salida');
        let updatedProducts = [...products];
        orderHistoryEntries.forEach(record => {
          updatedProducts = updatedProducts.map(p => {
            if (p.name === record.productName) {
              const restoredStock = p.stock + record.quantity;
              return {
                ...p,
                stock: restoredStock,
                status: restoredStock > 10 ? 'En Stock' : restoredStock > 0 ? 'Bajo Stock' : 'Sin Stock'
              };
            }
            return p;
          });
        });
        setProducts(updatedProducts);
        setStockHistory((stockHistory || []).filter(h => h.orderId !== id));
      }
      addToast('Pedido eliminado correctamente.', 'info');
    }
  };

  const expiringOrders = orders.filter(order => {
    if (order.status !== 'Pendiente') return false;
    if (!order.deliveryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inTwoDays = new Date(today);
    inTwoDays.setDate(today.getDate() + 2);
    const delivery = new Date(order.deliveryDate);
    return delivery >= today && delivery <= inTwoDays;
  });

  return (
    <div className="orders animate-fade-in">
      {expiringOrders.length > 0 && (
        <div className="alert-banner warning glass" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
          <AlertTriangle size={24} color="#f59e0b" />
          <div>
            <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '1.1rem' }}>¡Atención! Pedidos por vencer</h4>
            <p style={{ margin: '4px 0 0', opacity: 0.9 }}>
              Tienes {expiringOrders.length} pedido(s) que deben entregarse pronto.
            </p>
          </div>
        </div>
      )}

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
        <button className="add-order-btn" onClick={() => editingOrderId ? handleCancelForm() : setShowForm(!showForm)}>
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm ? 'Cancelar' : 'Nuevo Pedido'}</span>
        </button>
      </div>

      <div className="orders-tabs">
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          <Clock size={18} /> En Curso ({pendingOrders.length})
        </button>
        <button className={`tab-btn ${activeTab === 'finished' ? 'active' : ''}`} onClick={() => setActiveTab('finished')}>
          <CheckCircle size={18} /> Finalizados ({finishedOrders.length})
        </button>
      </div>

      {showForm && (
        <div className="order-form-container glass animate-fade-in">
          <h3>{editingOrderId ? 'Editar Pedido' : 'Registrar Nuevo Pedido'}</h3>
          <form onSubmit={handleSubmitOrder} className="order-form">
            <div className="form-row">
              <div className="form-group">
                <label><User size={14} /> Cliente</label>
                <select
                  required
                  value={isNewCustomer ? "new" : formData.customerId}
                  onChange={(e) => {
                    if (e.target.value === "new") {
                      setIsNewCustomer(true);
                      setFormData({ ...formData, customerId: '' });
                    } else {
                      setIsNewCustomer(false);
                      setFormData({ ...formData, customerId: e.target.value });
                    }
                  }}
                >
                  <option value="">Seleccionar Cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="new">+ Crear Nuevo Cliente</option>
                </select>
              </div>
              <div className="form-group">
                <label><Package size={14} /> Producto</label>
                <select
                  required
                  value={isNewProduct ? "new_product" : formData.productId}
                  onChange={(e) => {
                    if (e.target.value === "new_product") {
                      setIsNewProduct(true);
                      setFormData({ ...formData, productId: '' });
                    } else {
                      setIsNewProduct(false);
                      setFormData({ ...formData, productId: e.target.value });
                    }
                  }}
                >
                  <option value="">Seleccionar Producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                  <option value="new_product">+ Producto Nuevo / Sin Stock</option>
                </select>
              </div>
            </div>

            {isNewProduct && (
              <div className="form-row animate-fade-in new-customer-fields">
                <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                  <label><Package size={14} /> Nombre del Nuevo Producto</label>
                  <input
                    type="text"
                    required
                    placeholder="Escribe el nombre del producto que falta..."
                    value={formData.newProductName}
                    onChange={(e) => setFormData({ ...formData, newProductName: e.target.value })}
                  />
                </div>
              </div>
            )}

            {isNewCustomer && (
              <div className="form-row animate-fade-in new-customer-fields">
                <div className="form-group">
                  <label><User size={14} /> Nombre del Nuevo Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={formData.newName}
                    onChange={(e) => setFormData({ ...formData, newName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label><Phone size={14} /> Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+58 ..."
                    value={formData.newPhone}
                    onChange={(e) => setFormData({ ...formData, newPhone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label><Mail size={14} /> Correo</label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.newEmail}
                    onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label><Calendar size={14} /> Fecha Entrega</label>
                <input
                  type="date"
                  required
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label><Hash size={14} /> Cantidad</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><FileText size={14} /> Detalles</label>
                <input
                  type="text"
                  placeholder="Descripción opcional..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label><Banknote size={14} /> Precio Total ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="submit-order-btn">
              {editingOrderId ? 'Guardar Cambios' : 'Confirmar y Descontar Stock'}
            </button>
          </form>
        </div>
      )}

      <div className="orders-list">
        {(activeTab === 'pending' ? pendingOrders : finishedOrders).map((order) => (
          <OrderItem 
            key={order.id} 
            order={order} 
            handleDeleteOrder={handleDeleteOrder} 
            handleStatusChange={handleStatusChange} 
            handleEditClick={handleEditClick}
            formatUSD={formatUSD}
            getStatusIcon={getStatusIcon}
          />
        ))}
      </div>
    </div>
  );
};

const OrderItem = ({ order, handleDeleteOrder, handleStatusChange, handleEditClick, formatUSD, getStatusIcon }) => (
  <div className="order-item glass">
    <div className="order-main">
      <div className="order-icon-wrapper"><ShoppingBag size={24} /></div>
      <div className="order-info">
        <div className="id-badge">{order.id}</div>
        <h3>{order.customer}</h3>
        <p className="order-product"><strong>Producto:</strong> {order.productName}</p>
        <p className="order-desc">{order.desc}</p>
      </div>
    </div>

    <div className="order-meta">
      <div className="order-details-grid">
        <div className="detail-item"><span className="label">Entrega</span><span>{order.deliveryDate}</span></div>
        <div className="detail-item"><span className="label">Cant.</span><span>{order.quantity}</span></div>
        <div className="detail-item"><span className="label">Total</span><span className="amount">${typeof order.total === 'number' ? formatUSD(order.total) : order.total}</span></div>
      </div>
      <div className={`order-status ${(order.status || 'Pendiente').toLowerCase()}`}>
        {getStatusIcon(order.status || 'Pendiente')}
        <span>{order.status || 'Pendiente'}</span>
      </div>
      <div className="order-actions">
        {order.status !== 'Entregado' && (
          <>
            <button className="finish-btn" onClick={() => handleStatusChange(order.id, 'Entregado')} title="Finalizar"><CheckCircle size={18} /></button>
            <button className="edit-btn" onClick={() => handleEditClick(order)} title="Editar"><Edit2 size={18} /></button>
          </>
        )}
        <button className="delete-btn" onClick={() => handleDeleteOrder(order.id)} title="Eliminar"><Trash2 size={18} /></button>
      </div>
    </div>
  </div>
);

export default Orders;

