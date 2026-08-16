export interface StockHistoryEntity {
  id: string;
  date?: string | null;
  type?: string | null;
  productName?: string | null;
  customer?: string | null;
  quantity?: number | null;
  orderId?: string | null;
  notes?: string | null;
  createdAt?: Date | null;
}

export interface IStockHistoryRepository {
  findAll(): Promise<StockHistoryEntity[]>;
  findById(id: string): Promise<StockHistoryEntity | null>;
  create(item: StockHistoryEntity): Promise<StockHistoryEntity>;
  delete(id: string): Promise<boolean>;
  upsertMany(items: StockHistoryEntity[]): Promise<void>;
  replaceAll(items: StockHistoryEntity[]): Promise<void>;
}
