import { Router } from 'express';
import { OrderController } from './order.controller';
import { OrderUseCases } from '../application/order.use-cases';
import { DrizzleOrderRepository } from '../infrastructure/drizzle-order.repository';
import { authenticateToken } from '../../../shared/middlewares/auth.middleware';

const orderRouter = Router();

const repo = new DrizzleOrderRepository();
const useCases = new OrderUseCases(repo);
const controller = new OrderController(useCases);

orderRouter.get('/', controller.getAll);
orderRouter.get('/:id', controller.getById);
orderRouter.post('/', authenticateToken, controller.create);
orderRouter.put('/:id', authenticateToken, controller.update);
orderRouter.delete('/:id', authenticateToken, controller.delete);

export { orderRouter };
