import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, formatUSD } from '../context/AppContext';
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
  AlertTriangle
} from 'lucide-react';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { orders, setOrders, products, setProducts, customers, setCustomers, toBuy = [], setToBuy, stockHistory = [], setStockHistory } = useAppContext();

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

  const handleAddOrder = (e) => {
    e.preventDefault();
    if ((!isNewProduct && !formData.productId) || !formData.quantity) {
      alert('Por favor selecciona un producto y la cantidad.');
      return;
    }

    let customerName = '';

    if (isNewCustomer) {
      if (!formData.newName) {
        alert('Por favor ingresa el nombre del nuevo cliente.');
        return;
      }
      const newCustomer = {
        id: Date.now(),
        name: formData.newName,
        phone: formData.newPhone,
        email: formData.newEmail,
        city: 'No especificada'
      };
      setCustomers([newCustomer, ...customers]);
      customerName = formData.newName;
    } else {
      const selectedCustomer = customers.find(c => c.id === parseInt(formData.customerId));
      if (!selectedCustomer) {
        alert('Por favor selecciona un cliente.');
        return;
      }
      customerName = selectedCustomer.name;
    }

    const requiredQuantity = parseInt(formData.quantity);
    const newOrderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    let finalProductName = '';

    if (isNewProduct) {
      if (!formData.newProductName) {
        alert('Por favor ingresa el nombre del nuevo producto.');
        return;
      }
      finalProductName = formData.newProductName;

      const newToBuyItem = {
        id: Date.now(),
        productName: finalProductName,
        quantity: requiredQuantity,
        notes: `Producto nuevo solicitado para pedido de ${customerName} (${newOrderId})`,
        status: 'Pendiente',
        dateAdded: new Date().toISOString(),
        orderId: newOrderId,
        customer: customerName
      };
      setToBuy(prev => [newToBuyItem, ...prev]);
      alert(`Se han agregado ${requiredQuantity} unidades de "${finalProductName}" a la lista de "Por comprar".`);
    } else {
      const selectedProduct = products.find(p => p.id === parseInt(formData.productId));
      if (!selectedProduct) return;
      finalProductName = selectedProduct.name;

      let missingAmount = 0;
      let newStock = selectedProduct.stock - requiredQuantity;

      if (newStock < 0) {
        missingAmount = Math.abs(newStock);
        newStock = 0;

        const newToBuyItem = {
          id: Date.now(),
          productName: selectedProduct.name,
          quantity: missingAmount,
          notes: `Faltante para pedido de ${customerName} (${newOrderId})`,
          status: 'Pendiente',
          dateAdded: new Date().toISOString(),
          orderId: newOrderId,
          customer: customerName
        };
        setToBuy(prev => [newToBuyItem, ...prev]);
        alert(`Stock insuficiente. Se han agregado ${missingAmount} unidades de ${selectedProduct.name} a la lista de "Por comprar".`);
      }

      // Decrement stock and add to global history
      const subtractedQty = selectedProduct.stock - newStock;
      if (subtractedQty > 0) {
        const historyEntry = {
          id: Date.now(),
          date: new Date().toISOString(),
          type: 'Salida',
          productName: selectedProduct.name,
          customer: customerName,
          quantity: subtractedQty,
          orderId: newOrderId,
          notes: 'Reserva para pedido'
        };
        setStockHistory(prev => [historyEntry, ...(prev || [])]);
      }

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
      setProducts(updatedProducts);
    }

    const newOrder = {
      id: newOrderId,
      customer: customerName,
      productName: finalProductName,
      date: formData.emissionDate,
      deliveryDate: formData.deliveryDate,
      total: parseFloat(formData.price || 0),
      status: 'Pendiente',
      desc: formData.description,
      quantity: parseInt(formData.quantity || 0)
    };

    setOrders([newOrder, ...orders]);
    setShowForm(false);
    setIsNewCustomer(false);
    setIsNewProduct(false);
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

  const handleDeleteOrder = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este pedido? (Esto eliminará el registro de Por Comprar y devolverá el stock al inventario)')) {
      setOrders(orders.filter(order => order.id !== id));
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
              Tienes {expiringOrders.length} pedido(s) que deben entregarse pronto:{' '}
              {expiringOrders.map(o => `${o.quantity} unds de ${o.productName} (${o.customer})`).join(', ')}.
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
        <button className="add-order-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm ? 'Cancelar' : 'Nuevo Pedido'}</span>
        </button>
      </div>

      {showForm && (
        <div className="order-form-container glass animate-fade-in">
          <h3>Registrar Nuevo Pedido</h3>
          <form onSubmit={handleAddOrder} className="order-form">
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
                  min={new Date().toISOString().split('T')[0]}
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
              Confirmar y Descontar Stock
            </button>
          </form>
        </div>
      )}

      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="empty-state glass">
            <ShoppingBag size={48} />
            <p>No hay pedidos registrados.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-item glass">
              <div className="order-main">
                <div className="order-icon-wrapper">
                  <ShoppingBag size={24} />
                </div>
                <div className="order-info">
                  <div className="id-badge">{order.id}</div>
                  <h3>{order.customer}</h3>
                  <p className="order-product"><strong>Producto:</strong> {order.productName}</p>
                  <p className="order-desc">{order.desc}</p>
                </div>
              </div>

              <div className="order-meta">
                <div className="order-details-grid">
                  <div className="detail-item">
                    <span className="label">Entrega</span>
                    <span>{order.deliveryDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Cant.</span>
                    <span>{order.quantity}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total</span>
                    <span className="amount">${typeof order.total === 'number' ? formatUSD(order.total) : order.total}</span>
                  </div>
                </div>
                <div className={`order-status ${order.status.toLowerCase()}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status}</span>
                </div>
                <div className="order-actions">
                  <button className="delete-btn" onClick={() => handleDeleteOrder(order.id)}>
                    <Trash2 size={18} />
                  </button>
                  <button className="view-details">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
