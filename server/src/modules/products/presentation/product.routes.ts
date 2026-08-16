import { Router } from 'express';
import { ProductController } from './product.controller';
import { ProductUseCases } from '../application/product.use-cases';
import { DrizzleProductRepository } from '../infrastructure/drizzle-product.repository';
import { authenticateToken } from '../../../shared/middlewares/auth.middleware';

const productRouter = Router();

const repo = new DrizzleProductRepository();
const useCases = new ProductUseCases(repo);
const controller = new ProductController(useCases);

productRouter.get('/', controller.getAll);
productRouter.get('/:id', controller.getById);
productRouter.post('/', authenticateToken, controller.create);
productRouter.put('/:id', authenticateToken, controller.update);
productRouter.delete('/:id', authenticateToken, controller.delete);

export { productRouter };
