import { Schema, model, HydratedDocument, Types } from 'mongoose';

export const NOTIF_LEVELS = ['info', 'success', 'warning', 'critical'] as const;
export type NotifLevel = (typeof NOTIF_LEVELS)[number];

export interface INotification {
  ownerId: Types.ObjectId;
  title: string;
  body?: string;
  level: NotifLevel;
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDoc = HydratedDocument<INotification>;

const NotificationSchema = new Schema<INotification>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String },
    level: { type: String, enum: NOTIF_LEVELS, default: 'info' },
    read: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = String(ret._id);
        ret.ownerId = String(ret.ownerId);
        delete ret._id;
        return ret;
      },
    },
  },
);

NotificationSchema.index({ ownerId: 1, createdAt: -1 });

export const NotificationModel = model<INotification>('Notification', NotificationSchema);
