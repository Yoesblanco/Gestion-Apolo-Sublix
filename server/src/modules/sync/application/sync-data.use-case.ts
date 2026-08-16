import { db } from '../../../config/database';
import { meta } from '../../../db/schema/meta';
import { IProductRepository, ProductEntity } from '../../products/domain/product.entity';
import { ICustomerRepository, CustomerEntity } from '../../customers/domain/customer.entity';
import { IOrderRepository, OrderEntity } from '../../orders/domain/order.entity';
import { ITransactionRepository, TransactionEntity } from '../../transactions/domain/transaction.entity';
import { IToBuyRepository, ToBuyEntity, ToBuyHistoryEntity } from '../../to-buy/domain/to-buy.entity';
import { IStockHistoryRepository, StockHistoryEntity } from '../../inventory/domain/stock-history.entity';

export interface SyncPayload {
  products?: ProductEntity[];
  orders?: OrderEntity[];
  transactions?: TransactionEntity[];
  customers?: CustomerEntity[];
  toBuy?: ToBuyEntity[];
  stockHistory?: StockHistoryEntity[];
  toBuyHistory?: ToBuyHistoryEntity[];
  timestamp?: number;
}

export class SyncDataUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly customerRepo: ICustomerRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly txRepo: ITransactionRepository,
    private readonly toBuyRepo: IToBuyRepository,
    private readonly stockHistoryRepo: IStockHistoryRepository
  ) {}

  async execute(payload: SyncPayload): Promise<{ message: string; lastSync: number }> {
    if (payload.products && Array.isArray(payload.products)) {
      await this.productRepo.replaceAll(payload.products);
    }

    if (payload.customers && Array.isArray(payload.customers)) {
      await this.customerRepo.replaceAll(payload.customers);
    }

    if (payload.transactions && Array.isArray(payload.transactions)) {
      await this.txRepo.replaceAll(payload.transactions);
    }

    if (payload.orders && Array.isArray(payload.orders)) {
      await this.orderRepo.syncOrdersAndPayments(payload.orders);
    }

    if (payload.stockHistory && Array.isArray(payload.stockHistory)) {
      await this.stockHistoryRepo.replaceAll(payload.stockHistory);
    }

    if (payload.toBuy && Array.isArray(payload.toBuy)) {
      await this.toBuyRepo.replaceToBuy(payload.toBuy);
    }

    if (payload.toBuyHistory && Array.isArray(payload.toBuyHistory)) {
      await this.toBuyRepo.replaceHistory(payload.toBuyHistory);
    }

    const newTimestamp = payload.timestamp || Date.now();

    await db
      .insert(meta)
      .values({
        key: 'last_sync',
        value: String(newTimestamp),
      })
      .onConflictDoUpdate({
        target: meta.key,
        set: {
          value: String(newTimestamp),
          updatedAt: new Date(),
        },
      });

    return {
      message: 'Datos sincronizados con PostgreSQL/Drizzle con éxito',
      lastSync: newTimestamp,
    };
  }
}
