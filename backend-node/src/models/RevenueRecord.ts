import { Schema, model, HydratedDocument, Types } from 'mongoose';

export const REVENUE_STATUS = ['pending', 'received', 'refunded'] as const;
export type RevenueStatus = (typeof REVENUE_STATUS)[number];

export interface IRevenueRecord {
  ownerId: Types.ObjectId;
  opportunityId?: Types.ObjectId;
  amount: number;
  currency: string;
  source: string;
  client: string;
  status: RevenueStatus;
  recordedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RevenueRecordDoc = HydratedDocument<IRevenueRecord>;

const RevenueRecordSchema = new Schema<IRevenueRecord>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    source: { type: String, default: 'direct' },
    client: { type: String, required: true, trim: true },
    status: { type: String, enum: REVENUE_STATUS, default: 'received' },
    recordedAt: { type: Date, default: () => new Date(), index: true },
    notes: { type: String },
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

export const RevenueRecordModel = model<IRevenueRecord>('RevenueRecord', RevenueRecordSchema);
