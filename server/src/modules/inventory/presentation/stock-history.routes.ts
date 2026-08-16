import { Router } from 'express';
import { StockHistoryController } from './stock-history.controller';
import { StockHistoryUseCases } from '../application/stock-history.use-cases';
import { DrizzleStockHistoryRepository } from '../infrastructure/drizzle-stock-history.repository';
import { authenticateToken } from '../../../shared/middlewares/auth.middleware';

const stockHistoryRouter = Router();

const repo = new DrizzleStockHistoryRepository();
const useCases = new StockHistoryUseCases(repo);
const controller = new StockHistoryController(useCases);

stockHistoryRouter.get('/', controller.getAll);
stockHistoryRouter.get('/:id', controller.getById);
stockHistoryRouter.post('/', authenticateToken, controller.create);
stockHistoryRouter.delete('/:id', authenticateToken, controller.delete);

export { stockHistoryRouter };
