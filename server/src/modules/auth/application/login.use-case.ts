import jwt from 'jsonwebtoken';
import { IUserRepository } from '../domain/user.repository.interface';
import { AuthTokens } from '../domain/user.entity';
import { PasswordHasher } from '../../../shared/utils/password';
import { AppError } from '../../../shared/errors/app-error';
import { env } from '../../../config/env';

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(identifier: string, password: string): Promise<AuthTokens> {
    if (!identifier || !password) {
      throw AppError.badRequest('Identificador y contraseña requeridos');
    }

    const user = await this.userRepository.findByIdentifier(identifier);
    if (!user || !user.password) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const isMatch = await PasswordHasher.compare(password, user.password);
    if (!isMatch) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as unknown as number }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username || 'admin',
        role: user.role || 'Administrador',
      },
    };
  }
}
