import { Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/User';
import { hashPassword, verifyPassword } from '../services/authService';
import { BadRequest } from '../utils/errors';

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function updateProfile(req: Request, res: Response) {
  const body = req.body as z.infer<typeof updateProfileSchema>;
  const user = req.user!;
  if (body.name !== undefined) user.name = body.name;
  if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl || undefined;
  await user.save();
  res.json(user.toJSON());
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
  const user = await UserModel.findById(req.user!._id);
  if (!user) throw BadRequest('User not found');
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw BadRequest('Current password is incorrect');
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  res.json({ ok: true });
}
