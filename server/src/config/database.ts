import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from './env';
import * as schema from '../db/schema';

const { Pool } = pg;

const resolveSSLConfig = () => {
  if (env.DATABASE_SSL === 'false' || process.env.DB_SSL === 'false') return false;
  if (env.DATABASE_SSL === 'true' || process.env.DB_SSL === 'true') return { rejectUnauthorized: false };

  const url = env.DATABASE_URL.toLowerCase();
  if (url.includes('sslmode=disable') || url.includes('ssl=false')) return false;
  if (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('@postgres:') ||
    url.includes('@postgres/') ||
    url.includes('@host.docker.internal')
  ) {
    return false;
  }

  if (url.includes('sslmode=require') || url.includes('ssl=true') || url.includes('supabase.co') || url.includes('render.com')) {
    return { rejectUnauthorized: false };
  }

  return env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
};

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: resolveSSLConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export const db = drizzle(pool, { schema });
