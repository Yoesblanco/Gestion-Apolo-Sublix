import { Router } from 'express';
import { ToBuyController } from './to-buy.controller';
import { ToBuyUseCases } from '../application/to-buy.use-cases';
import { DrizzleToBuyRepository } from '../infrastructure/drizzle-to-buy.repository';
import { authenticateToken } from '../../../shared/middlewares/auth.middleware';

const toBuyRouter = Router();

const repo = new DrizzleToBuyRepository();
const useCases = new ToBuyUseCases(repo);
const controller = new ToBuyController(useCases);

toBuyRouter.get('/', controller.getAllToBuy);
toBuyRouter.get('/history', controller.getAllHistory);
toBuyRouter.post('/', authenticateToken, controller.createToBuy);
toBuyRouter.post('/history', authenticateToken, controller.createHistory);
toBuyRouter.delete('/:id', authenticateToken, controller.deleteToBuy);
toBuyRouter.delete('/history/:id', authenticateToken, controller.deleteHistory);

export { toBuyRouter };
