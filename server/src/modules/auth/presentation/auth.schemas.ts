import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'El usuario o correo es obligatorio'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('El correo electrónico no es válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    username: z.string().optional(),
    role: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    id: z.string().min(1, 'El ID es obligatorio'),
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    username: z.string().optional(),
    password: z.string().min(6).optional(),
  }),
});
