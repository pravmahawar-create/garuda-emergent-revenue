import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import * as ctrl from '../controllers/opportunityController';

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listOpportunities);
r.post('/', validateBody(ctrl.createOpportunitySchema), ctrl.createOpportunity);
r.get('/:id', ctrl.getOpportunity);
r.patch('/:id', validateBody(ctrl.updateOpportunitySchema), ctrl.updateOpportunity);
r.delete('/:id', ctrl.deleteOpportunity);
export default r;
