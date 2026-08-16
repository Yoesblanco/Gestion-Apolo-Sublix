import { eq, notInArray } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orders } from '../../../db/schema/orders';
import { payments } from '../../../db/schema/payments';
import { IOrderRepository, OrderEntity, PaymentEntity } from '../domain/order.entity';

export class DrizzleOrderRepository implements IOrderRepository {
  async findAll(): Promise<OrderEntity[]> {
    // Relational Query with JOIN in PostgreSQL via Drizzle
    const ordersWithPayments = await db.query.orders.findMany({
      with: {
        payments: true,
      },
    });

    return ordersWithPayments.map((o) => {
      const orderPayments: PaymentEntity[] = (o.payments || []).map((p) => ({
        id: Number(p.id),
        orderId: p.orderId || o.id,
        amount: p.amount,
        paymentDate: p.paymentDate,
        date: p.paymentDate,
        method: p.method,
        notes: p.notes,
        transactionId: p.transactionId ? Number(p.transactionId) : null,
        createdAt: p.createdAt,
      }));

      return this.mapToEntity(o, orderPayments);
    });
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const orderRecord = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        payments: true,
      },
    });

    if (!orderRecord) return null;

    const orderPayments: PaymentEntity[] = (orderRecord.payments || []).map((p) => ({
      id: Number(p.id),
      orderId: p.orderId || id,
      amount: p.amount,
      paymentDate: p.paymentDate,
      date: p.paymentDate,
      method: p.method,
      notes: p.notes,
      transactionId: p.transactionId ? Number(p.transactionId) : null,
      createdAt: p.createdAt,
    }));

    return this.mapToEntity(orderRecord, orderPayments);
  }

  async create(order: OrderEntity): Promise<OrderEntity> {
    const [inserted] = await db
      .insert(orders)
      .values({
        id: order.id,
        customerId: order.customerId || null,
        customerName: order.customer || null,
        productName: order.productName || null,
        orderDate: order.date || null,
        deliveryDate: order.deliveryDate || null,
        total: order.total,
        status: order.status || 'Pendiente',
        description: order.desc || null,
        quantity: order.quantity || 1,
        pendingStockToSubtract: order.pendingStockToSubtract || 0,
      })
      .returning();

    if (order.payments && order.payments.length > 0) {
      for (const p of order.payments) {
        await db.insert(payments).values({
          id: p.id,
          orderId: order.id,
          amount: p.amount,
          paymentDate: p.paymentDate || p.date || null,
          method: p.method || null,
          notes: p.notes || null,
          transactionId: p.transactionId || null,
        });
      }
    }

    return this.mapToEntity(inserted, order.payments || []);
  }

  async update(id: string, updates: Partial<OrderEntity>): Promise<OrderEntity | null> {
    const [updated] = await db
      .update(orders)
      .set({
        ...(updates.customerId !== undefined && { customerId: updates.customerId }),
        ...(updates.customer !== undefined && { customerName: updates.customer }),
        ...(updates.productName !== undefined && { productName: updates.productName }),
        ...(updates.date !== undefined && { orderDate: updates.date }),
        ...(updates.deliveryDate !== undefined && { deliveryDate: updates.deliveryDate }),
        ...(updates.total !== undefined && { total: updates.total }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.desc !== undefined && { description: updates.desc }),
        ...(updates.quantity !== undefined && { quantity: updates.quantity }),
        ...(updates.pendingStockToSubtract !== undefined && { pendingStockToSubtract: updates.pendingStockToSubtract }),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (!updated) return null;

    if (updates.payments !== undefined) {
      await db.delete(payments).where(eq(payments.orderId, id));
      for (const p of updates.payments) {
        await db.insert(payments).values({
          id: p.id,
          orderId: id,
          amount: p.amount,
          paymentDate: p.paymentDate || p.date || null,
          method: p.method || null,
          notes: p.notes || null,
          transactionId: p.transactionId || null,
        });
      }
    }

    const currentPayments = await db.select().from(payments).where(eq(payments.orderId, id));
    return this.mapToEntity(
      updated,
      currentPayments.map((p) => ({
        id: Number(p.id),
        orderId: id,
        amount: p.amount,
        paymentDate: p.paymentDate,
        date: p.paymentDate,
        method: p.method,
        notes: p.notes,
        transactionId: p.transactionId ? Number(p.transactionId) : null,
        createdAt: p.createdAt,
      }))
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id)).returning();
    return result.length > 0;
  }

  async syncOrdersAndPayments(items: OrderEntity[]): Promise<void> {
    if (items.length === 0) {
      await db.delete(payments);
      await db.delete(orders);
      return;
    }

    const orderIds = items.map((o) => o.id);
    await db.delete(orders).where(notInArray(orders.id, orderIds));

    const allPayments: PaymentEntity[] = [];

    for (const o of items) {
      await db
        .insert(orders)
        .values({
          id: o.id,
          customerId: o.customerId || null,
          customerName: o.customer || null,
          productName: o.productName || null,
          orderDate: o.date || null,
          deliveryDate: o.deliveryDate || null,
          total: o.total,
          status: o.status,
          description: o.desc || null,
          quantity: o.quantity,
          pendingStockToSubtract: o.pendingStockToSubtract || 0,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: orders.id,
          set: {
            customerId: o.customerId || null,
            customerName: o.customer || null,
            productName: o.productName || null,
            orderDate: o.date || null,
            deliveryDate: o.deliveryDate || null,
            total: o.total,
            status: o.status,
            description: o.desc || null,
            quantity: o.quantity,
            pendingStockToSubtract: o.pendingStockToSubtract || 0,
            updatedAt: new Date(),
          },
        });

      if (o.payments && Array.isArray(o.payments)) {
        o.payments.forEach((p) => {
          allPayments.push({
            id: Math.round(Number(p.id)),
            orderId: o.id,
            amount: p.amount,
            paymentDate: p.paymentDate || p.date || null,
            date: p.paymentDate || p.date || null,
            method: p.method || null,
            notes: p.notes || null,
            transactionId: p.transactionId ? Math.round(Number(p.transactionId)) : null,
          } as PaymentEntity);
        });
      }
    }

    if (allPayments.length > 0) {
      const pIds = allPayments.map((p) => p.id);
      await db.delete(payments).where(notInArray(payments.id, pIds));
      for (const p of allPayments) {
        await db
          .insert(payments)
          .values({
            id: p.id,
            orderId: p.orderId,
            amount: p.amount,
            paymentDate: p.paymentDate,
            method: p.method,
            notes: p.notes,
            transactionId: p.transactionId,
          })
          .onConflictDoUpdate({
            target: payments.id,
            set: {
              amount: p.amount,
              paymentDate: p.paymentDate,
              method: p.method,
              notes: p.notes,
              transactionId: p.transactionId,
            },
          });
      }
    } else {
      await db.delete(payments);
    }
  }

  private mapToEntity(row: typeof orders.$inferSelect, paymentsList: PaymentEntity[]): OrderEntity {
    return {
      id: row.id,
      customerId: row.customerId,
      customer: row.customerName,
      productName: row.productName,
      date: row.orderDate,
      deliveryDate: row.deliveryDate,
      total: row.total,
      status: row.status,
      desc: row.description,
      quantity: row.quantity,
      pendingStockToSubtract: row.pendingStockToSubtract,
      payments: paymentsList,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
