import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { apiLimiter } from './shared/middlewares/rate-limiter';
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

  // Security Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
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

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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
