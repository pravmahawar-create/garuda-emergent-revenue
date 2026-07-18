import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import * as ctrl from '../controllers/settingsController';

const r = Router();
r.use(requireAuth);
r.patch('/profile', validateBody(ctrl.updateProfileSchema), ctrl.updateProfile);
r.post('/change-password', validateBody(ctrl.changePasswordSchema), ctrl.changePassword);
export default r;
