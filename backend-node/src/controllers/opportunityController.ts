import { Request, Response } from 'express';
import { z } from 'zod';
import { OpportunityModel, OPP_STAGES } from '../models/Opportunity';
import { NotFound } from '../utils/errors';
import { logActivity } from '../services/activityService';

const baseSchema = {
  title: z.string().min(1),
  client: z.string().min(1),
  source: z.string().optional(),
  stage: z.enum(OPP_STAGES).optional(),
  potentialValue: z.number().min(0),
  currency: z.string().length(3).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
};
export const createOpportunitySchema = z.object(baseSchema);
export const updateOpportunitySchema = z
  .object({
    ...baseSchema,
    title: baseSchema.title.optional(),
    client: baseSchema.client.optional(),
    potentialValue: baseSchema.potentialValue.optional(),
  })
  .partial();

export async function listOpportunities(req: Request, res: Response) {
  const { stage } = req.query;
  const filter: Record<string, unknown> = { ownerId: req.user!._id };
  if (typeof stage === 'string' && (OPP_STAGES as readonly string[]).includes(stage)) {
    filter.stage = stage;
  }
  const items = await OpportunityModel.find(filter).sort({ updatedAt: -1 });
  res.json(items.map((i) => i.toJSON()));
}

export async function getOpportunity(req: Request, res: Response) {
  const item = await OpportunityModel.findOne({ _id: req.params.id, ownerId: req.user!._id });
  if (!item) throw NotFound('Opportunity not found');
  res.json(item.toJSON());
}

export async function createOpportunity(req: Request, res: Response) {
  const body = req.body as z.infer<typeof createOpportunitySchema>;
  const opp = await OpportunityModel.create({
    ...body,
    expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : undefined,
    ownerId: req.user!._id,
  });
  await logActivity({
    ownerId: req.user!._id,
    type: 'opportunity_created',
    title: `Created opportunity ${opp.title}`,
    entityType: 'opportunity',
    entityId: opp._id,
  });
  res.status(201).json(opp.toJSON());
}

export async function updateOpportunity(req: Request, res: Response) {
  const body = req.body as z.infer<typeof updateOpportunitySchema>;
  const existing = await OpportunityModel.findOne({ _id: req.params.id, ownerId: req.user!._id });
  if (!existing) throw NotFound('Opportunity not found');

  const stageChanged = body.stage && body.stage !== existing.stage;
  const prevStage = existing.stage;
  Object.assign(existing, {
    ...body,
    expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : existing.expectedCloseDate,
  });
  await existing.save();

  await logActivity({
    ownerId: req.user!._id,
    type: stageChanged ? 'opportunity_stage_changed' : 'opportunity_updated',
    title: stageChanged
      ? `${existing.title} moved to ${existing.stage}`
      : `Updated ${existing.title}`,
    entityType: 'opportunity',
    entityId: existing._id,
    meta: stageChanged ? { from: prevStage, to: existing.stage } : undefined,
  });
  res.json(existing.toJSON());
}

export async function deleteOpportunity(req: Request, res: Response) {
  const existing = await OpportunityModel.findOneAndDelete({ _id: req.params.id, ownerId: req.user!._id });
  if (!existing) throw NotFound('Opportunity not found');
  await logActivity({
    ownerId: req.user!._id,
    type: 'opportunity_deleted',
    title: `Deleted opportunity ${existing.title}`,
    entityType: 'opportunity',
    entityId: existing._id,
  });
  res.json({ ok: true });
}
