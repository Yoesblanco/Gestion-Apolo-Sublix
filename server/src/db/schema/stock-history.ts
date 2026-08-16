import { pgTable, varchar, timestamp, text, integer } from 'drizzle-orm/pg-core';

export const stockHistory = pgTable('stock_history', {
  id: varchar('id', { length: 64 }).primaryKey(),
  date: varchar('date', { length: 100 }),
  type: varchar('type', { length: 50 }),
  productName: varchar('product_name', { length: 255 }),
  customer: varchar('customer', { length: 255 }),
  quantity: integer('quantity').default(0),
  orderId: varchar('order_id', { length: 64 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type StockHistory = typeof stockHistory.$inferSelect;
export type NewStockHistory = typeof stockHistory.$inferInsert;
