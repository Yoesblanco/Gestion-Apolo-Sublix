import { useState } from 'react';
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
  Maximize2,
  CreditCard
} from 'lucide-react';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const {
    orders, setOrders,
    products, setProducts,
    customers, setCustomers,
    transactions, setTransactions,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    newProductName: '',
    deposit: '',
    paymentMethod: 'EFECTIVO BCV'
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

    // Función para asegurar formato YYYY-MM-DD que el navegador entienda
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      try {
        // Extraemos solo la parte YYYY-MM-DD
        return new Date(dateStr).toISOString().split('T')[0];
      } catch (e) {
        return '';
      }
    };

    setFormData({
      customerId: customer ? customer.id.toString() : '',
      productId: product ? product.id.toString() : (order.productId ? order.productId.toString() : ''),
      description: order.desc || '',
      emissionDate: formatDateForInput(order.date),
      deliveryDate: formatDateForInput(order.deliveryDate),
      quantity: order.quantity ? order.quantity.toString() : '',
      price: order.total ? order.total.toString() : '',
      newName: '',
      newPhone: '',
      newEmail: '',
      newProductName: product ? '' : order.productName,
      deposit: '',
      paymentMethod: 'EFECTIVO BCV'
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
      paymentMethod: 'EFECTIVO BCV'
    });
  };

  const handleSubmitOrder = async (e) => {
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

      const depositAmount = parseFloat(formData.deposit || 0);
      const totalPrice = parseFloat(formData.price || 0);

      if (depositAmount > totalPrice) {
        addToast('El abono inicial no puede ser mayor al precio total.', 'error');
        setIsSubmitting(false);
        return;
      }

      let updatedProducts = [...products];
      let updatedStockHistory = [...(stockHistory || [])];
      let updatedToBuy = [...toBuy];

      // IF EDITING: First revert previous stock impact locally
      if (editingOrderId) {
        const oldOrder = orders.find(o => o.id === editingOrderId);
        if (oldOrder && oldOrder.status !== 'Entregado') {
          // 1. Revertir stock que se restó del disponible al inicio
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

          // 2. Revertir stock que estaba "Apartado" (reserved)
          if (oldOrder.pendingStockToSubtract > 0) {
            updatedProducts = updatedProducts.map(p => {
              if (p.name === oldOrder.productName) {
                const qtyToMove = Math.min(p.reserved || 0, oldOrder.pendingStockToSubtract);
                const newReserved = (p.reserved || 0) - qtyToMove;
                const newStock = p.stock + qtyToMove;
                return {
                  ...p,
                  reserved: newReserved,
                  stock: newStock,
                  status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock'
                };
              }
              return p;
            });
          }

          updatedStockHistory = updatedStockHistory.filter(h => h.orderId !== editingOrderId);
          // Limpiar cualquier rastro del pedido en la lista de compras antes de re-procesar
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
        setCustomers(prev => [newCustomer, ...prev]);
        customerName = formData.newName;
        customerId = newId;
      } else {
        const selectedCustomer = customers.find(c => c.id === parseInt(formData.customerId));
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
        updatedToBuy = [{
          id: Date.now(),
          productName: finalProductName,
          quantity: requiredQuantity,
          notes: `Requerido para pedido de ${customerName} (${orderId})`,
          orderDescription: formData.description,
          status: 'Pendiente',
          dateAdded: new Date().toISOString(),
          orderId: orderId,
          customer: customerName
        }, ...updatedToBuy];
      } else {
        const selectedProduct = updatedProducts.find(p => p.id === parseInt(formData.productId));
        if (!selectedProduct) {
          setIsSubmitting(false);
          return;
        }
        finalProductName = selectedProduct.name;

        let newStock = selectedProduct.stock - requiredQuantity;

        if (newStock < 0) {
          missingAmount = Math.abs(newStock);
          newStock = 0;
          updatedToBuy = [{
            id: Date.now(),
            productId: selectedProduct.id, // VÍNCULO POR ID (INFALIBLE)
            productName: selectedProduct.name,
            quantity: missingAmount,
            notes: `Faltante para pedido de ${customerName} (${orderId})`,
            orderDescription: formData.description,
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


      const txId = Date.now() + 1;
      const payments = depositAmount > 0 ? [{
        id: Date.now(),
        amount: depositAmount,
        date: new Date().toISOString(),
        method: formData.paymentMethod || 'EFECTIVO BCV',
        notes: 'Abono inicial',
        transactionId: txId
      }] : [];

      let oldOrder = null;
      if (editingOrderId) {
        oldOrder = orders.find(o => o.id === editingOrderId);
      }

      const newOrderData = {
        id: orderId,
        customerId: customerId,
        customer: customerName,
        productName: finalProductName,
        date: formData.emissionDate,
        deliveryDate: formData.deliveryDate,
        total: parseFloat(formData.price || 0),
        status: oldOrder ? oldOrder.status : 'Pendiente',
        desc: formData.description,
        quantity: requiredQuantity,
        pendingStockToSubtract: isNewProduct ? requiredQuantity : missingAmount,
        payments: oldOrder ? (oldOrder.payments || []) : payments
      };

      setProducts(updatedProducts);
      setStockHistory(updatedStockHistory);

      // Si estamos editando un pedido FINALIZADO, actualizar la transacción en Ventas
      if (editingOrderId && oldOrder && oldOrder.status === 'Entregado') {
        setTransactions(prev => prev.map(t => {
          if (t.orderId === editingOrderId) {
            return {
              ...t,
              amount: parseFloat(formData.price || 0), // Actualizar al nuevo precio
              description: `Venta finalizada pedido ${editingOrderId} - ${customerName}` // Actualizar nombre si cambió
            };
          }
          return t;
        }));
      }

      // Eliminamos la creación de la transacción global aquí.
      // El abono se queda guardado en la variable 'payments' dentro del objeto 'newOrderData'
      // pero no se enviará a setTransactions hasta que el pedido pase a 'Entregado'.

      // Actualizar la lista de compras asegurando que no haya duplicados para este pedido
      setToBuy(prev => {
        const cleanList = prev.filter(item => item.orderId !== orderId);
        return [...updatedToBuy.filter(item => item.orderId === orderId), ...cleanList];
      });

      if (editingOrderId) {
        setOrders(prev => prev.map(o => o.id === editingOrderId ? newOrderData : o));
      } else {
        setOrders(prev => [newOrderData, ...prev]);
      }

      handleCancelForm();
      setIsSubmitting(false);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      addToast('Error crítico detectado: ' + error.message, 'error');
    }
  };

  const handleStatusChange = (id, newStatus) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (newStatus === 'Entregado') {
      // 1. CONFIRMACIÓN FINAL DEL MONTO
      const confirmSale = window.confirm(`¿Estás seguro de entregar este pedido? \n\nSe registrará una venta final por: $${formatUSD(order.total)}`);
      if (!confirmSale) return; // Si cancela, no hacemos nada.

      if (order.pendingStockToSubtract > 0) {
        const updatedProducts = products.map(p => {
          if (p.name === order.productName) {
            // Descontamos de los "Apartados" (reserved)
            const newReserved = Math.max(0, (p.reserved || 0) - order.pendingStockToSubtract);
            return {
              ...p,
              reserved: newReserved
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

      // 3. REGISTRAR VENTA TOTAL EN EL ÁREA DE VENTAS (Solo al finalizar)
      if (order) {
        const finalSaleTransaction = {
          id: `TX-FINAL-${Date.now()}`,
          date: new Date().toISOString(),
          amount: order.total, // Sumamos el TOTAL del pedido de una vez
          type: 'Ingreso',
          category: 'Venta/Pedido',
          description: `Venta finalizada pedido ${order.id} - ${order.customer}`,
          orderId: order.id
        };
        setTransactions(prev => [finalSaleTransaction, ...prev]);

        // Actualizar el pedido para marcarlo como pagado totalmente (por si faltaba algo)
        setOrders(orders.map(o => {
          if (o.id === id) {
            const currentPaid = (o.payments || []).reduce((acc, p) => acc + p.amount, 0);
            const balance = o.total - currentPaid;
            let updatedPayments = o.payments || [];
            if (balance > 0) {
              updatedPayments = [...updatedPayments, {
                id: Date.now(),
                amount: balance,
                date: new Date().toISOString(),
                method: 'Efectivo',
                notes: 'Saldo automático al entregar'
              }];
            }
            return { ...o, status: newStatus, pendingStockToSubtract: 0, payments: updatedPayments };
          }
          return o;
        }));
      }

      fireConfetti();
      addToast(`¡Pedido entregado! Venta de $${order ? order.total : 0} registrada en Finanzas.`, 'success');
    } else if (newStatus === 'Cancelado') {
      if (order) {
        let updatedProducts = [...products];

        // 1. Devolver stock que se restó al inicio (Disponible)
        const orderHistoryEntries = (stockHistory || []).filter(h => h.orderId === id && h.type === 'Salida');
        orderHistoryEntries.forEach(record => {
          updatedProducts = updatedProducts.map(p => {
            // Usamos productId si existe, si no, fallback a nombre (para pedidos viejos)
            const isMatch = p.id === order.productId || p.name === record.productName;
            if (isMatch) {
              const restoredStock = p.stock + record.quantity;
              return { ...p, stock: restoredStock, status: restoredStock > 10 ? 'En Stock' : restoredStock > 0 ? 'Bajo Stock' : 'Sin Stock' };
            }
            return p;
          });
        });

        // 2. Liberar stock que se compró y estaba "Apartado" (Reserved)
        // Si el pedido tiene 'pendingStockToSubtract' > 0, significa que hay stock en 'Reserved' esperando
        if (order.pendingStockToSubtract > 0) {
          updatedProducts = updatedProducts.map(p => {
            const isMatch = p.id === order.productId || p.name === order.productName;
            if (isMatch) {
              const qtyToMove = Math.min(p.reserved || 0, order.pendingStockToSubtract);
              const newReserved = (p.reserved || 0) - qtyToMove;
              const newStock = p.stock + qtyToMove; // Mover de Apartado a Disponible
              return {
                ...p,
                reserved: newReserved,
                stock: newStock,
                status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock'
              };
            }
            return p;
          });
        }

        setProducts(updatedProducts);
        // Limpiar el historial de salida de este pedido ya que no ocurrió
        setStockHistory((stockHistory || []).filter(h => !(h.orderId === id && h.type === 'Salida')));
        // Eliminar de la lista de compras si aún estaba allí
        setToBuy(toBuy.filter(item => item.orderId !== id));
      }

      setOrders(prev => prev.map(o =>
        o.id === id ? { ...o, status: newStatus, pendingStockToSubtract: 0 } : o
      ));
      addToast(`Pedido cancelado. El stock (incluyendo lo apartado) ha vuelto al inventario disponible.`, 'info');
    } else {
      setOrders(prev => prev.map(order =>
        order.id === id ? { ...order, status: newStatus } : order
      ));
      addToast(`Estado del pedido actualizado a ${newStatus}.`, 'info');
    }
  };

  const handleAddPayment = (orderId, amount) => {
    const paymentValue = parseFloat(amount);
    if (!paymentValue || paymentValue <= 0) return;

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const currentPaid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const balance = order.total - currentPaid;

    if (paymentValue > balance + 0.01) {
      addToast(`El monto ($${paymentValue}) no puede ser mayor al saldo pendiente ($${formatUSD(balance)}).`, 'error');
      return;
    }

    const txId = Date.now() + 1;
    const newPayment = {
      id: Date.now(),
      amount: paymentValue,
      date: new Date().toISOString(),
      method: 'Efectivo',
      notes: 'Abono adicional',
      transactionId: txId
    };

    const newTransaction = {
      id: txId,
      date: new Date().toISOString(),
      amount: paymentValue,
      type: 'Ingreso',
      category: 'Venta/Pedido',
      description: `Abono a pedido ${order.id} - ${order.customer}`,
      orderId: order.id
    };

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          payments: [...(o.payments || []), newPayment]
        };
      }
      return o;
    }));
    addToast(`Pago de $${amount} registrado internamente. Se sumará a Ventas al entregar el pedido.`, 'success');
  };

  const handleDeletePayment = (orderId, paymentId, transactionId) => {
    if (window.confirm('¿Deseas eliminar este pago? Se restará del total abonado y se eliminará el registro de venta.')) {
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            payments: (o.payments || []).filter(p => p.id !== paymentId)
          };
        }
        return o;
      }));

      if (transactionId) {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
      }
      addToast('Pago eliminado correctamente.', 'info');
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
      setOrders(prev => prev.filter(order => order.id !== id));

      // 1. Si el pedido estaba finalizado, borrar la venta del historial de finanzas
      if (isFinished) {
        setTransactions(prev => prev.filter(tx => tx.orderId === id ? false : true));
      }

      // 2. Si el pedido no estaba finalizado ni cancelado, devolver stock
      if (!isFinished && orderToDelete.status !== 'Cancelado') {
        let updatedProducts = [...products];

        // 1. Devolver stock que se restó al inicio
        const orderHistoryEntries = (stockHistory || []).filter(h => h.orderId === id && h.type === 'Salida');
        orderHistoryEntries.forEach(record => {
          updatedProducts = updatedProducts.map(p => {
            if (p.name === record.productName) {
              const restoredStock = p.stock + record.quantity;
              return { ...p, stock: restoredStock, status: restoredStock > 10 ? 'En Stock' : restoredStock > 0 ? 'Bajo Stock' : 'Sin Stock' };
            }
            return p;
          });
        });

        // 2. Liberar stock que estaba "Apartado"
        if (orderToDelete.pendingStockToSubtract > 0) {
          updatedProducts = updatedProducts.map(p => {
            if (p.name === orderToDelete.productName) {
              const qtyToMove = Math.min(p.reserved || 0, orderToDelete.pendingStockToSubtract);
              const newReserved = (p.reserved || 0) - qtyToMove;
              const newStock = p.stock + qtyToMove;
              return {
                ...p,
                reserved: newReserved,
                stock: newStock,
                status: newStock > 10 ? 'En Stock' : newStock > 0 ? 'Bajo Stock' : 'Sin Stock'
              };
            }
            return p;
          });
        }

        setProducts(updatedProducts);
        setStockHistory((stockHistory || []).filter(h => !(h.orderId === id && h.type === 'Salida')));
        setToBuy(prev => prev.filter(item => item.orderId !== id));
      }

      // Eliminar transacciones (abonos) asociadas al pedido (Solo Ingresos)
      // Los Egresos (compras de material faltante) se mantienen porque el dinero ya se gastó y el stock regresó al inventario.
      const relatedTransactions = transactions.filter(t => t.orderId === id && t.type?.toLowerCase() === 'ingreso');
      if (relatedTransactions.length > 0) {
        setTransactions(prev => prev.filter(t => !(t.orderId === id && t.type?.toLowerCase() === 'ingreso')));
        addToast('Pedido y sus ingresos asociados eliminados correctamente.', 'info');
      } else {
        addToast('Pedido eliminado correctamente.', 'info');
      }
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

  const renderOrderForm = () => {
    // Calcular precio sugerido solo para mostrarlo, no para rellenar el input
    let suggestedPrice = 0;
    if (!editingOrderId && !isNewProduct && formData.productId) {
      const selectedP = products.find(p => p.id === parseInt(formData.productId));
      if (selectedP) {
        suggestedPrice = (selectedP.price || 0) * (parseInt(formData.quantity) || 0);
      }
    }

    const sortedCustomers = [...customers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const sortedProducts = [...products].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return (
      <div className="modal-overlay animate-fade-in">
        <div className="order-form-container glass modal-content">
          <div className="modal-header">
            <h3>{editingOrderId ? 'Editar Pedido' : 'Registrar Nuevo Pedido'}</h3>
            <button className="close-btn" onClick={handleCancelForm}>
              <X size={24} />
            </button>
          </div>
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
                {sortedCustomers.map(c => (
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
                    const pId = e.target.value;
                    setIsNewProduct(false);
                    setFormData({ ...formData, productId: pId });
                  }
                }}
              >
                <option value="">Seleccionar Producto...</option>
                {sortedProducts.map(p => (
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
              <div className="form-group full-width">
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
                min={new Date().toISOString().split('T')[0]} 
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label><Hash size={14} /> Cantidad</label>
              <input
                type="number"
                min="1"
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
              {suggestedPrice > 0 && (
                <small className="suggested-price-label">
                  Costo de Inventario: ${formatUSD(suggestedPrice)}
                </small>
              )}
            </div>
            {!editingOrderId && (
              <div className="form-group">
                <label><Banknote size={14} /> Abono Inicial ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                />
              </div>
            )}
            {!editingOrderId && (
              <div className="form-group">
                <label><CreditCard size={14} /> Método Abono</label>
                <select
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
            )}
          </div>

          <div className="form-actions-row">
            <button type="submit" className="submit-order-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : (editingOrderId ? 'Guardar Cambios' : 'Confirmar Pedido')}
            </button>
            <button type="button" className="cancel-inv-btn" onClick={handleCancelForm} disabled={isSubmitting}>
              Cancelar
            </button>
          </div>
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
            <p>
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
        <button className="add-order-btn" onClick={() => {
          if (editingOrderId) {
            handleCancelForm();
          } else {
            const nextShow = !showForm;
            setShowForm(nextShow);
            if (nextShow) window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}>
          {showForm && !editingOrderId ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm && !editingOrderId ? 'Cancelar' : 'Nuevo Pedido'}</span>
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

      {showForm && !editingOrderId && renderOrderForm()}

      <div className="orders-list">
        {(activeTab === 'pending' ? pendingOrders : finishedOrders)
          .sort((a, b) => {
            if (activeTab === 'pending') {
              // Validación de fechas de entrega
              const dateA = a.deliveryDate ? new Date(a.deliveryDate) : new Date('9999-12-31');
              const dateB = b.deliveryDate ? new Date(b.deliveryDate) : new Date('9999-12-31');

              // Si alguna fecha es inválida, la mandamos al final
              const valA = isNaN(dateA.getTime()) ? new Date('9999-12-31') : dateA;
              const valB = isNaN(dateB.getTime()) ? new Date('9999-12-31') : dateB;

              return valA - valB;
            } else {
              // Para finalizados, lo más reciente arriba (usando date o deliveryDate como fallback)
              const dateA = new Date(a.date || a.deliveryDate || 0);
              const dateB = new Date(b.date || b.deliveryDate || 0);
              return dateB - dateA;
            }
          })
          .map((order) => (
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
          ))}
      </div>
    </div>
  );
};

const OrderItem = ({ order, handleDeleteOrder, handleStatusChange, handleEditClick, formatUSD, getStatusIcon, handleAddPayment, handleDeletePayment }) => {
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const totalPaid = (order.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const balance = order.total - totalPaid;
  const isFullyPaid = balance <= 0;

  return (
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
          <div className="detail-item">
            <span className="label">Total</span>
            <span className="amount">${typeof order.total === 'number' ? formatUSD(order.total) : order.total}</span>
          </div>
        </div>

        <div className="payment-status-area">
          <div className="payment-row">
            <span className="label">Abonado:</span>
            <span className="val" style={{ color: 'var(--accent)' }}>${formatUSD(totalPaid)}</span>
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
                  <span>{new Date(p.date).toLocaleDateString()} - {p.notes}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>${formatUSD(p.amount)}</span>
                    <button className="payment-del-btn" onClick={() => handleDeletePayment(order.id, p.id, p.transactionId)}>
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
              <button className="quick-payment-btn" onClick={() => {
                handleAddPayment(order.id, paymentAmount);
                setPaymentAmount('');
                setShowPaymentInput(false);
              }}> OK </button>
              <button className="payment-del-btn" onClick={() => setShowPaymentInput(false)} style={{ color: 'var(--text-muted)' }}>
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
              <button className="finish-btn" onClick={() => handleStatusChange(order.id, 'Entregado')} title="Finalizar"><CheckCircle size={18} /></button>
              <button className="edit-btn" onClick={() => handleEditClick(order)} title="Editar"><Edit2 size={18} /></button>
            </>
          )}
          <button className="delete-btn" onClick={() => handleDeleteOrder(order.id)} title="Eliminar"><Trash2 size={18} /></button>
        </div>
      </div>
    </div>
  );
};

export default Orders;

