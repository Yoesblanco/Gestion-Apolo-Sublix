import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET debe tener al menos 8 caracteres').default('default_apolo_jwt_secret_key_2026_change_in_production'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error de validación en variables de entorno:', parsed.error.format());
  // In development, provide a fallback if DATABASE_URL is not set yet
  if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
    console.warn('⚠️ Usando DATABASE_URL por defecto para desarrollo local');
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/apolo_sublix';
  }
}

export const env = envSchema.parse(process.env);
