import { IUserRepository } from '../domain/user.repository.interface';
import { UserWithoutPassword } from '../domain/user.entity';
import { PasswordHasher } from '../../../shared/utils/password';
import { AppError } from '../../../shared/errors/app-error';

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  username?: string;
  role?: string;
}

export class RegisterUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: RegisterDTO): Promise<UserWithoutPassword> {
    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw AppError.conflict('El correo electrónico ya está registrado');
    }

    if (dto.username) {
      const existingUsername = await this.userRepository.findByIdentifier(dto.username);
      if (existingUsername) {
        throw AppError.conflict('El nombre de usuario ya está en uso');
      }
    }

    const hashedPassword = await PasswordHasher.hash(dto.password);
    const userId = Date.now().toString();

    const created = await this.userRepository.create({
      id: userId,
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      username: dto.username || null,
      role: dto.role || 'Administrador',
    });

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      username: created.username || null,
      role: created.role,
    };
  }
}
