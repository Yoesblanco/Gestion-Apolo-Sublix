import { createApp } from './app';
import { env } from './config/env';
import { pool } from './config/database';
import { runMigrations } from './db/migrate';
import { seedDatabase } from './db/seed';
import { logger } from './shared/utils/logger';

async function bootstrap() {
  try {
    // 1. Run database migrations / schema verification
    await runMigrations();

    // 2. Seed default admin & client users if needed
    await seedDatabase();

    // 3. Initialize Express application
    const app = createApp();

    // 3. Start HTTP server
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`🚀 Servidor Apolo Sublix TypeScript corriendo en http://0.0.0.0:${env.PORT}`);
      logger.info(`🌐 Modo: ${env.NODE_ENV}`);
    });

    // Graceful Shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info(`Recibida señal ${signal}. Cerrando servidor limpiamente...`);
      server.close(async () => {
        logger.info('Servidor HTTP cerrado.');
        await pool.end();
        logger.info('Pool de PostgreSQL cerrado.');
        process.exit(0);
      });

      // Force close if it takes too long
      setTimeout(() => {
        logger.error('Cierre forzado después del tiempo límite.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Error fatal al iniciar la aplicación:', error);
    process.exit(1);
  }
}

bootstrap();
