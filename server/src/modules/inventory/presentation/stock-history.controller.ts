import { Request, Response, NextFunction } from 'express';
import { StockHistoryUseCases } from '../application/stock-history.use-cases';

export class StockHistoryController {
  constructor(private readonly useCases: StockHistoryUseCases) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.useCases.getAll();
      res.json(items);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.useCases.getById(req.params.id);
      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.useCases.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.useCases.delete(req.params.id);
      res.json({ message: 'Historial de stock eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  };
}
