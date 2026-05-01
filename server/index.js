const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Helper to read/write DB
const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const initialDB = { 
      users: [
        { id: 1, email: 'admin@apolosublix.com', password: adminPassword, name: 'Administrador' }
      ], 
      products: [], 
      orders: [], 
      transactions: [], 
      customers: [],
      toBuy: [],
      toBuyHistory: [],
      stockHistory: [],
      lastSync: 0
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  // Ensure new fields exist for old databases
  if (!db.toBuy) db.toBuy = [];
  if (!db.toBuyHistory) db.toBuyHistory = [];
  if (!db.stockHistory) db.stockHistory = [];
  return db;
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const db = readDB();
    
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), email, password: hashedPassword, name };
    
    db.users.push(newUser);
    writeDB(db);

    res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === identifier || u.name.toLowerCase() === identifier.toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, username: user.username || 'admin', role: user.role || 'Administrador' } });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/update', async (req, res) => {
  try {
    const { id, email, password, name, username } = req.body;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === id || u.email === email);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (name) db.users[userIndex].name = name;
    if (email) db.users[userIndex].email = email;
    if (username) db.users[userIndex].username = username;
    
    if (password) {
      db.users[userIndex].password = await bcrypt.hash(password, 10);
    }

    writeDB(db);
    res.json({ message: 'Perfil actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

// --- DATA ROUTES (Protected in real apps, simplified here) ---

app.get('/api/data', (req, res) => {
  res.json(readDB());
});

app.post('/api/data/sync', (req, res) => {
  const { products, orders, transactions, customers, toBuy, toBuyHistory, stockHistory, timestamp } = req.body;
  const db = readDB();

  if (timestamp && db.lastSync && timestamp < db.lastSync) {
    return res.status(400).json({ message: 'Outdated sync ignored' });
  }

  db.products = products || [];
  db.orders = orders || [];
  db.transactions = transactions || [];
  db.customers = customers || [];
  db.toBuy = toBuy || [];
  db.toBuyHistory = toBuyHistory || [];
  db.stockHistory = stockHistory || [];
  db.lastSync = timestamp || Date.now();
  
  writeDB(db);
  res.json({ message: 'Datos sincronizados' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Apolo Sublix corriendo en http://0.0.0.0:${PORT}`);
});
