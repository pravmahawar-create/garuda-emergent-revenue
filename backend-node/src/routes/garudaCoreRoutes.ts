import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/garudaCoreController';

const router = Router();
router.use(requireAuth);
router.get('/status', ctrl.status);
router.get('/revenue', ctrl.revenue);
router.get('/settlements', ctrl.settlements);

export default router;
