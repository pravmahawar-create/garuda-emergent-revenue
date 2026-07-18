import { Schema, model, HydratedDocument, Types } from 'mongoose';

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'operator';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDoc = HydratedDocument<IUser>;

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
    avatarUrl: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

export const UserModel = model<IUser>('User', UserSchema);
export type UserId = Types.ObjectId;
