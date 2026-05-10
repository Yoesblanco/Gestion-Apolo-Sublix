const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan variables de entorno para Supabase en .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Verificar si existe
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { error } = await supabase.from('users').insert([{
      id: Date.now(),
      email,
      password: hashedPassword,
      name,
      role: 'Administrador'
    }]);

    if (error) throw error;
    res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error('Error register:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Buscar por email o nombre
    const { data: users, error } = await supabase.from('users').select('*')
      .or(`email.eq.${identifier},name.ilike.${identifier}`);
      
    if (error || !users || users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const user = users[0];
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username || 'admin', role: user.role || 'Administrador' } });
  } catch (error) {
    console.error('Error login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/update', async (req, res) => {
  try {
    const { id, email, password, name, username } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (username) updates.username = username;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const { error } = await supabase.from('users').update(updates).eq('id', id);

    if (error) throw error;
    res.json({ message: 'Perfil actualizado con éxito' });
  } catch (error) {
    console.error('Error update profile:', error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

// --- DATA ROUTES ---

// Obtener toda la base de datos (Formato Frontend)
app.get('/api/data', async (req, res) => {
  try {
    const [
      { data: products },
      { data: ordersRaw },
      { data: payments },
      { data: transactions },
      { data: customers },
      { data: toBuy },
      { data: stockHistory },
      { data: toBuyHistory }
    ] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('transactions').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('to_buy').select('*'),
      supabase.from('stock_history').select('*'),
      supabase.from('to_buy_history').select('*')
    ]);

    // Reconstruir pedidos con sus pagos para el frontend
    const orders = (ordersRaw || []).map(o => {
      const orderPayments = (payments || []).filter(p => p.order_id === o.id).map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.payment_date,
        method: p.method,
        notes: p.notes,
        transactionId: p.transaction_id
      }));

      return {
        id: o.id,
        customerId: o.customer_id,
        customer: o.customer_name,
        productName: o.product_name,
        date: o.order_date,
        deliveryDate: o.delivery_date,
        total: o.total,
        status: o.status,
        desc: o.description,
        quantity: o.quantity,
        pendingStockToSubtract: o.pending_stock_to_subtract,
        payments: orderPayments
      };
    });

    const dbFormat = {
      products: products || [],
      orders,
      transactions: (transactions || []).map(t => ({
        id: t.id, date: t.date, amount: t.amount, type: t.type,
        category: t.category, method: t.method, description: t.description, orderId: t.order_id
      })),
      customers: customers || [],
      toBuy: (toBuy || []).map(b => ({
        id: b.id, productName: b.product_name, quantity: b.quantity, notes: b.notes,
        orderDescription: b.order_description, status: b.status, dateAdded: b.date_added,
        orderId: b.order_id, customer: b.customer, productId: b.product_id
      })),
      stockHistory: (stockHistory || []).map(s => ({
        id: s.id, date: s.date, type: s.type, productName: s.product_name,
        customer: s.customer, quantity: s.quantity, orderId: s.order_id, notes: s.notes
      })),
      toBuyHistory: (toBuyHistory || []).map(h => ({
        id: h.id, productName: h.product_name, quantity: h.quantity, notes: h.notes,
        orderDescription: h.order_description, status: h.status, dateAdded: h.date_added,
        orderId: h.order_id, customer: h.customer, dateBought: h.date_bought,
        purchasePrice: h.purchase_price, productId: h.product_id, transactionId: h.transaction_id
      })),
      lastSync: Date.now()
    };

    res.json(dbFormat);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Error fetching database' });
  }
});

// Sincronizar hacia Supabase
app.post('/api/data/sync', async (req, res) => {
  try {
    const data = req.body;
    
    // Aquí hacemos Upsert a todas las tablas para guardar el estado del frontend
    if (data.products) {
      const productIds = data.products.map(p => p.id);
      await supabase.from('products').delete().not('id', 'in', productIds);
      if (data.products.length > 0) {
        await supabase.from('products').upsert(data.products);
      }
    }
    
    if (data.customers) {
      const customerIds = data.customers.map(c => c.id);
      await supabase.from('customers').delete().not('id', 'in', customerIds);
      if (data.customers.length > 0) {
        await supabase.from('customers').upsert(data.customers);
      }
    }

    if (data.orders && data.orders.length > 0) {
      const payments = [];
      const orders = data.orders.map(o => {
        const { payments: orderPayments, ...orderData } = o;
        if (orderPayments) {
          orderPayments.forEach(p => {
            payments.push({
              id: Math.round(Number(p.id)),
              order_id: o.id,
              amount: p.amount,
              payment_date: p.date,
              method: p.method,
              notes: p.notes,
              transaction_id: p.transactionId ? Math.round(Number(p.transactionId)) : null
            });
          });
        }
        return {
          id: orderData.id,
          customer_id: orderData.customerId,
          customer_name: orderData.customer,
          product_name: orderData.productName,
          order_date: orderData.date,
          delivery_date: orderData.deliveryDate,
          total: orderData.total,
          status: orderData.status,
          description: orderData.desc,
          quantity: orderData.quantity,
          pending_stock_to_subtract: orderData.pendingStockToSubtract
        };
      });

      const orderIds = data.orders.map(o => o.id);
      await supabase.from('orders').delete().not('id', 'in', orderIds);
      
      if (orders.length > 0) {
        await supabase.from('orders').upsert(orders);
        
        if (payments.length > 0) {
          // Nota: Para pagos es más complejo porque el ID es autogenerado o manejado por el frontend
          // Por ahora hacemos upsert para mantener integridad
          await supabase.from('payments').upsert(payments, { onConflict: 'id' });
        }
      }
    }

    if (data.transactions) {
      const txIds = data.transactions.map(t => t.id);
      // Eliminar los que ya no están en la lista
      await supabase.from('transactions').delete().not('id', 'in', txIds);
      
      if (data.transactions.length > 0) {
        const txs = data.transactions.map(t => ({
          id: t.id, date: t.date, amount: t.amount, type: t.type,
          category: t.category, method: t.method, description: t.description, order_id: t.orderId
        }));
        await supabase.from('transactions').upsert(txs);
      }
    }

    if (data.stockHistory && data.stockHistory.length > 0) {
      const stock = data.stockHistory.map(s => ({
        id: s.id, date: s.date, type: s.type, product_name: s.productName,
        customer: s.customer, quantity: s.quantity, order_id: s.orderId, notes: s.notes
      }));
      await supabase.from('stock_history').upsert(stock);
    }

    if (data.toBuy && data.toBuy.length > 0) {
      const toBuy = data.toBuy.map(b => ({
        id: b.id, product_name: b.productName, quantity: b.quantity, notes: b.notes,
        order_description: b.orderDescription, status: b.status, date_added: b.dateAdded,
        order_id: b.orderId, customer: b.customer, product_id: b.productId
      }));
      await supabase.from('to_buy').upsert(toBuy);
    }

    if (data.toBuyHistory && data.toBuyHistory.length > 0) {
      const toBuyHistory = data.toBuyHistory.map(h => ({
        id: h.id, product_name: h.productName, quantity: h.quantity, notes: h.notes,
        order_description: h.orderDescription, status: h.status, date_added: h.dateAdded,
        order_id: h.orderId, customer: h.customer, date_bought: h.dateBought,
        purchase_price: h.purchasePrice, product_id: h.productId, transaction_id: h.transactionId
      }));
      await supabase.from('to_buy_history').upsert(toBuyHistory);
    }

    res.json({ message: 'Datos sincronizados a Supabase con éxito' });
  } catch (error) {
    console.error('Error syncing to Supabase:', error);
    res.status(500).json({ message: 'Error syncing database' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Apolo Sublix corriendo con SUPABASE en http://0.0.0.0:${PORT}`);
});
