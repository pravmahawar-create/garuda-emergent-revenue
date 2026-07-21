import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import opportunityRoutes from './opportunityRoutes';
import taskRoutes from './taskRoutes';
import revenueRoutes from './revenueRoutes';
import activityRoutes from './activityRoutes';
import notificationRoutes from './notificationRoutes';
import settingsRoutes from './settingsRoutes';
import garudaCoreRoutes from './garudaCoreRoutes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'garuda-node' }));

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/tasks', taskRoutes);
router.use('/revenue', revenueRoutes);
router.use('/activity', activityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/garuda-core', garudaCoreRoutes);

export default router;
