import { ICustomerRepository, CustomerEntity } from '../domain/customer.entity';
import { AppError } from '../../../shared/errors/app-error';

export class CustomerUseCases {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async getAll(): Promise<CustomerEntity[]> {
    return this.customerRepo.findAll();
  }

  async getById(id: string): Promise<CustomerEntity> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw AppError.notFound('Cliente no encontrado');
    return customer;
  }

  async create(customer: CustomerEntity): Promise<CustomerEntity> {
    return this.customerRepo.create(customer);
  }

  async update(id: string, updates: Partial<CustomerEntity>): Promise<CustomerEntity> {
    const updated = await this.customerRepo.update(id, updates);
    if (!updated) throw AppError.notFound('Cliente no encontrado para actualizar');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.customerRepo.delete(id);
    if (!deleted) throw AppError.notFound('Cliente no encontrado para eliminar');
  }
}
