import { Router } from 'express';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../application/login.use-case';
import { RegisterUseCase } from '../application/register.use-case';
import { UpdateProfileUseCase } from '../application/update-profile.use-case';
import { DrizzleUserRepository } from '../infrastructure/drizzle-user.repository';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { loginSchema, registerSchema, updateProfileSchema } from './auth.schemas';
import { authLimiter } from '../../../shared/middlewares/rate-limiter';
import { authenticateToken } from '../../../shared/middlewares/auth.middleware';

const authRouter = Router();

const userRepository = new DrizzleUserRepository();
const loginUseCase = new LoginUseCase(userRepository);
const registerUseCase = new RegisterUseCase(userRepository);
const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

const authController = new AuthController(loginUseCase, registerUseCase, updateProfileUseCase);

authRouter.post('/login', authLimiter, validate(loginSchema), authController.login);
authRouter.post('/register', authLimiter, validate(registerSchema), authController.register);
authRouter.post('/update', validate(updateProfileSchema), authController.updateProfile);

export { authRouter };
