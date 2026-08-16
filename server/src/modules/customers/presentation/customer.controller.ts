import { Request, Response, NextFunction } from 'express';
import { CustomerUseCases } from '../application/customer.use-cases';

export class CustomerController {
  constructor(private readonly useCases: CustomerUseCases) {}

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

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const item = await this.useCases.update(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.useCases.delete(req.params.id);
      res.json({ message: 'Cliente eliminado con éxito' });
    } catch (error) {
      next(error);
    }
  };
}
