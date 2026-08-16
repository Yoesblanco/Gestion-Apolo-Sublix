import { pgTable, varchar, timestamp, text, integer, doublePrecision } from 'drizzle-orm/pg-core';

export const toBuyHistory = pgTable('to_buy_history', {
  id: varchar('id', { length: 64 }).primaryKey(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  notes: text('notes'),
  orderDescription: text('order_description'),
  status: varchar('status', { length: 50 }),
  dateAdded: varchar('date_added', { length: 100 }),
  orderId: varchar('order_id', { length: 64 }),
  customer: varchar('customer', { length: 255 }),
  dateBought: varchar('date_bought', { length: 100 }),
  purchasePrice: doublePrecision('purchase_price').default(0),
  productId: varchar('product_id', { length: 64 }),
  transactionId: varchar('transaction_id', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type ToBuyHistory = typeof toBuyHistory.$inferSelect;
export type NewToBuyHistory = typeof toBuyHistory.$inferInsert;
