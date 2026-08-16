import { pgTable, varchar, timestamp, text, integer } from 'drizzle-orm/pg-core';

export const toBuy = pgTable('to_buy', {
  id: varchar('id', { length: 64 }).primaryKey(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  notes: text('notes'),
  orderDescription: text('order_description'),
  status: varchar('status', { length: 50 }).notNull().default('Pendiente'),
  dateAdded: varchar('date_added', { length: 100 }),
  orderId: varchar('order_id', { length: 64 }),
  customer: varchar('customer', { length: 255 }),
  productId: varchar('product_id', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type ToBuy = typeof toBuy.$inferSelect;
export type NewToBuy = typeof toBuy.$inferInsert;
