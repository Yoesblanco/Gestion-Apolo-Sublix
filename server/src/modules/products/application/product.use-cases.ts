import { IProductRepository, ProductEntity } from '../domain/product.entity';
import { AppError } from '../../../shared/errors/app-error';

export class ProductUseCases {
  constructor(private readonly productRepo: IProductRepository) {}

  async getAll(): Promise<ProductEntity[]> {
    return this.productRepo.findAll();
  }

  async getById(id: string): Promise<ProductEntity> {
    const product = await this.productRepo.findById(id);
    if (!product) throw AppError.notFound('Producto no encontrado');
    return product;
  }

  async create(product: ProductEntity): Promise<ProductEntity> {
    return this.productRepo.create(product);
  }

  async update(id: string, updates: Partial<ProductEntity>): Promise<ProductEntity> {
    const updated = await this.productRepo.update(id, updates);
    if (!updated) throw AppError.notFound('Producto no encontrado para actualizar');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.productRepo.delete(id);
    if (!deleted) throw AppError.notFound('Producto no encontrado para eliminar');
  }
}
