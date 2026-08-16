import { Request, Response, NextFunction } from 'express';
import { GetAllDataUseCase } from '../application/get-all-data.use-case';
import { SyncDataUseCase } from '../application/sync-data.use-case';

export class SyncController {
  constructor(
    private readonly getAllDataUseCase: GetAllDataUseCase,
    private readonly syncDataUseCase: SyncDataUseCase
  ) {}

  getAllData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.getAllDataUseCase.execute();
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  syncData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.syncDataUseCase.execute(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
