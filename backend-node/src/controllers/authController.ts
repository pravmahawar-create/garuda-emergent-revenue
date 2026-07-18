import { Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/User';
import { hashPassword, verifyPassword } from '../services/authService';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { BadRequest, Conflict, Unauthorized } from '../utils/errors';
import { logActivity } from '../services/activityService';

const emailPassSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = emailPassSchema.extend({
  name: z.string().min(1),
});

export const loginSchema = emailPassSchema;

function setAuthCookies(res: Response, access: string, refresh: string) {
  res.cookie('access_token', access, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  res.cookie('refresh_token', refresh, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body as z.infer<typeof registerSchema>;
  const normalized = email.toLowerCase().trim();
  const existing = await UserModel.findOne({ email: normalized });
  if (existing) throw Conflict('Email already registered');

  const user = await UserModel.create({
    email: normalized,
    name,
    role: 'operator',
    passwordHash: await hashPassword(password),
  });

  setAuthCookies(res, signAccessToken(String(user._id), user.email), signRefreshToken(String(user._id)));
  await logActivity({
    ownerId: user._id,
    type: 'user_register',
    title: `Registered as ${user.name}`,
    entityType: 'user',
    entityId: user._id,
  });
  res.status(201).json(user.toJSON());
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw Unauthorized('Invalid credentials');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw Unauthorized('Invalid credentials');

  setAuthCookies(res, signAccessToken(String(user._id), user.email), signRefreshToken(String(user._id)));
  await logActivity({
    ownerId: user._id,
    type: 'user_login',
    title: `${user.name} signed in`,
    entityType: 'user',
    entityId: user._id,
  });
  res.json(user.toJSON());
}

export async function me(req: Request, res: Response) {
  res.json(req.user!.toJSON());
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.json({ ok: true });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refresh_token;
  if (!token) throw Unauthorized('No refresh token');
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw Unauthorized('Invalid refresh token');
  }
  const user = await UserModel.findById(payload.sub);
  if (!user) throw Unauthorized('User not found');
  const access = signAccessToken(String(user._id), user.email);
  res.cookie('access_token', access, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  res.json({ ok: true });
}
