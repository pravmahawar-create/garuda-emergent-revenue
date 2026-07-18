import { Request, Response } from 'express';
import { z } from 'zod';
import { RevenueRecordModel, REVENUE_STATUS } from '../models/RevenueRecord';
import { NotFound } from '../utils/errors';
import { logActivity } from '../services/activityService';

const base = {
  amount: z.number().min(0),
  currency: z.string().length(3).optional(),
  source: z.string().optional(),
  client: z.string().min(1),
  status: z.enum(REVENUE_STATUS).optional(),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  opportunityId: z.string().optional(),
};
export const createRevenueSchema = z.object(base);
export const updateRevenueSchema = z
  .object({
    ...base,
    amount: base.amount.optional(),
    client: base.client.optional(),
  })
  .partial();

export async function listRevenue(req: Request, res: Response) {
  const items = await RevenueRecordModel.find({ ownerId: req.user!._id }).sort({ recordedAt: -1 });
  res.json(items.map((i) => i.toJSON()));
}

export async function createRevenue(req: Request, res: Response) {
  const body = req.body as z.infer<typeof createRevenueSchema>;
  const item = await RevenueRecordModel.create({
    ...body,
    recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
    ownerId: req.user!._id,
  });
  await logActivity({
    ownerId: req.user!._id,
    type: 'revenue_recorded',
    title: `Recorded ${item.currency} ${item.amount.toLocaleString()} from ${item.client}`,
    entityType: 'revenue',
    entityId: item._id,
  });
  res.status(201).json(item.toJSON());
}

export async function updateRevenue(req: Request, res: Response) {
  const body = req.body as z.infer<typeof updateRevenueSchema>;
  const existing = await RevenueRecordModel.findOne({ _id: req.params.id, ownerId: req.user!._id });
  if (!existing) throw NotFound('Revenue record not found');
  Object.assign(existing, {
    ...body,
    recordedAt: body.recordedAt ? new Date(body.recordedAt) : existing.recordedAt,
  });
  await existing.save();
  await logActivity({
    ownerId: req.user!._id,
    type: 'revenue_updated',
    title: `Updated revenue record for ${existing.client}`,
    entityType: 'revenue',
    entityId: existing._id,
  });
  res.json(existing.toJSON());
}

export async function deleteRevenue(req: Request, res: Response) {
  const existing = await RevenueRecordModel.findOneAndDelete({ _id: req.params.id, ownerId: req.user!._id });
  if (!existing) throw NotFound('Revenue record not found');
  await logActivity({
    ownerId: req.user!._id,
    type: 'revenue_deleted',
    title: `Deleted revenue record for ${existing.client}`,
    entityType: 'revenue',
    entityId: existing._id,
  });
  res.json({ ok: true });
}
