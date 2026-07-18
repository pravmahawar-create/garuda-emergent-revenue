import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import * as ctrl from '../controllers/taskController';

const r = Router();
r.use(requireAuth);
r.get('/', ctrl.listTasks);
r.post('/', validateBody(ctrl.createTaskSchema), ctrl.createTask);
r.patch('/:id', validateBody(ctrl.updateTaskSchema), ctrl.updateTask);
r.delete('/:id', ctrl.deleteTask);
export default r;
