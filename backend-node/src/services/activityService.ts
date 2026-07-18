import { Types } from 'mongoose';
import { ActivityModel, ActivityType } from '../models/Activity';

export async function logActivity(params: {
  ownerId: Types.ObjectId | string;
  type: ActivityType;
  title: string;
  description?: string;
  entityType?: 'opportunity' | 'task' | 'revenue' | 'user';
  entityId?: Types.ObjectId | string;
  meta?: Record<string, unknown>;
}) {
  await ActivityModel.create({
    ownerId: new Types.ObjectId(String(params.ownerId)),
    type: params.type,
    title: params.title,
    description: params.description,
    entityType: params.entityType,
    entityId: params.entityId ? new Types.ObjectId(String(params.entityId)) : undefined,
    meta: params.meta,
  });
}
