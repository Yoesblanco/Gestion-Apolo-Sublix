import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatUSD } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  X,
  Calendar,
  User,
  FileText,
  Trash2,
  Package,
  Hash,
  Banknote,
  Phone,
  Mail,
  AlertTriangle,
  Edit2,
  CreditCard,
} from 'lucide-react';
import { Order, Product, Customer, StockHistoryItem, ToBuyItem, Payment } from '../types';
import './Orders.css';
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

export const Orders: React.FC = () => {
  const {
    orders,
    setOrders,
    products,
    setProducts,
    customers,
    setCustomers,
    transactions,
    setTransactions,
    toBuy = [],
    setToBuy,
    stockHistory = [],
    setStockHistory,
    addToast,
  } = useAppContext();

  const fireConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#10b981', '#f59e0b'],
    });
  };

  const [activeTab, setActiveTab] = useState<'pending' | 'finished'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const pendingOrders = orders.filter((o) => (o.status || 'Pendiente') !== 'Entregado');
  const finishedOrders = orders.filter((o) => (o.status || 'Pendiente') === 'Entregado');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
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
    newProductName: '',
    deposit: '',
    paymentMethod: 'EFECTIVO BCV',
  });

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);

  useScrollLock(showForm || !!editingOrderId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Entregado':
        return <CheckCircle size={16} />;
      case 'Pendiente':
        return <Clock size={16} />;
      case 'Cancelado':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  const handleEditClick = (order: Order) => {
    setEditingOrderId(order.id);

    const product = products.find((p) => p.id === order.productId || p.name === order.productName);
    const customer = customers.find((c) => c.id === order.customerId || c.name === order.customer);

    const formatDateForInput = (dateStr?: string) => {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    setFormData({
      customerId: customer ? customer.id.toString() : '',
      productId: product ? product.id.toString() : order.productId ? order.productId.toString() : '',
      description: order.desc || '',
      emissionDate: formatDateForInput(order.date),
      deliveryDate: formatDateForInput(order.deliveryDate),
      quantity: order.quantity ? order.quantity.toString() : '',
      price: order.total ? order.total.toString() : '',
      newName: '',
      newPhone: '',
      newEmail: '',
      newProductName: product ? '' : order.productName || '',
      deposit: '',
      paymentMethod: 'EFECTIVO BCV',
    });

    setIsNewCustomer(false);
    setIsNewProduct(!product);
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
      newProductName: '',
      deposit: '',
      paymentMethod: 'EFECTIVO BCV',
    });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!formData.deliveryDate) {
        addToast('Por favor selecciona una fecha de entrega.', 'error');
        setIsSubmitting(false);
        return;
      }
      if ((!isNewProduct && !formData.productId) || !formData.quantity) {
        addToast('Por favor selecciona un producto y la cantidad.', 'error');
        setIsSubmitting(false);
        return;
      }

      const depositAmount = parseFloat(formData.deposit || '0');
      const totalPrice = parseFloat(formData.price || '0');

      if (depositAmount > totalPrice) {
        addToast('El abono inicial no puede ser mayor al precio total.', 'error');
        setIsSubmitting(false);
        return;
      }

      let updatedProducts = [...products];
      let updatedStockHistory = [...(stockHistory || [])];
      let updatedToBuy = [...toBuy];

      if (editingOrderId) {
        const oldOrder = orders.find((o) => o.id === editingOrderId);
        if (oldOrder && oldOrder.status !== 'Entregado') {
          const orderHistoryEntries = updatedStockHistory.filter(
            (h) => h.orderId === editingOrderId && h.type === 'Salida'
          );

          orderHistoryEntries.forEach((record) => {
            updatedProducts = updatedProducts.map((p) => {
              if (p.name === record.productName) {
                const restoredStock = p.stock + record.quantity;
                return {
                  ...p,
                  stock: restoredStock,
                  status: restoredStock > 10 ? 'En Stock' : restoredStock > 0 ? 'Bajo Stock' : 'Sin Stock',
                };
              }
              return p;
            });
          });

          updatedStockHistory = updatedStockHistory.filter((h) => h.orderId !== editingOrderId);
          updatedToBuy = updatedToBuy.filter((item) => item.orderId !== editingOrderId);
        }
      }

      let customerName = '';
      let customerId: string | null = null;

      if (isNewCustomer) {
        const newId = Date.now().toString();
        const newCustomer: Customer = {
          id: newId,
          name: formData.newName,
          phone: formData.newPhone,
          email: formData.newEmail,
          city: 'No especificada',
        };
        setCustomers((prev) => [newCustomer, ...prev]);
        customerName = formData.newName;
        customerId = newId;
      } else {
        const selectedCustomer = customers.find((c) => c.id === formData.customerId);
        if (!selectedCustomer) {
          addToast('Por favor selecciona un cliente.', 'error');
          setIsSubmitting(false);
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
        updatedToBuy = [
          {
            id: Date.now().toString(),
            productName: finalProductName,
            quantity: requiredQuantity,
            notes: `Requerido para pedido de ${customerName} (${orderId})`,
            orderDescription: formData.description,
            status: 'Pendiente',
            dateAdded: new Date().toISOString(),
            orderId: orderId,
            customer: customerName,
          },
          ...updatedToBuy,
        ];
      } else {
        const selectedProduct = updatedProducts.find((p) => p.id === formData.productId);
        if (!selectedProduct) {
          setIsSubmitting(false);
          return;
        }
        finalProductName = selectedProduct.name;

        let newStock = selectedProduct.stock - requiredQuantity;

        if (newStock < 0) {
          missingAmount = Math.abs(newStock);
          newStock = 0;
          updatedToBuy = [
            {
              id: Date.now().toString(),
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              quantity: missingAmount,
              notes: `Faltante para pedido de ${customerName} (${orderId})`,
              orderDescription: formData.description,
              status: 'Pendiente',
              dateAdded: new Date().toISOString(),
              orderId: orderId,
              customer: customerName,
            },
            ...updatedToBuy,
          ];
        }

        const subtractedQty = selectedProduct.stock - newStock;
        if (subtractedQty > 0) {
          updatedStockHistory = [
            {
              id: Date.now(),
              date: new Date().toISOString(),
              type: 'Salida',
              productName: selectedProduct.name,
              customer: customerName,
              quantity: subtractedQty,
              orderId: orderId,
              notes: 'Reserva para pedido',
            },
            ...updatedStockHistory,
          ];
        }

        updatedProducts = updatedProducts.map((p) => {
          if (p.id === selectedProduct.id) {
            return {
              ...p,
              stock: newStock,
              status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock',
            };
          }
          return p;
        });
      }

      const txId = `TX-${Date.now() + 1}`;
      const payments: Payment[] =
        depositAmount > 0
          ? [
              {
                id: Date.now(),
                amount: depositAmount,
                date: new Date().toISOString(),
                method: formData.paymentMethod || 'EFECTIVO BCV',
                notes: 'Abono inicial',
                transactionId: txId,
              },
            ]
          : [];

      let oldOrder: Order | undefined;
      if (editingOrderId) {
        oldOrder = orders.find((o) => o.id === editingOrderId);
      }

      const newOrderData: Order = {
        id: orderId,
        customerId: customerId,
        customer: customerName,
        productName: finalProductName,
        date: formData.emissionDate,
        deliveryDate: formData.deliveryDate,
        total: parseFloat(formData.price || '0'),
        status: oldOrder ? oldOrder.status : 'Pendiente',
        desc: formData.description,
        quantity: requiredQuantity,
        pendingStockToSubtract: isNewProduct ? requiredQuantity : missingAmount,
        payments: oldOrder ? oldOrder.payments || [] : payments,
      };

      setProducts(updatedProducts);
      setStockHistory(updatedStockHistory);

      if (editingOrderId && oldOrder && oldOrder.status === 'Entregado') {
        setTransactions((prev) =>
          prev.map((t) => {
            if (t.orderId === editingOrderId) {
              return {
                ...t,
                amount: parseFloat(formData.price || '0'),
                description: `Venta finalizada pedido ${editingOrderId} - ${customerName}`,
              };
            }
            return t;
          })
        );
      }

      setToBuy((prev) => {
        const cleanList = prev.filter((item) => item.orderId !== orderId);
        return [...updatedToBuy.filter((item) => item.orderId === orderId), ...cleanList];
      });

      if (editingOrderId) {
        setOrders((prev) => prev.map((o) => (o.id === editingOrderId ? newOrderData : o)));
      } else {
        setOrders((prev) => [newOrderData, ...prev]);
      }

      handleCancelForm();
      setIsSubmitting(false);
    } catch (error: unknown) {
      console.error(error);
      setIsSubmitting(false);
      addToast('Error crítico detectado: ' + (error instanceof Error ? error.message : String(error)), 'error');
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    if (newStatus === 'Entregado') {
      const confirmSale = window.confirm(
        `¿Estás seguro de entregar este pedido? \n\nSe registrará una venta final por: $${formatUSD(order.total)}`
      );
      if (!confirmSale) return;

      if (order.pendingStockToSubtract && order.pendingStockToSubtract > 0) {
        const historyEntry: StockHistoryItem = {
          id: Date.now(),
          date: new Date().toISOString(),
          type: 'Salida',
          productName: order.productName || 'Producto',
          customer: order.customer,
          quantity: order.pendingStockToSubtract,
          orderId: order.id,
          notes: 'Salida de stock comprado para pedido',
        };
        setStockHistory((prev) => [historyEntry, ...(prev || [])]);
      }

      setToBuy(toBuy.filter((item) => item.orderId !== id));

      setTransactions((prev) => [
        {
          id: `TX-FINAL-${Date.now()}`,
          date: new Date().toISOString(),
          amount: order.total,
          type: 'Ingreso',
          category: 'Venta/Pedido',
          description: `Venta finalizada pedido ${order.id} - ${order.customer}`,
          orderId: order.id,
        },
        ...prev,
      ]);

      setOrders(
        orders.map((o) => {
          if (o.id === id) {
            const currentPaid = (o.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const balance = o.total - currentPaid;
            let updatedPayments = o.payments || [];
            if (balance > 0) {
              updatedPayments = [
                ...updatedPayments,
                {
                  id: Date.now(),
                  amount: balance,
                  date: new Date().toISOString(),
                  method: 'Efectivo',
                  notes: 'Saldo automático al entregar',
                },
              ];
            }
            return { ...o, status: newStatus, pendingStockToSubtract: 0, payments: updatedPayments };
          }
          return o;
        })
      );

      fireConfetti();
      addToast(`¡Pedido entregado! Venta de $${order.total} registrada en Finanzas.`, 'success');
    } else if (newStatus === 'Cancelado') {
      let updatedProducts = [...products];

      const orderHistoryEntries = (stockHistory || []).filter((h) => h.orderId === id && h.type === 'Salida');
      orderHistoryEntries.forEach((record) => {
        updatedProducts = updatedProducts.map((p) => {
          const isMatch = p.id === order.productId || p.name === record.productName;
          if (isMatch) {
            const restoredStock = p.stock + record.quantity;
            return {
              ...p,
              stock: restoredStock,
              status: restoredStock > 10 ? 'En Stock' : restoredStock > 0 ? 'Bajo Stock' : 'Sin Stock',
            };
          }
          return p;
        });
      });

      setProducts(updatedProducts);
      setStockHistory((stockHistory || []).filter((h) => !(h.orderId === id && h.type === 'Salida')));
      setToBuy(toBuy.filter((item) => item.orderId !== id));

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus, pendingStockToSubtract: 0 } : o))
      );
      addToast('Pedido cancelado. El stock ha vuelto al inventario disponible.', 'info');
    } else {
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: newStatus } : order)));
      addToast(`Estado del pedido actualizado a ${newStatus}.`, 'info');
    }
  };

  const handleAddPayment = (orderId: string, amount: string) => {
    const paymentValue = parseFloat(amount);
    if (!paymentValue || paymentValue <= 0) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const currentPaid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balance = order.total - currentPaid;

    if (paymentValue > balance + 0.01) {
      addToast(`El monto ($${paymentValue}) no puede ser mayor al saldo pendiente ($${formatUSD(balance)}).`, 'error');
      return;
    }

    const txId = `TX-${Date.now() + 1}`;
    const newPayment: Payment = {
      id: Date.now(),
      amount: paymentValue,
      date: new Date().toISOString(),
      method: 'Efectivo',
      notes: 'Abono adicional',
      transactionId: txId,
    };

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            payments: [...(o.payments || []), newPayment],
          };
        }
        return o;
      })
    );
    addToast(`Pago de $${amount} registrado internamente. Se sumará a Ventas al entregar el pedido.`, 'success');
  };

  const handleDeletePayment = (orderId: string, paymentId: number | string, transactionId?: string | number | null) => {
    if (
      window.confirm(
        '¿Deseas eliminar este pago? Se restará del total abonado y se eliminará el registro de venta.'
      )
    ) {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              payments: (o.payments || []).filter((p) => p.id !== paymentId),
            };
          }
          return o;
        })
      );

      if (transactionId) {
        setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
      }
      addToast('Pago eliminado correctamente.', 'info');
    }
  };

  const handleDeleteOrder = (id: string) => {
    const orderToDelete = orders.find((o) => o.id === id);
    if (!orderToDelete) return;

    const isFinished = orderToDelete.status === 'Entregado';
    const confirmMsg = isFinished
      ? '¿Estás seguro de que deseas eliminar este pedido finalizado?'
      : '¿Estás seguro de que deseas eliminar este pedido? (Se devolverá el stock al inventario)';

    if (window.confirm(confirmMsg)) {
      setOrders((prev) => prev.filter((order) => order.id !== id));

      if (isFinished) {
        setTransactions((prev) => prev.filter((tx) => tx.orderId !== id));
      }

      if (!isFinished && orderToDelete.status !== 'Cancelado') {
        let updatedProducts = [...products];

        const orderHistoryEntries = (stockHistory || []).filter((h) => h.orderId === id && h.type === 'Salida');
        orderHistoryEntries.forEach((record) => {
          updatedProducts = updatedProducts.map((p) => {
            if (p.name === record.productName) {
              const restoredStock = p.stock + record.quantity;
              return {
                ...p,
                stock: restoredStock,
                status: restoredStock > 10 ? 'En Stock' : restoredStock > 0 ? 'Bajo Stock' : 'Sin Stock',
              };
            }
            return p;
          });
        });

        setProducts(updatedProducts);
        setStockHistory((stockHistory || []).filter((h) => !(h.orderId === id && h.type === 'Salida')));
        setToBuy((prev) => prev.filter((item) => item.orderId !== id));
      }

      const relatedTransactions = transactions.filter((t) => t.orderId === id && t.type?.toLowerCase() === 'ingreso');
      if (relatedTransactions.length > 0) {
        setTransactions((prev) => prev.filter((t) => !(t.orderId === id && t.type?.toLowerCase() === 'ingreso')));
        addToast('Pedido y sus ingresos asociados eliminados correctamente.', 'info');
      } else {
        addToast('Pedido eliminado correctamente.', 'info');
      }
    }
  };

  const expiringOrders = orders.filter((order) => {
    if (order.status !== 'Pendiente') return false;
    if (!order.deliveryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inTwoDays = new Date(today);
    inTwoDays.setDate(today.getDate() + 2);
    const delivery = new Date(order.deliveryDate);
    return delivery >= today && delivery <= inTwoDays;
  });

  const renderOrderForm = () => {
    let suggestedPrice = 0;
    if (!editingOrderId && !isNewProduct && formData.productId) {
      const selectedP = products.find((p) => p.id === formData.productId);
      if (selectedP) {
        suggestedPrice = (selectedP.price || 0) * (parseInt(formData.quantity) || 0);
      }
    }

    const sortedCustomers = [...customers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const sortedProducts = [...products].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return (
      <div style={MODAL_OVERLAY_STYLE} onClick={handleCancelForm}>
        <div style={modalContentStyle('550px')} onClick={(e) => e.stopPropagation()}>
          <ModalHeader
            icon={ShoppingBag}
            title={editingOrderId ? 'Editar Pedido' : 'Registrar Nuevo Pedido'}
            subtitle="Configura los detalles del trabajo"
            onClose={handleCancelForm}
          />

          <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={MODAL_GROUP}>
              <label style={MODAL_LABEL}>
                <User size={14} /> Cliente
              </label>
              <select
                style={MODAL_INPUT}
                required
                value={isNewCustomer ? 'new' : formData.customerId}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setIsNewCustomer(true);
                    setFormData({ ...formData, customerId: '' });
                  } else {
                    setIsNewCustomer(false);
                    setFormData({ ...formData, customerId: e.target.value });
                  }
                }}
              >
                <option value="">Seleccionar Cliente...</option>
                {sortedCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="new">+ Crear Nuevo Cliente</option>
              </select>
            </div>

            {isNewCustomer && (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  marginBottom: '16px',
                }}
              >
                <div style={MODAL_GROUP}>
                  <label style={MODAL_LABEL}>
                    <User size={14} /> Nombre del Nuevo Cliente
                  </label>
                  <input
                    style={MODAL_INPUT}
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={formData.newName}
                    onChange={(e) => setFormData({ ...formData, newName: e.target.value })}
                  />
                </div>
                <div style={MODAL_GROUP}>
                  <label style={MODAL_LABEL}>
                    <Phone size={14} /> Teléfono
                  </label>
                  <input
                    style={MODAL_INPUT}
                    type="tel"
                    placeholder="+58 ..."
                    value={formData.newPhone}
                    onChange={(e) => setFormData({ ...formData, newPhone: e.target.value })}
                  />
                </div>
                <div style={MODAL_GROUP}>
                  <label style={MODAL_LABEL}>
                    <Mail size={14} /> Correo
                  </label>
                  <input
                    style={MODAL_INPUT}
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.newEmail}
                    onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div style={MODAL_GROUP}>
              <label style={MODAL_LABEL}>
                <Package size={14} /> Producto
              </label>
              <select
                style={MODAL_INPUT}
                required
                value={isNewProduct ? 'new_product' : formData.productId}
                onChange={(e) => {
                  if (e.target.value === 'new_product') {
                    setIsNewProduct(true);
                    setFormData({ ...formData, productId: '' });
                  } else {
                    const pId = e.target.value;
                    setIsNewProduct(false);
                    setFormData({ ...formData, productId: pId });
                  }
                }}
              >
                <option value="">Seleccionar Producto...</option>
                {sortedProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
                <option value="new_product">+ Producto Nuevo / Sin Stock</option>
              </select>
            </div>

            {isNewProduct && (
              <div style={MODAL_GROUP}>
                <label style={MODAL_LABEL}>
                  <Package size={14} /> Nombre del Nuevo Producto
                </label>
                <input
                  style={MODAL_INPUT}
                  type="text"
                  required
                  placeholder="Nombre del producto..."
                  value={formData.newProductName}
                  onChange={(e) => setFormData({ ...formData, newProductName: e.target.value })}
                />
              </div>
            )}

            <div style={MODAL_GROUP}>
              <label style={MODAL_LABEL}>
                <Calendar size={14} /> Fecha Entrega
              </label>
              <input
                style={MODAL_INPUT}
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              />
            </div>

            <div style={MODAL_GROUP}>
              <label style={MODAL_LABEL}>
                <Hash size={14} /> Cantidad
              </label>
              <input
                style={MODAL_INPUT}
                type="number"
                min="1"
                required
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div style={MODAL_GROUP}>
              <label style={MODAL_LABEL}>
                <FileText size={14} /> Detalles / Descripción
              </label>
              <input
                style={MODAL_INPUT}
                type="text"
                placeholder="Ej: Sublimación de logo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={MODAL_GROUP}>
              <label style={MODAL_LABEL}>
                <Banknote size={14} /> Precio Total ($)
              </label>
              <input
                style={MODAL_INPUT}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              {suggestedPrice > 0 && (
                <small style={{ color: 'var(--primary)', marginTop: '4px', fontSize: '0.75rem' }}>
                  Costo base Sugerido: ${formatUSD(suggestedPrice)}
                </small>
              )}
            </div>

            {!editingOrderId && (
              <>
                <div style={MODAL_GROUP}>
                  <label style={MODAL_LABEL}>
                    <Banknote size={14} /> Abono Inicial ($)
                  </label>
                  <input
                    style={MODAL_INPUT}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  />
                </div>
                <div style={MODAL_GROUP}>
                  <label style={MODAL_LABEL}>
                    <CreditCard size={14} /> Método de Pago (Abono)
                  </label>
                  <select
                    style={MODAL_INPUT}
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="EFECTIVO BCV">EFECTIVO BCV</option>
                    <option value="TRANSFERENCIA BCV">TRANSFERENCIA BCV</option>
                    <option value="USD">USD</option>
                    <option value="USDT">USDT</option>
                    <option value="ZINLI">ZINLI</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" style={MODAL_BTN_PRIMARY} disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : editingOrderId ? 'Guardar Cambios' : 'Confirmar Pedido'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="orders animate-fade-in">
      {expiringOrders.length > 0 && (
        <div className="alert-banner glass">
          <AlertTriangle size={24} color="#f59e0b" />
          <div>
            <h4>¡Atención! Pedidos por vencer</h4>
            <p>Tienes {expiringOrders.length} pedido(s) que deben entregarse pronto.</p>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="header-title-area">
          <div>
            <h2>Gestión de Pedidos</h2>
            <p>Seguimiento y registro de trabajos de personalización</p>
          </div>
        </div>
        <button
          className="add-order-btn"
          onClick={() => {
            if (editingOrderId) {
              handleCancelForm();
            } else {
              const nextShow = !showForm;
              setShowForm(nextShow);
              if (nextShow) window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          {showForm && !editingOrderId ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm && !editingOrderId ? 'Cancelar' : 'Nuevo Pedido'}</span>
        </button>
      </div>

      <div className="orders-tabs">
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={18} /> En Curso ({pendingOrders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'finished' ? 'active' : ''}`}
          onClick={() => setActiveTab('finished')}
        >
          <CheckCircle size={18} /> Finalizados ({finishedOrders.length})
        </button>
      </div>

      {showForm && !editingOrderId && renderOrderForm()}

      <div className="orders-list">
        {(activeTab === 'pending' ? pendingOrders : finishedOrders)
          .sort((a, b) => {
            if (activeTab === 'pending') {
              const dateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 9999999999999;
              const dateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 9999999999999;
              return dateA - dateB;
            } else {
              const dateA = new Date(a.date || a.deliveryDate || 0).getTime();
              const dateB = new Date(b.date || b.deliveryDate || 0).getTime();
              return dateB - dateA;
            }
          })
          .map((order) =>
            editingOrderId === order.id ? (
              <div key={order.id} className="inline-form-wrapper glass animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                {renderOrderForm()}
              </div>
            ) : (
              <OrderItem
                key={order.id}
                order={order}
                handleDeleteOrder={handleDeleteOrder}
                handleStatusChange={handleStatusChange}
                handleEditClick={handleEditClick}
                handleDeletePayment={handleDeletePayment}
                formatUSD={formatUSD}
                getStatusIcon={getStatusIcon}
                handleAddPayment={handleAddPayment}
              />
            )
          )}
      </div>
    </div>
  );
};

interface OrderItemProps {
  order: Order;
  handleDeleteOrder: (id: string) => void;
  handleStatusChange: (id: string, newStatus: string) => void;
  handleEditClick: (order: Order) => void;
  handleDeletePayment: (orderId: string, paymentId: number | string, transactionId?: string | number | null) => void;
  formatUSD: (val: number) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  handleAddPayment: (orderId: string, amount: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({
  order,
  handleDeleteOrder,
  handleStatusChange,
  handleEditClick,
  formatUSD,
  getStatusIcon,
  handleAddPayment,
  handleDeletePayment,
}) => {
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const totalPaid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const balance = order.total - totalPaid;
  const isFullyPaid = balance <= 0;

  return (
    <div className="order-item glass">
      <div className="order-main">
        <div className="order-icon-wrapper">
          <ShoppingBag size={24} />
        </div>
        <div className="order-info">
          <div className="id-badge">{order.id}</div>
          <h3>{order.customer}</h3>
          <p className="order-product">
            <strong>Producto:</strong> {order.productName}
          </p>
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

        <div className="payment-status-area">
          <div className="payment-row">
            <span className="label">Abonado:</span>
            <span className="val" style={{ color: 'var(--accent)' }}>
              ${formatUSD(totalPaid)}
            </span>
          </div>
          <div className="payment-row">
            <span className="label">Pendiente:</span>
            <span className="val" style={{ color: isFullyPaid ? '#10b981' : '#f59e0b' }}>
              {isFullyPaid ? '¡Pagado!' : `$${formatUSD(balance)}`}
            </span>
          </div>

          <div className="payment-actions">
            {!isFullyPaid && !showPaymentInput && (
              <button className="payment-link" onClick={() => setShowPaymentInput(true)}>
                + Registrar Abono
              </button>
            )}

            {(order.payments || []).length > 0 && (
              <button className="payment-link secondary" onClick={() => setShowPaymentHistory(!showPaymentHistory)}>
                {showPaymentHistory ? 'Ocultar Historial' : 'Ver Detalles'}
              </button>
            )}
          </div>

          {showPaymentHistory && (
            <div className="payment-history-list">
              {(order.payments || []).map((p) => (
                <div key={p.id} className="payment-history-item">
                  <span>
                    {new Date(p.date).toLocaleDateString()} - {p.notes}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>${formatUSD(p.amount)}</span>
                    <button
                      className="payment-del-btn"
                      onClick={() => handleDeletePayment(order.id, p.id, p.transactionId)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showPaymentInput && (
            <div className="quick-payment-area">
              <input
                type="number"
                autoFocus
                placeholder="Monto..."
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPayment(order.id, paymentAmount);
                    setPaymentAmount('');
                    setShowPaymentInput(false);
                  }
                }}
              />
              <button
                className="quick-payment-btn"
                onClick={() => {
                  handleAddPayment(order.id, paymentAmount);
                  setPaymentAmount('');
                  setShowPaymentInput(false);
                }}
              >
                {' '}
                OK{' '}
              </button>
              <button
                className="payment-del-btn"
                onClick={() => setShowPaymentInput(false)}
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className={`order-status ${(order.status || 'Pendiente').toLowerCase()}`}>
          {getStatusIcon(order.status || 'Pendiente')}
          <span>{order.status || 'Pendiente'}</span>
        </div>
        <div className="order-actions">
          {order.status !== 'Entregado' && (
            <>
              <button
                className="finish-btn"
                onClick={() => handleStatusChange(order.id, 'Entregado')}
                title="Finalizar"
              >
                <CheckCircle size={18} />
              </button>
              <button className="edit-btn" onClick={() => handleEditClick(order)} title="Editar">
                <Edit2 size={18} />
              </button>
            </>
          )}
          <button className="delete-btn" onClick={() => handleDeleteOrder(order.id)} title="Eliminar">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Orders;
