import { Router } from 'express';
import * as ctrl from '../controllers/authController';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const r = Router();
r.post('/register', validateBody(ctrl.registerSchema), ctrl.register);
r.post('/login', validateBody(ctrl.loginSchema), ctrl.login);
r.post('/logout', ctrl.logout);
r.post('/refresh', ctrl.refresh);
r.get('/me', requireAuth, ctrl.me);
export default r;
