import { pgTable, varchar, timestamp, text, doublePrecision, bigint } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const payments = pgTable('payments', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  orderId: varchar('order_id', { length: 64 }).references(() => orders.id, { onDelete: 'cascade' }),
  amount: doublePrecision('amount').notNull().default(0),
  paymentDate: varchar('payment_date', { length: 100 }),
  method: varchar('method', { length: 100 }),
  notes: text('notes'),
  transactionId: bigint('transaction_id', { mode: 'number' }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
