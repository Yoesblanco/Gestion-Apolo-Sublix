import { IUserRepository } from '../domain/user.repository.interface';
import { UserWithoutPassword } from '../domain/user.entity';
import { PasswordHasher } from '../../../shared/utils/password';
import { AppError } from '../../../shared/errors/app-error';

export interface UpdateProfileDTO {
  id: string;
  name?: string;
  email?: string;
  username?: string;
  password?: string;
}

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: UpdateProfileDTO): Promise<UserWithoutPassword> {
    const user = await this.userRepository.findById(dto.id);
    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing && existing.id !== dto.id) {
        throw AppError.conflict('El correo electrónico ya está en uso');
      }
    }

    const updates: Record<string, unknown> = {};
    if (dto.name) updates.name = dto.name;
    if (dto.email) updates.email = dto.email;
    if (dto.username) updates.username = dto.username;
    if (dto.password) {
      updates.password = await PasswordHasher.hash(dto.password);
    }

    const updated = await this.userRepository.update(dto.id, updates);
    if (!updated) {
      throw AppError.internal('No se pudo actualizar el perfil');
    }

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      username: updated.username || null,
      role: updated.role,
    };
  }
}
