import { Router } from 'express';
import { SyncController } from './sync.controller';
import { GetAllDataUseCase } from '../application/get-all-data.use-case';
import { SyncDataUseCase } from '../application/sync-data.use-case';
import { DrizzleProductRepository } from '../../products/infrastructure/drizzle-product.repository';
import { DrizzleCustomerRepository } from '../../customers/infrastructure/drizzle-customer.repository';
import { DrizzleOrderRepository } from '../../orders/infrastructure/drizzle-order.repository';
import { DrizzleTransactionRepository } from '../../transactions/infrastructure/drizzle-transaction.repository';
import { DrizzleToBuyRepository } from '../../to-buy/infrastructure/drizzle-to-buy.repository';
import { DrizzleStockHistoryRepository } from '../../inventory/infrastructure/drizzle-stock-history.repository';

const syncRouter = Router();

const productRepo = new DrizzleProductRepository();
const customerRepo = new DrizzleCustomerRepository();
const orderRepo = new DrizzleOrderRepository();
const txRepo = new DrizzleTransactionRepository();
const toBuyRepo = new DrizzleToBuyRepository();
const stockHistoryRepo = new DrizzleStockHistoryRepository();

const getAllDataUseCase = new GetAllDataUseCase(
  productRepo,
  customerRepo,
  orderRepo,
  txRepo,
  toBuyRepo,
  stockHistoryRepo
);

const syncDataUseCase = new SyncDataUseCase(
  productRepo,
  customerRepo,
  orderRepo,
  txRepo,
  toBuyRepo,
  stockHistoryRepo
);

const syncController = new SyncController(getAllDataUseCase, syncDataUseCase);

syncRouter.get('/', syncController.getAllData);
syncRouter.post('/sync', syncController.syncData);

export { syncRouter };
