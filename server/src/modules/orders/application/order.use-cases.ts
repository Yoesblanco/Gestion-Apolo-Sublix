import { IOrderRepository, OrderEntity } from '../domain/order.entity';
import { AppError } from '../../../shared/errors/app-error';

export class OrderUseCases {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async getAll(): Promise<OrderEntity[]> {
    return this.orderRepo.findAll();
  }

  async getById(id: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw AppError.notFound('Pedido no encontrado');
    return order;
  }

  async create(order: OrderEntity): Promise<OrderEntity> {
    return this.orderRepo.create(order);
  }

  async update(id: string, updates: Partial<OrderEntity>): Promise<OrderEntity> {
    const updated = await this.orderRepo.update(id, updates);
    if (!updated) throw AppError.notFound('Pedido no encontrado para actualizar');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.orderRepo.delete(id);
    if (!deleted) throw AppError.notFound('Pedido no encontrado para eliminar');
  }
}
