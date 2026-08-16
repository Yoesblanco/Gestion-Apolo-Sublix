import { eq, notInArray } from 'drizzle-orm';
import { db } from '../../../config/database';
import { transactions } from '../../../db/schema/transactions';
import { ITransactionRepository, TransactionEntity } from '../domain/transaction.entity';

export class DrizzleTransactionRepository implements ITransactionRepository {
  async findAll(): Promise<TransactionEntity[]> {
    const list = await db.select().from(transactions);
    return list.map(this.mapToEntity);
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    const [item] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return item ? this.mapToEntity(item) : null;
  }

  async create(tx: TransactionEntity): Promise<TransactionEntity> {
    const [inserted] = await db
      .insert(transactions)
      .values({
        id: tx.id,
        date: tx.date || null,
        amount: tx.amount,
        type: tx.type,
        category: tx.category || null,
        method: tx.method || null,
        description: tx.description || null,
        orderId: tx.orderId || null,
      })
      .returning();

    return this.mapToEntity(inserted);
  }

  async update(id: string, updates: Partial<TransactionEntity>): Promise<TransactionEntity | null> {
    const [updated] = await db
      .update(transactions)
      .set({
        ...(updates.date !== undefined && { date: updates.date }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.method !== undefined && { method: updates.method }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.orderId !== undefined && { orderId: updates.orderId }),
      })
      .where(eq(transactions.id, id))
      .returning();

    return updated ? this.mapToEntity(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id)).returning();
    return result.length > 0;
  }

  async upsertMany(items: TransactionEntity[]): Promise<void> {
    if (items.length === 0) return;
    for (const item of items) {
      await db
        .insert(transactions)
        .values({
          id: item.id,
          date: item.date || null,
          amount: item.amount,
          type: item.type,
          category: item.category || null,
          method: item.method || null,
          description: item.description || null,
          orderId: item.orderId || null,
        })
        .onConflictDoUpdate({
          target: transactions.id,
          set: {
            date: item.date || null,
            amount: item.amount,
            type: item.type,
            category: item.category || null,
            method: item.method || null,
            description: item.description || null,
            orderId: item.orderId || null,
          },
        });
    }
  }

  async replaceAll(items: TransactionEntity[]): Promise<void> {
    if (items.length === 0) {
      await db.delete(transactions);
      return;
    }
    const ids = items.map((i) => i.id);
    await db.delete(transactions).where(notInArray(transactions.id, ids));
    await this.upsertMany(items);
  }

  private mapToEntity(row: typeof transactions.$inferSelect): TransactionEntity {
    return {
      id: row.id,
      date: row.date,
      amount: row.amount,
      type: row.type,
      category: row.category,
      method: row.method,
      description: row.description,
      orderId: row.orderId,
      createdAt: row.createdAt,
    };
  }
}
