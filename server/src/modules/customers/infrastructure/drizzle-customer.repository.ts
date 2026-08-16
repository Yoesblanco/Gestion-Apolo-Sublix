import { eq, notInArray } from 'drizzle-orm';
import { db } from '../../../config/database';
import { customers } from '../../../db/schema/customers';
import { ICustomerRepository, CustomerEntity } from '../domain/customer.entity';

export class DrizzleCustomerRepository implements ICustomerRepository {
  async findAll(): Promise<CustomerEntity[]> {
    const list = await db.select().from(customers);
    return list.map(this.mapToEntity);
  }

  async findById(id: string): Promise<CustomerEntity | null> {
    const [item] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return item ? this.mapToEntity(item) : null;
  }

  async create(customer: CustomerEntity): Promise<CustomerEntity> {
    const [inserted] = await db
      .insert(customers)
      .values({
        id: customer.id,
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone || null,
        city: customer.city || null,
        address: customer.address || null,
        notes: customer.notes || null,
      })
      .returning();

    return this.mapToEntity(inserted);
  }

  async update(id: string, updates: Partial<CustomerEntity>): Promise<CustomerEntity | null> {
    const [updated] = await db
      .update(customers)
      .set({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.email !== undefined && { email: updates.email }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.city !== undefined && { city: updates.city }),
        ...(updates.address !== undefined && { address: updates.address }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    return updated ? this.mapToEntity(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  async upsertMany(items: CustomerEntity[]): Promise<void> {
    if (items.length === 0) return;
    for (const item of items) {
      await db
        .insert(customers)
        .values({
          id: item.id,
          name: item.name,
          email: item.email || null,
          phone: item.phone || null,
          city: item.city || null,
          address: item.address || null,
          notes: item.notes || null,
        })
        .onConflictDoUpdate({
          target: customers.id,
          set: {
            name: item.name,
            email: item.email || null,
            phone: item.phone || null,
            city: item.city || null,
            address: item.address || null,
            notes: item.notes || null,
            updatedAt: new Date(),
          },
        });
    }
  }

  async replaceAll(items: CustomerEntity[]): Promise<void> {
    if (items.length === 0) {
      await db.delete(customers);
      return;
    }
    const ids = items.map((i) => i.id);
    await db.delete(customers).where(notInArray(customers.id, ids));
    await this.upsertMany(items);
  }

  private mapToEntity(row: typeof customers.$inferSelect): CustomerEntity {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      city: row.city,
      address: row.address,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
