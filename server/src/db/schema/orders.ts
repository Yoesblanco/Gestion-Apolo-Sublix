import { pgTable, varchar, timestamp, text, integer, doublePrecision } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const orders = pgTable('orders', {
  id: varchar('id', { length: 64 }).primaryKey(),
  customerId: varchar('customer_id', { length: 64 }).references(() => customers.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 255 }),
  productName: varchar('product_name', { length: 255 }),
  orderDate: varchar('order_date', { length: 100 }),
  deliveryDate: varchar('delivery_date', { length: 100 }),
  total: doublePrecision('total').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('Pendiente'),
  description: text('description'),
  quantity: integer('quantity').notNull().default(1),
  pendingStockToSubtract: integer('pending_stock_to_subtract').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
