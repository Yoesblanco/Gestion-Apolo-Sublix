import { ITransactionRepository, TransactionEntity } from '../domain/transaction.entity';
import { AppError } from '../../../shared/errors/app-error';

export class TransactionUseCases {
  constructor(private readonly txRepo: ITransactionRepository) {}

  async getAll(): Promise<TransactionEntity[]> {
    return this.txRepo.findAll();
  }

  async getById(id: string): Promise<TransactionEntity> {
    const item = await this.txRepo.findById(id);
    if (!item) throw AppError.notFound('Transacción no encontrada');
    return item;
  }

  async create(tx: TransactionEntity): Promise<TransactionEntity> {
    return this.txRepo.create(tx);
  }

  async update(id: string, updates: Partial<TransactionEntity>): Promise<TransactionEntity> {
    const updated = await this.txRepo.update(id, updates);
    if (!updated) throw AppError.notFound('Transacción no encontrada para actualizar');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.txRepo.delete(id);
    if (!deleted) throw AppError.notFound('Transacción no encontrada para eliminar');
  }
}
