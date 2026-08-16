import { pgTable, varchar, timestamp, text, integer, doublePrecision } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  stock: integer('stock').notNull().default(0),
  price: doublePrecision('price').notNull().default(0),
  cost: doublePrecision('cost').default(0),
  minStock: integer('min_stock').default(0),
  status: varchar('status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
