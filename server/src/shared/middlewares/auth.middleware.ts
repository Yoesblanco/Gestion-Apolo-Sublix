import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors/app-error';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(AppError.unauthorized('Token de autenticación no proporcionado'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(AppError.unauthorized('El token de sesión ha expirado'));
    }
    return next(AppError.unauthorized('Token de autenticación inválido'));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized('Usuario no autenticado'));
    }
    if (req.user.role && !roles.includes(req.user.role)) {
      return next(AppError.forbidden('No tienes permisos suficientes para realizar esta acción'));
    }
    next();
  };
};
