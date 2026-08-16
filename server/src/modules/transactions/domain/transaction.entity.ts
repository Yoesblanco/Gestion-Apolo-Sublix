export interface TransactionEntity {
  id: string;
  date?: string | null;
  amount: number;
  type: string; // 'Ingreso' | 'Egreso'
  category?: string | null;
  method?: string | null;
  description?: string | null;
  orderId?: string | null;
  createdAt?: Date | null;
}

export interface ITransactionRepository {
  findAll(): Promise<TransactionEntity[]>;
  findById(id: string): Promise<TransactionEntity | null>;
  create(tx: TransactionEntity): Promise<TransactionEntity>;
  update(id: string, updates: Partial<TransactionEntity>): Promise<TransactionEntity | null>;
  delete(id: string): Promise<boolean>;
  upsertMany(transactions: TransactionEntity[]): Promise<void>;
  replaceAll(transactions: TransactionEntity[]): Promise<void>;
}
