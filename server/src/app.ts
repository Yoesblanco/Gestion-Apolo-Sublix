import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { apiLimiter } from './shared/middlewares/rate-limiter';
import { pool } from './config/database';
import { errorHandler } from './shared/middlewares/error.middleware';

// Modular Route Handlers
import { authRouter } from './modules/auth/presentation/auth.routes';
import { productRouter } from './modules/products/presentation/product.routes';
import { customerRouter } from './modules/customers/presentation/customer.routes';
import { orderRouter } from './modules/orders/presentation/order.routes';
import { transactionRouter } from './modules/transactions/presentation/transaction.routes';
import { stockHistoryRouter } from './modules/inventory/presentation/stock-history.routes';
import { toBuyRouter } from './modules/to-buy/presentation/to-buy.routes';
import { syncRouter } from './modules/sync/presentation/sync.routes';
import { logsRouter } from './modules/logs/presentation/logs.routes';

export function createApp(): Express {
  const app = express();

  // Trust proxy para Render / Vercel
  app.set('trust proxy', 1);

  // CORS Configuration
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Peticiones sin origen (móviles, curl, server-to-server)
      if (!origin) return callback(null, true);

      const configured = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map((o) => o.trim()) : ['*'];
      if (
        configured.includes('*') ||
        configured.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Security Middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Pino HTTP Request/Response Logger
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customSuccessMessage: (req, res) => {
        return `[HTTP] ${req.method} ${req.url} -> ${res.statusCode}`;
      },
      customErrorMessage: (req, res, err) => {
        return `[HTTP ERROR] ${req.method} ${req.url} -> ${res.statusCode}: ${err.message}`;
      },
    })
  );

  // Global Rate Limiter
  app.use('/api/', apiLimiter);

  // Health check endpoint (pings DB to keep Supabase & Render active)
  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.status(200).json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({
        status: 'degraded',
        database: 'error',
        error: err?.message || 'Database ping failed',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // API Modules
  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/customers', customerRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/transactions', transactionRouter);
  app.use('/api/inventory', stockHistoryRouter);
  app.use('/api/to-buy', toBuyRouter);
  app.use('/api/data', syncRouter);
  app.use('/api/logs', logsRouter);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
