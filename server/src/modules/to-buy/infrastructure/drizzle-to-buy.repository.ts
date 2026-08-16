import { eq, notInArray } from 'drizzle-orm';
import { db } from '../../../config/database';
import { toBuy } from '../../../db/schema/to-buy';
import { toBuyHistory } from '../../../db/schema/to-buy-history';
import { IToBuyRepository, ToBuyEntity, ToBuyHistoryEntity } from '../domain/to-buy.entity';

export class DrizzleToBuyRepository implements IToBuyRepository {
  async findAllToBuy(): Promise<ToBuyEntity[]> {
    const list = await db.select().from(toBuy);
    return list.map((b) => ({
      id: b.id,
      productName: b.productName,
      quantity: b.quantity,
      notes: b.notes,
      orderDescription: b.orderDescription,
      status: b.status,
      dateAdded: b.dateAdded,
      orderId: b.orderId,
      customer: b.customer,
      productId: b.productId,
      createdAt: b.createdAt,
    }));
  }

  async findAllHistory(): Promise<ToBuyHistoryEntity[]> {
    const list = await db.select().from(toBuyHistory);
    return list.map((h) => ({
      id: h.id,
      productName: h.productName,
      quantity: h.quantity,
      notes: h.notes,
      orderDescription: h.orderDescription,
      status: h.status,
      dateAdded: h.dateAdded,
      orderId: h.orderId,
      customer: h.customer,
      dateBought: h.dateBought,
      purchasePrice: h.purchasePrice,
      productId: h.productId,
      transactionId: h.transactionId,
      createdAt: h.createdAt,
    }));
  }

  async createToBuy(item: ToBuyEntity): Promise<ToBuyEntity> {
    const [inserted] = await db
      .insert(toBuy)
      .values({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        notes: item.notes || null,
        orderDescription: item.orderDescription || null,
        status: item.status || 'Pendiente',
        dateAdded: item.dateAdded || null,
        orderId: item.orderId || null,
        customer: item.customer || null,
        productId: item.productId || null,
      })
      .returning();

    return inserted as ToBuyEntity;
  }

  async createHistory(item: ToBuyHistoryEntity): Promise<ToBuyHistoryEntity> {
    const [inserted] = await db
      .insert(toBuyHistory)
      .values({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        notes: item.notes || null,
        orderDescription: item.orderDescription || null,
        status: item.status || null,
        dateAdded: item.dateAdded || null,
        orderId: item.orderId || null,
        customer: item.customer || null,
        dateBought: item.dateBought || null,
        purchasePrice: item.purchasePrice || 0,
        productId: item.productId || null,
        transactionId: item.transactionId || null,
      })
      .returning();

    return inserted as ToBuyHistoryEntity;
  }

  async deleteToBuy(id: string): Promise<boolean> {
    const result = await db.delete(toBuy).where(eq(toBuy.id, id)).returning();
    return result.length > 0;
  }

  async deleteHistory(id: string): Promise<boolean> {
    const result = await db.delete(toBuyHistory).where(eq(toBuyHistory.id, id)).returning();
    return result.length > 0;
  }

  async replaceToBuy(items: ToBuyEntity[]): Promise<void> {
    if (items.length === 0) {
      await db.delete(toBuy);
      return;
    }
    const ids = items.map((i) => i.id);
    await db.delete(toBuy).where(notInArray(toBuy.id, ids));
    for (const item of items) {
      await db
        .insert(toBuy)
        .values({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          notes: item.notes || null,
          orderDescription: item.orderDescription || null,
          status: item.status,
          dateAdded: item.dateAdded || null,
          orderId: item.orderId || null,
          customer: item.customer || null,
          productId: item.productId || null,
        })
        .onConflictDoUpdate({
          target: toBuy.id,
          set: {
            productName: item.productName,
            quantity: item.quantity,
            notes: item.notes || null,
            orderDescription: item.orderDescription || null,
            status: item.status,
            dateAdded: item.dateAdded || null,
            orderId: item.orderId || null,
            customer: item.customer || null,
            productId: item.productId || null,
          },
        });
    }
  }

  async replaceHistory(items: ToBuyHistoryEntity[]): Promise<void> {
    if (items.length === 0) {
      await db.delete(toBuyHistory);
      return;
    }
    const ids = items.map((i) => i.id);
    await db.delete(toBuyHistory).where(notInArray(toBuyHistory.id, ids));
    for (const item of items) {
      await db
        .insert(toBuyHistory)
        .values({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          notes: item.notes || null,
          orderDescription: item.orderDescription || null,
          status: item.status || null,
          dateAdded: item.dateAdded || null,
          orderId: item.orderId || null,
          customer: item.customer || null,
          dateBought: item.dateBought || null,
          purchasePrice: item.purchasePrice || 0,
          productId: item.productId || null,
          transactionId: item.transactionId || null,
        })
        .onConflictDoUpdate({
          target: toBuyHistory.id,
          set: {
            productName: item.productName,
            quantity: item.quantity,
            notes: item.notes || null,
            orderDescription: item.orderDescription || null,
            status: item.status || null,
            dateAdded: item.dateAdded || null,
            orderId: item.orderId || null,
            customer: item.customer || null,
            dateBought: item.dateBought || null,
            purchasePrice: item.purchasePrice || 0,
            productId: item.productId || null,
            transactionId: item.transactionId || null,
          },
        });
    }
  }
}
