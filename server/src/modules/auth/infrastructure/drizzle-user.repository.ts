import { eq, or, ilike } from 'drizzle-orm';
import { db } from '../../../config/database';
import { users } from '../../../db/schema/users';
import { IUserRepository } from '../domain/user.repository.interface';
import { UserEntity } from '../domain/user.entity';

export class DrizzleUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    return result[0] ? (result[0] as UserEntity) : null;
  }

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    const cleanId = identifier.trim();
    const result = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, cleanId.toLowerCase()),
          ilike(users.name, cleanId),
          ilike(users.username, cleanId)
        )
      )
      .limit(1);

    return result[0] ? (result[0] as UserEntity) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ? (result[0] as UserEntity) : null;
  }

  async create(user: Omit<UserEntity, 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const [inserted] = await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email.toLowerCase().trim(),
        password: user.password!,
        name: user.name,
        username: user.username || null,
        role: user.role || 'Administrador',
      })
      .returning();

    return inserted as UserEntity;
  }

  async update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) updateValues.name = updates.name;
    if (updates.email !== undefined) updateValues.email = updates.email.toLowerCase().trim();
    if (updates.username !== undefined) updateValues.username = updates.username;
    if (updates.password !== undefined) updateValues.password = updates.password;
    if (updates.role !== undefined) updateValues.role = updates.role;

    const [updated] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, id))
      .returning();

    return updated ? (updated as UserEntity) : null;
  }
}
