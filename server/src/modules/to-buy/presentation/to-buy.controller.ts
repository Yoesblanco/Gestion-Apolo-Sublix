import { Request, Response, NextFunction } from 'express';
import { ToBuyUseCases } from '../application/to-buy.use-cases';

export class ToBuyController {
  constructor(private readonly useCases: ToBuyUseCases) {}

  getAllToBuy = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.useCases.getAllToBuy();
      res.json(items);
    } catch (error) {
      next(error);
    }
  };

  getAllHistory = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const items = await this.useCases.getAllHistory();
      res.json(items);
    } catch (error) {
      next(error);
    }
  };

  createToBuy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.useCases.createToBuy(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  };

  createHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.useCases.createHistory(req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  };

  deleteToBuy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.useCases.deleteToBuy(req.params.id);
      res.json({ message: 'Elemento eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  };

  deleteHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.useCases.deleteHistory(req.params.id);
      res.json({ message: 'Historial eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  };
}
