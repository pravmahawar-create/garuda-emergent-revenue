import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { env } from '../config/env';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Idempotent admin seed. Creates the admin user if missing; if the .env password
 * changed, updates the hash. Never throws on repeat calls.
 */
export async function seedAdmin() {
  const email = env.ADMIN_EMAIL.toLowerCase().trim();
  const existing = await UserModel.findOne({ email });
  if (!existing) {
    await UserModel.create({
      email,
      name: env.ADMIN_NAME,
      role: 'admin',
      passwordHash: await hashPassword(env.ADMIN_PASSWORD),
    });
    console.log(`[seed] Created admin user ${email}`);
    return;
  }
  const stillValid = await verifyPassword(env.ADMIN_PASSWORD, existing.passwordHash);
  if (!stillValid) {
    existing.passwordHash = await hashPassword(env.ADMIN_PASSWORD);
    await existing.save();
    console.log(`[seed] Rotated admin password for ${email}`);
  }
}
