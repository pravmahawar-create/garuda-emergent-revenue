import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessPayload {
  sub: string;
  email: string;
  type: 'access';
}

export interface RefreshPayload {
  sub: string;
  type: 'refresh';
}

export function signAccessToken(userId: string, email: string): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as any };
  return jwt.sign({ sub: userId, email, type: 'access' }, env.JWT_SECRET, opts);
}

export function signRefreshToken(userId: string): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as any };
  return jwt.sign({ sub: userId, type: 'refresh' }, env.JWT_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AccessPayload;
  if (decoded.type !== 'access') throw new Error('Invalid token type');
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as RefreshPayload;
  if (decoded.type !== 'refresh') throw new Error('Invalid token type');
  return decoded;
}
