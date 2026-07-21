import dotenv from 'dotenv';
import path from 'path';

// Load /app/backend/.env (shared with FastAPI shell so MONGO_URL / DB_NAME stay singular)
dotenv.config({ path: path.resolve(__dirname, '../../../backend/.env') });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  NODE_PORT: parseInt(process.env.NODE_PORT || '4001', 10),
  MONGO_URL: required('MONGO_URL'),
  DB_NAME: required('DB_NAME'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || '15m',
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL || '7d',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@garuda.ai',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Garuda@2026',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Garuda Operator',
  NODE_ENV: process.env.NODE_ENV || 'development',
  GARUDA_CORE_URL: (process.env.GARUDA_CORE_URL || 'http://127.0.0.1:3000').replace(/\/$/, ''),
};
