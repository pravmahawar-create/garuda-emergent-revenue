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
router.get('/discovery/candidates', ctrl.discoveryCandidates);
router.patch('/discovery/candidates/:id/decision', ctrl.decideCandidate);
router.get('/execution-missions', ctrl.executionMissions);
router.post('/discovery/candidates/:id/execution-mission', ctrl.createExecutionMission);
router.post('/execution-missions/:id/prepare', ctrl.prepareExecutionMission);
router.post('/execution-missions/:id/decision', ctrl.decideExecutionMission);
router.get('/execution-missions/:id/decisions', ctrl.executionMissionDecisions);
router.post('/execution-missions/:id/resubmit', ctrl.resubmitExecutionMission);
router.patch('/execution-missions/:id/tasks/:taskId', ctrl.transitionExecutionTask);
router.get('/execution-missions/:id/task-events', ctrl.executionTaskEvents);

export default router;
