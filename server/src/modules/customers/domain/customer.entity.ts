export interface CustomerEntity {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface ICustomerRepository {
  findAll(): Promise<CustomerEntity[]>;
  findById(id: string): Promise<CustomerEntity | null>;
  create(customer: CustomerEntity): Promise<CustomerEntity>;
  update(id: string, updates: Partial<CustomerEntity>): Promise<CustomerEntity | null>;
  delete(id: string): Promise<boolean>;
  upsertMany(customers: CustomerEntity[]): Promise<void>;
  replaceAll(customers: CustomerEntity[]): Promise<void>;
}
