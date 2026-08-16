import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error(
        {
          err,
          path: req.originalUrl,
          method: req.method,
          params: req.params,
          query: req.query,
          body: req.body,
        },
        `[CRITICAL ERROR] ${err.message}`
      );
    } else {
      logger.warn(
        {
          statusCode: err.statusCode,
          message: err.message,
          path: req.originalUrl,
          method: req.method,
        },
        `[CLIENT ERROR] ${err.message}`
      );
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  logger.error(
    {
      err,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      params: req.params,
      query: req.query,
      body: req.body,
    },
    `[UNHANDLED ERROR] ${err.message}`
  );

  res.status(500).json({
    success: false,
    message: 'Ha ocurrido un error interno en el servidor',
    error: env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
