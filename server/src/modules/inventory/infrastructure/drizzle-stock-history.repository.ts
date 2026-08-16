import { eq, notInArray } from 'drizzle-orm';
import { db } from '../../../config/database';
import { stockHistory } from '../../../db/schema/stock-history';
import { IStockHistoryRepository, StockHistoryEntity } from '../domain/stock-history.entity';

export class DrizzleStockHistoryRepository implements IStockHistoryRepository {
  async findAll(): Promise<StockHistoryEntity[]> {
    const list = await db.select().from(stockHistory);
    return list.map(this.mapToEntity);
  }

  async findById(id: string): Promise<StockHistoryEntity | null> {
    const [item] = await db.select().from(stockHistory).where(eq(stockHistory.id, id)).limit(1);
    return item ? this.mapToEntity(item) : null;
  }

  async create(item: StockHistoryEntity): Promise<StockHistoryEntity> {
    const [inserted] = await db
      .insert(stockHistory)
      .values({
        id: item.id,
        date: item.date || null,
        type: item.type || null,
        productName: item.productName || null,
        customer: item.customer || null,
        quantity: item.quantity || 0,
        orderId: item.orderId || null,
        notes: item.notes || null,
      })
      .returning();

    return this.mapToEntity(inserted);
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(stockHistory).where(eq(stockHistory.id, id)).returning();
    return result.length > 0;
  }

  async upsertMany(items: StockHistoryEntity[]): Promise<void> {
    if (items.length === 0) return;
    for (const item of items) {
      await db
        .insert(stockHistory)
        .values({
          id: item.id,
          date: item.date || null,
          type: item.type || null,
          productName: item.productName || null,
          customer: item.customer || null,
          quantity: item.quantity || 0,
          orderId: item.orderId || null,
          notes: item.notes || null,
        })
        .onConflictDoUpdate({
          target: stockHistory.id,
          set: {
            date: item.date || null,
            type: item.type || null,
            productName: item.productName || null,
            customer: item.customer || null,
            quantity: item.quantity || 0,
            orderId: item.orderId || null,
            notes: item.notes || null,
          },
        });
    }
  }

  async replaceAll(items: StockHistoryEntity[]): Promise<void> {
    if (items.length === 0) {
      await db.delete(stockHistory);
      return;
    }
    const ids = items.map((i) => i.id);
    await db.delete(stockHistory).where(notInArray(stockHistory.id, ids));
    await this.upsertMany(items);
  }

  private mapToEntity(row: typeof stockHistory.$inferSelect): StockHistoryEntity {
    return {
      id: row.id,
      date: row.date,
      type: row.type,
      productName: row.productName,
      customer: row.customer,
      quantity: row.quantity,
      orderId: row.orderId,
      notes: row.notes,
      createdAt: row.createdAt,
    };
  }
}
