import { pool } from '../config/database';

export async function runMigrations() {
  console.log('🔄 Verificando y aplicando esquema de base de datos...');
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100),
        role VARCHAR(50) NOT NULL DEFAULT 'Administrador',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        stock INTEGER NOT NULL DEFAULT 0,
        price DOUBLE PRECISION NOT NULL DEFAULT 0,
        cost DOUBLE PRECISION DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        city VARCHAR(100),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(255),
        product_name VARCHAR(255),
        order_date VARCHAR(100),
        delivery_date VARCHAR(100),
        total DOUBLE PRECISION NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        pending_stock_to_subtract INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id BIGINT PRIMARY KEY,
        order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
        amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        payment_date VARCHAR(100),
        method VARCHAR(100),
        notes TEXT,
        transaction_id BIGINT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(64) PRIMARY KEY,
        date VARCHAR(100),
        amount DOUBLE PRECISION NOT NULL DEFAULT 0,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100),
        method VARCHAR(100),
        description TEXT,
        order_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS to_buy (
        id VARCHAR(64) PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        order_description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
        date_added VARCHAR(100),
        order_id VARCHAR(64),
        customer VARCHAR(255),
        product_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS to_buy_history (
        id VARCHAR(64) PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        order_description TEXT,
        status VARCHAR(50),
        date_added VARCHAR(100),
        order_id VARCHAR(64),
        customer VARCHAR(255),
        date_bought VARCHAR(100),
        purchase_price DOUBLE PRECISION DEFAULT 0,
        product_id VARCHAR(64),
        transaction_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS stock_history (
        id VARCHAR(64) PRIMARY KEY,
        date VARCHAR(100),
        type VARCHAR(50),
        product_name VARCHAR(255),
        customer VARCHAR(255),
        quantity INTEGER DEFAULT 0,
        order_id VARCHAR(64),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS meta (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Auto-reparación / Migración de columnas existentes
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Administrador';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DOUBLE PRECISION DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS pending_stock_to_subtract INTEGER DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id BIGINT;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS order_id VARCHAR(64);
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE to_buy ADD COLUMN IF NOT EXISTS customer VARCHAR(255);
      ALTER TABLE to_buy ADD COLUMN IF NOT EXISTS product_id VARCHAR(64);
      ALTER TABLE to_buy ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE to_buy_history ADD COLUMN IF NOT EXISTS purchase_price DOUBLE PRECISION DEFAULT 0;
      ALTER TABLE to_buy_history ADD COLUMN IF NOT EXISTS product_id VARCHAR(64);
      ALTER TABLE to_buy_history ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(64);
      ALTER TABLE to_buy_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE stock_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

      ALTER TABLE meta ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('✅ Esquema verificado y listo.');
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
