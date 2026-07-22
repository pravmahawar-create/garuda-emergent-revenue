import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';

import { env } from './config/env';
import { connectDB } from './config/db';
import { seedAdmin } from './services/authService';
import { purgeLegacyDemoData, seedDemoData } from './services/seedService';
import router from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

async function bootstrap() {
  await connectDB();
  await seedAdmin();
  await purgeLegacyDemoData();
  if (process.env.ENABLE_DEMO_DATA === 'true') await seedDemoData();

  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(morgan('tiny'));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(env.NODE_PORT, '127.0.0.1', () => {
    console.log(`[garuda-node] Listening on 127.0.0.1:${env.NODE_PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
