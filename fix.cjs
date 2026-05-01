const fs = require('fs');
const dbPath = 'server/db.json';
const data = JSON.parse(fs.readFileSync(dbPath));

let newTransactions = [];

data.stockHistory.forEach(record => {
  if (record.type === 'Entrada') {
    const product = data.products.find(p => p.name.trim().toLowerCase() === record.productName.trim().toLowerCase());
    if (product && product.price > 0) {
      newTransactions.push({
        id: record.id + 1,
        date: record.date,
        amount: record.quantity * product.price,
        type: 'Egreso',
        category: 'Inventario/Materia Prima',
        description: `Historial: ${record.notes} (${record.quantity} unds de ${record.productName})`,
        orderId: record.orderId !== 'N/A' ? record.orderId : null
      });
    }
  }
});

data.orders.forEach(order => {
  if (order.payments && order.payments.length > 0) {
    order.payments.forEach(payment => {
      newTransactions.push({
        id: payment.id + 1,
        date: payment.date,
        amount: payment.amount,
        type: 'Ingreso',
        category: 'Venta/Pedido',
        description: `Historial: Abono de pedido ${order.id} - ${order.customer}`,
        orderId: order.id
      });
    });
  } else if (order.status === 'Entregado') {
    newTransactions.push({
      id: Date.now() + Math.random(),
      date: order.deliveryDate ? new Date(order.deliveryDate).toISOString() : order.date,
      amount: order.total,
      type: 'Ingreso',
      category: 'Venta/Pedido',
      description: `Historial: Pago total pedido antiguo ${order.id} - ${order.customer}`,
      orderId: order.id
    });
  }
});

newTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
data.transactions = newTransactions;

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
console.log('Transacciones recalculadas: ' + newTransactions.length);
