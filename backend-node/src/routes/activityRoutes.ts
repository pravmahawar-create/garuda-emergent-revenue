import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listActivity } from '../controllers/activityController';

const r = Router();
r.use(requireAuth);
r.get('/', listActivity);
export default r;
