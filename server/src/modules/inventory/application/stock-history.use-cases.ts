import { IStockHistoryRepository, StockHistoryEntity } from '../domain/stock-history.entity';
import { AppError } from '../../../shared/errors/app-error';

export class StockHistoryUseCases {
  constructor(private readonly repo: IStockHistoryRepository) {}

  async getAll(): Promise<StockHistoryEntity[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<StockHistoryEntity> {
    const item = await this.repo.findById(id);
    if (!item) throw AppError.notFound('Historial de stock no encontrado');
    return item;
  }

  async create(item: StockHistoryEntity): Promise<StockHistoryEntity> {
    return this.repo.create(item);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw AppError.notFound('Historial de stock no encontrado para eliminar');
  }
}
