import { Schema, model, HydratedDocument, Types } from 'mongoose';

export const TASK_STATUS = ['todo', 'in_progress', 'done', 'archived'] as const;
export const TASK_PRIORITY = ['low', 'medium', 'high', 'critical'] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];
export type TaskPriority = (typeof TASK_PRIORITY)[number];

export interface ITask {
  ownerId: Types.ObjectId;
  opportunityId?: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskDoc = HydratedDocument<ITask>;

const TaskSchema = new Schema<ITask>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: { type: String, enum: TASK_STATUS, default: 'todo', index: true },
    priority: { type: String, enum: TASK_PRIORITY, default: 'medium' },
    dueDate: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = String(ret._id);
        ret.ownerId = String(ret.ownerId);
        if (ret.opportunityId) ret.opportunityId = String(ret.opportunityId);
        delete ret._id;
        return ret;
      },
    },
  },
);

export const TaskModel = model<ITask>('Task', TaskSchema);
