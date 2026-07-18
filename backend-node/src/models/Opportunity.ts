import { Schema, model, HydratedDocument, Types } from 'mongoose';

export const OPP_STAGES = [
  'prospect',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const;
export type OppStage = (typeof OPP_STAGES)[number];

export interface IOpportunity {
  ownerId: Types.ObjectId;
  title: string;
  client: string;
  source: string;
  stage: OppStage;
  potentialValue: number;
  currency: string;
  probability: number;
  expectedCloseDate?: Date;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type OpportunityDoc = HydratedDocument<IOpportunity>;

const OpportunitySchema = new Schema<IOpportunity>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    client: { type: String, required: true, trim: true },
    source: { type: String, default: 'direct' },
    stage: { type: String, enum: OPP_STAGES, default: 'prospect', index: true },
    potentialValue: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    probability: { type: Number, min: 0, max: 100, default: 25 },
    expectedCloseDate: { type: Date },
    notes: { type: String },
    tags: { type: [String], default: [] },
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

export const OpportunityModel = model<IOpportunity>('Opportunity', OpportunitySchema);
