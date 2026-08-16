import { eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '../../../config/database';
import { products } from '../../../db/schema/products';
import { IProductRepository, ProductEntity } from '../domain/product.entity';

export class DrizzleProductRepository implements IProductRepository {
  async findAll(): Promise<ProductEntity[]> {
    const list = await db.select().from(products);
    return list.map(this.mapToEntity);
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const [item] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return item ? this.mapToEntity(item) : null;
  }

  async create(product: ProductEntity): Promise<ProductEntity> {
    const [inserted] = await db
      .insert(products)
      .values({
        id: product.id,
        name: product.name,
        category: product.category || null,
        stock: product.stock,
        price: product.price,
        cost: product.cost || 0,
        minStock: product.minStock || 0,
        status: product.status || null,
      })
      .returning();

    return this.mapToEntity(inserted);
  }

  async update(id: string, updates: Partial<ProductEntity>): Promise<ProductEntity | null> {
    const [updated] = await db
      .update(products)
      .set({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.stock !== undefined && { stock: updates.stock }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.cost !== undefined && { cost: updates.cost }),
        ...(updates.minStock !== undefined && { minStock: updates.minStock }),
        ...(updates.status !== undefined && { status: updates.status }),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated ? this.mapToEntity(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async upsertMany(items: ProductEntity[]): Promise<void> {
    if (items.length === 0) return;
    for (const item of items) {
      await db
        .insert(products)
        .values({
          id: item.id,
          name: item.name,
          category: item.category || null,
          stock: item.stock,
          price: item.price,
          cost: item.cost || 0,
          minStock: item.minStock || 0,
          status: item.status || null,
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
            name: item.name,
            category: item.category || null,
            stock: item.stock,
            price: item.price,
            cost: item.cost || 0,
            minStock: item.minStock || 0,
            status: item.status || null,
            updatedAt: new Date(),
          },
        });
    }
  }

  async replaceAll(items: ProductEntity[]): Promise<void> {
    if (items.length === 0) {
      await db.delete(products);
      return;
    }
    const ids = items.map((i) => i.id);
    await db.delete(products).where(notInArray(products.id, ids));
    await this.upsertMany(items);
  }

  private mapToEntity(row: typeof products.$inferSelect): ProductEntity {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      stock: row.stock,
      price: row.price,
      cost: row.cost,
      minStock: row.minStock,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
