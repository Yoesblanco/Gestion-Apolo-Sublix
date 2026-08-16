import { Router } from 'express';
import { TransactionController } from './transaction.controller';
import { TransactionUseCases } from '../application/transaction.use-cases';
import { DrizzleTransactionRepository } from '../infrastructure/drizzle-transaction.repository';
import { authenticateToken } from '../../../shared/middlewares/auth.middleware';

const transactionRouter = Router();

const repo = new DrizzleTransactionRepository();
const useCases = new TransactionUseCases(repo);
const controller = new TransactionController(useCases);

transactionRouter.get('/', controller.getAll);
transactionRouter.get('/:id', controller.getById);
transactionRouter.post('/', authenticateToken, controller.create);
transactionRouter.put('/:id', authenticateToken, controller.update);
transactionRouter.delete('/:id', authenticateToken, controller.delete);

export { transactionRouter };
