import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/notificationController';

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listNotifications);
r.post('/read-all', ctrl.markAllRead);
r.post('/:id/read', ctrl.markRead);
export default r;
