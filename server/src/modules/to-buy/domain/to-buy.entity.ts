export interface ToBuyEntity {
  id: string;
  productName: string;
  quantity: number;
  notes?: string | null;
  orderDescription?: string | null;
  status: string;
  dateAdded?: string | null;
  orderId?: string | null;
  customer?: string | null;
  productId?: string | null;
  createdAt?: Date | null;
}

export interface ToBuyHistoryEntity {
  id: string;
  productName: string;
  quantity: number;
  notes?: string | null;
  orderDescription?: string | null;
  status?: string | null;
  dateAdded?: string | null;
  orderId?: string | null;
  customer?: string | null;
  dateBought?: string | null;
  purchasePrice?: number | null;
  productId?: string | null;
  transactionId?: string | null;
  createdAt?: Date | null;
}

export interface IToBuyRepository {
  findAllToBuy(): Promise<ToBuyEntity[]>;
  findAllHistory(): Promise<ToBuyHistoryEntity[]>;
  createToBuy(item: ToBuyEntity): Promise<ToBuyEntity>;
  createHistory(item: ToBuyHistoryEntity): Promise<ToBuyHistoryEntity>;
  deleteToBuy(id: string): Promise<boolean>;
  deleteHistory(id: string): Promise<boolean>;
  replaceToBuy(items: ToBuyEntity[]): Promise<void>;
  replaceHistory(items: ToBuyHistoryEntity[]): Promise<void>;
}
