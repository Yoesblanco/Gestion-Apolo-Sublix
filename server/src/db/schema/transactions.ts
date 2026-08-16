import { pgTable, varchar, timestamp, text, doublePrecision } from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  date: varchar('date', { length: 100 }),
  amount: doublePrecision('amount').notNull().default(0),
  type: varchar('type', { length: 50 }).notNull(), // 'Ingreso' | 'Egreso'
  category: varchar('category', { length: 100 }),
  method: varchar('method', { length: 100 }),
  description: text('description'),
  orderId: varchar('order_id', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
