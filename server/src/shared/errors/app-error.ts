export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message = 'No autorizado'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Acceso denegado'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = 'Recurso no encontrado'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static internal(message = 'Error interno del servidor'): AppError {
    return new AppError(message, 500, false);
  }
}
