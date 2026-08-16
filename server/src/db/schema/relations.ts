import { relations } from 'drizzle-orm';
import { users } from './users';
import { customers } from './customers';
import { orders } from './orders';
import { payments } from './payments';
import { products } from './products';
import { transactions } from './transactions';
import { toBuy } from './to-buy';
import { toBuyHistory } from './to-buy-history';
import { stockHistory } from './stock-history';

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  payments: many(payments),
  transactions: many(transactions),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  toBuyItems: many(toBuy),
}));

export const toBuyRelations = relations(toBuy, ({ one }) => ({
  order: one(orders, {
    fields: [toBuy.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [toBuy.productId],
    references: [products.id],
  }),
}));

export const toBuyHistoryRelations = relations(toBuyHistory, ({ one }) => ({
  order: one(orders, {
    fields: [toBuyHistory.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [toBuyHistory.productId],
    references: [products.id],
  }),
}));
