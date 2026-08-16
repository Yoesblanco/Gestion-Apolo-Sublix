import { UserEntity } from './user.entity';

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByIdentifier(identifier: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(user: Omit<UserEntity, 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null>;
}
