import { pool } from '../../config/database';
import { logger } from './logger';

/**
 * Servicio Keep-Alive para mantener encendidos Render y Supabase
 * Ejecuta una consulta a la BD y un self-ping HTTP cada 9 minutos.
 */
export function startKeepAlive() {
  const INTERVAL_MS = 9 * 60 * 1000; // 9 minutos
  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || process.env.VITE_API_BASE_URL;

  logger.info({ appUrl, intervalMinutes: 9 }, 'Iniciando servicio keep-alive interno...');

  const pingTask = async () => {
    // 1. Ping a Supabase (PostgreSQL)
    try {
      await pool.query('SELECT 1');
      logger.info('🟢 [Keep-Alive] Consulta a Supabase (SELECT 1) exitosa.');
    } catch (err: any) {
      logger.warn({ error: err?.message }, '🟡 [Keep-Alive] Error al consultar Supabase');
    }

    // 2. Self-ping a Render si existe URL pública
    if (appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
      const healthUrl = appUrl.endsWith('/health') ? appUrl : `${appUrl.replace(/\/$/, '')}/health`;
      try {
        const response = await fetch(healthUrl);
        logger.info(`🟢 [Keep-Alive] Self-ping a Render (${healthUrl}) completado con status: ${response.status}`);
      } catch (err: any) {
        logger.warn({ error: err?.message }, `🟡 [Keep-Alive] No se pudo hacer self-ping a ${healthUrl}`);
      }
    }
  };

  // Ejecutar el primer ciclo a los 2 minutos del arranque para no saturar el inicio
  const initialTimeout = setTimeout(() => {
    pingTask();
    // Y luego repetirlo cada 9 minutos de manera continua
    setInterval(pingTask, INTERVAL_MS);
  }, 2 * 60 * 1000);

  return () => clearTimeout(initialTimeout);
}
