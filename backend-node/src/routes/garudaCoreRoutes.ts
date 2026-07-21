import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/garudaCoreController';

const router = Router();
router.use(requireAuth);
router.get('/status', ctrl.status);
router.get('/revenue', ctrl.revenue);
router.get('/settlements', ctrl.settlements);
router.get('/income-goals', ctrl.incomeGoals);
router.post('/income-goals/preview', ctrl.previewMission);
router.post('/income-goals', ctrl.startMission);

export default router;
