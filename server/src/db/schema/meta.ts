import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const meta = pgTable('meta', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Meta = typeof meta.$inferSelect;
export type NewMeta = typeof meta.$inferInsert;
