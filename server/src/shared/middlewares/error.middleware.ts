import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error(`[CRITICAL ERROR] ${err.message}`, err.stack);
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  logger.error(`[UNHANDLED ERROR] ${err.message}`, err.stack);

  res.status(500).json({
    success: false,
    message: 'Ha ocurrido un error interno en el servidor',
    error: env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
