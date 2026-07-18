import { Schema, model, HydratedDocument, Types } from 'mongoose';

export const ACTIVITY_TYPES = [
  'opportunity_created',
  'opportunity_updated',
  'opportunity_stage_changed',
  'opportunity_deleted',
  'task_created',
  'task_updated',
  'task_completed',
  'task_deleted',
  'revenue_recorded',
  'revenue_updated',
  'revenue_deleted',
  'user_login',
  'user_register',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface IActivity {
  ownerId: Types.ObjectId;
  type: ActivityType;
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
  entityType?: 'opportunity' | 'task' | 'revenue' | 'user';
  entityId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityDoc = HydratedDocument<IActivity>;

const ActivitySchema = new Schema<IActivity>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    meta: { type: Schema.Types.Mixed },
    entityType: { type: String, enum: ['opportunity', 'task', 'revenue', 'user'] },
    entityId: { type: Schema.Types.ObjectId },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = String(ret._id);
        ret.ownerId = String(ret.ownerId);
        if (ret.entityId) ret.entityId = String(ret.entityId);
        delete ret._id;
        return ret;
      },
    },
  },
);

ActivitySchema.index({ ownerId: 1, createdAt: -1 });

export const ActivityModel = model<IActivity>('Activity', ActivitySchema);
