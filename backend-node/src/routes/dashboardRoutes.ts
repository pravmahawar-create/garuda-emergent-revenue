import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getDashboardSummary, getRevenueAnalytics } from '../controllers/dashboardController';

const r = Router();
r.use(requireAuth);
r.get('/summary', getDashboardSummary);
r.get('/revenue-analytics', getRevenueAnalytics);
export default r;
