import { db, pool } from '../config/database';
import { users } from './schema/users';
import { PasswordHasher } from '../shared/utils/password';
import { logger } from '../shared/utils/logger';
import { eq, or } from 'drizzle-orm';

export async function seedDatabase(): Promise<void> {
  logger.info('🌱 Ejecutando seed de usuarios por defecto...');

  try {
    const passwordHash = await PasswordHasher.hash('admin123');

    const defaultUsers = [
      {
        id: 'user-admin-default',
        email: 'admin@apolosublix.com',
        username: 'admin',
        name: 'Administrador Apolo',
        password: passwordHash,
        role: 'Administrador',
      },
      {
        id: 'user-cliente-default',
        email: 'cliente@apolosublix.com',
        username: 'cliente',
        name: 'Cliente Principal',
        password: passwordHash,
        role: 'Cliente',
      },
    ];

    for (const u of defaultUsers) {
      const existing = await db
        .select()
        .from(users)
        .where(or(eq(users.email, u.email), eq(users.username, u.username!)))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(users).values(u);
        logger.info(`✅ Usuario creado: ${u.username} (${u.role}) - Password: admin123`);
      } else {
        await db
          .update(users)
          .set({
            password: passwordHash,
            role: u.role,
            name: u.name,
            username: u.username,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing[0].id));
        logger.info(`🔄 Clave restablecida y usuario actualizado: ${u.username} (${u.role}) - Password: admin123`);
      }
    }

    logger.info('🌱 Seed completado exitosamente.');
  } catch (error) {
    logger.error({ err: error }, '❌ Error al ejecutar seed');
    throw error;
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
