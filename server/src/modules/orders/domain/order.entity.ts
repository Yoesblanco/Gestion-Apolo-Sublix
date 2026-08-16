export interface PaymentEntity {
  id: number;
  orderId: string;
  amount: number;
  paymentDate?: string | null;
  date?: string | null;
  method?: string | null;
  notes?: string | null;
  transactionId?: number | null;
  createdAt?: Date | null;
}

export interface OrderEntity {
  id: string;
  customerId?: string | null;
  customer?: string | null; // customerName
  productName?: string | null;
  date?: string | null; // orderDate
  deliveryDate?: string | null;
  total: number;
  status: string;
  desc?: string | null; // description
  quantity: number;
  pendingStockToSubtract?: number | null;
  payments?: PaymentEntity[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface IOrderRepository {
  findAll(): Promise<OrderEntity[]>;
  findById(id: string): Promise<OrderEntity | null>;
  create(order: OrderEntity): Promise<OrderEntity>;
  update(id: string, updates: Partial<OrderEntity>): Promise<OrderEntity | null>;
  delete(id: string): Promise<boolean>;
  syncOrdersAndPayments(orders: OrderEntity[]): Promise<void>;
}
