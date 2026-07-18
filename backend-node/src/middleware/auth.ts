import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { Unauthorized } from '../utils/errors';
import { UserModel, UserDoc } from '../models/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDoc;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    let token: string | undefined = req.cookies?.access_token;
    if (!token) {
      const h = req.headers.authorization;
      if (h?.startsWith('Bearer ')) token = h.slice(7);
    }
    if (!token) throw Unauthorized('Not authenticated');

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw Unauthorized('Invalid or expired token');
    }

    const user = await UserModel.findById(payload.sub);
    if (!user) throw Unauthorized('User not found');
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
