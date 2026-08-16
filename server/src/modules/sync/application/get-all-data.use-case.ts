import { db } from '../../../config/database';
import { meta } from '../../../db/schema/meta';
import { eq } from 'drizzle-orm';
import { IProductRepository } from '../../products/domain/product.entity';
import { ICustomerRepository } from '../../customers/domain/customer.entity';
import { IOrderRepository } from '../../orders/domain/order.entity';
import { ITransactionRepository } from '../../transactions/domain/transaction.entity';
import { IToBuyRepository } from '../../to-buy/domain/to-buy.entity';
import { IStockHistoryRepository } from '../../inventory/domain/stock-history.entity';

export interface FullDatabaseFormat {
  products: unknown[];
  orders: unknown[];
  transactions: unknown[];
  customers: unknown[];
  toBuy: unknown[];
  stockHistory: unknown[];
  toBuyHistory: unknown[];
  lastSync: number;
}

export class GetAllDataUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly customerRepo: ICustomerRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly txRepo: ITransactionRepository,
    private readonly toBuyRepo: IToBuyRepository,
    private readonly stockHistoryRepo: IStockHistoryRepository
  ) {}

  async execute(): Promise<FullDatabaseFormat> {
    const [products, orders, customers, transactions, toBuy, toBuyHistory, stockHistory, metaRecord] =
      await Promise.all([
        this.productRepo.findAll(),
        this.orderRepo.findAll(),
        this.customerRepo.findAll(),
        this.txRepo.findAll(),
        this.toBuyRepo.findAllToBuy(),
        this.toBuyRepo.findAllHistory(),
        this.stockHistoryRepo.findAll(),
        db.select().from(meta).where(eq(meta.key, 'last_sync')).limit(1),
      ]);

    const lastSync = metaRecord[0] ? Number(metaRecord[0].value) : 1;

    return {
      products,
      orders,
      transactions,
      customers,
      toBuy,
      stockHistory,
      toBuyHistory,
      lastSync,
    };
  }
}
