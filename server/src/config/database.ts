import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from './env';
import * as schema from '../db/schema';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' && !env.DATABASE_URL.includes('localhost') && !env.DATABASE_URL.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export const db = drizzle(pool, { schema });
