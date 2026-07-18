import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URL, {
    dbName: env.DB_NAME,
    serverSelectionTimeoutMS: 8000,
  });
  console.log(`[db] Connected to MongoDB (${env.DB_NAME})`);
}
