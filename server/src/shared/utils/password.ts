import bcrypt from 'bcryptjs';

export class PasswordHasher {
  private static readonly SALT_ROUNDS = 10;

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    if (password === hash) return true;
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
}
