export interface ProductEntity {
  id: string;
  name: string;
  category?: string | null;
  stock: number;
  price: number;
  cost?: number | null;
  minStock?: number | null;
  status?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface IProductRepository {
  findAll(): Promise<ProductEntity[]>;
  findById(id: string): Promise<ProductEntity | null>;
  create(product: ProductEntity): Promise<ProductEntity>;
  update(id: string, product: Partial<ProductEntity>): Promise<ProductEntity | null>;
  delete(id: string): Promise<boolean>;
  upsertMany(products: ProductEntity[]): Promise<void>;
  replaceAll(products: ProductEntity[]): Promise<void>;
}
