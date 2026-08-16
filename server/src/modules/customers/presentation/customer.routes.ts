import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { CustomerUseCases } from '../application/customer.use-cases';
import { DrizzleCustomerRepository } from '../infrastructure/drizzle-customer.repository';
import { authenticateToken } from '../../../shared/middlewares/auth.middleware';

const customerRouter = Router();

const repo = new DrizzleCustomerRepository();
const useCases = new CustomerUseCases(repo);
const controller = new CustomerController(useCases);

customerRouter.get('/', controller.getAll);
customerRouter.get('/:id', controller.getById);
customerRouter.post('/', authenticateToken, controller.create);
customerRouter.put('/:id', authenticateToken, controller.update);
customerRouter.delete('/:id', authenticateToken, controller.delete);

export { customerRouter };
