import { IToBuyRepository, ToBuyEntity, ToBuyHistoryEntity } from '../domain/to-buy.entity';
import { AppError } from '../../../shared/errors/app-error';

export class ToBuyUseCases {
  constructor(private readonly repo: IToBuyRepository) {}

  async getAllToBuy(): Promise<ToBuyEntity[]> {
    return this.repo.findAllToBuy();
  }

  async getAllHistory(): Promise<ToBuyHistoryEntity[]> {
    return this.repo.findAllHistory();
  }

  async createToBuy(item: ToBuyEntity): Promise<ToBuyEntity> {
    return this.repo.createToBuy(item);
  }

  async createHistory(item: ToBuyHistoryEntity): Promise<ToBuyHistoryEntity> {
    return this.repo.createHistory(item);
  }

  async deleteToBuy(id: string): Promise<void> {
    const deleted = await this.repo.deleteToBuy(id);
    if (!deleted) throw AppError.notFound('Elemento de compra no encontrado');
  }

  async deleteHistory(id: string): Promise<void> {
    const deleted = await this.repo.deleteHistory(id);
    if (!deleted) throw AppError.notFound('Historial de compra no encontrado');
  }
}
