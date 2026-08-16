import { Request, Response, NextFunction } from 'express';
import { LoginUseCase } from '../application/login.use-case';
import { RegisterUseCase } from '../application/register.use-case';
import { UpdateProfileUseCase } from '../application/update-profile.use-case';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase
  ) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { identifier, password } = req.body;
      const result = await this.loginUseCase.execute(identifier, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name, username, role } = req.body;
      const user = await this.registerUseCase.execute({ email, password, name, username, role });
      res.status(201).json({
        message: 'Usuario registrado con éxito',
        user,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, email, password, name, username } = req.body;
      const user = await this.updateProfileUseCase.execute({ id, email, password, name, username });
      res.status(200).json({
        message: 'Perfil actualizado con éxito',
        user,
      });
    } catch (error) {
      next(error);
    }
  };
}
