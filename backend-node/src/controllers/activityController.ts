import { Request, Response } from 'express';
import { ActivityModel } from '../models/Activity';

export async function listActivity(req: Request, res: Response) {
  const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 200);
  const items = await ActivityModel.find({ ownerId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json(items.map((i) => i.toJSON()));
}
