import { Request, Response } from 'express';
import { NotificationModel } from '../models/Notification';
import { NotFound } from '../utils/errors';

export async function listNotifications(req: Request, res: Response) {
  const items = await NotificationModel.find({ ownerId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(items.map((i) => i.toJSON()));
}

export async function markRead(req: Request, res: Response) {
  const n = await NotificationModel.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user!._id },
    { $set: { read: true } },
    { new: true },
  );
  if (!n) throw NotFound('Notification not found');
  res.json(n.toJSON());
}

export async function markAllRead(req: Request, res: Response) {
  await NotificationModel.updateMany({ ownerId: req.user!._id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
}
