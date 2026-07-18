import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import * as ctrl from '../controllers/revenueController';

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listRevenue);
r.post('/', validateBody(ctrl.createRevenueSchema), ctrl.createRevenue);
r.patch('/:id', validateBody(ctrl.updateRevenueSchema), ctrl.updateRevenue);
r.delete('/:id', ctrl.deleteRevenue);
export default r;
