import { Request, Response } from 'express';
import { z } from 'zod';
import { TaskModel, TASK_STATUS, TASK_PRIORITY } from '../models/Task';
import { NotFound } from '../utils/errors';
import { logActivity } from '../services/activityService';

const base = {
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  dueDate: z.string().datetime().optional(),
  opportunityId: z.string().optional(),
};
export const createTaskSchema = z.object(base);
export const updateTaskSchema = z.object(base).partial();

export async function listTasks(req: Request, res: Response) {
  const { status, opportunityId } = req.query;
  const filter: Record<string, unknown> = { ownerId: req.user!._id };
  if (typeof status === 'string' && (TASK_STATUS as readonly string[]).includes(status)) {
    filter.status = status;
  }
  if (typeof opportunityId === 'string') filter.opportunityId = opportunityId;
  const items = await TaskModel.find(filter).sort({ createdAt: -1 });
  res.json(items.map((i) => i.toJSON()));
}

export async function createTask(req: Request, res: Response) {
  const body = req.body as z.infer<typeof createTaskSchema>;
  const task = await TaskModel.create({
    ...body,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    ownerId: req.user!._id,
  });
  await logActivity({
    ownerId: req.user!._id,
    type: 'task_created',
    title: `Created task: ${task.title}`,
    entityType: 'task',
    entityId: task._id,
  });
  res.status(201).json(task.toJSON());
}

export async function updateTask(req: Request, res: Response) {
  const body = req.body as z.infer<typeof updateTaskSchema>;
  const existing = await TaskModel.findOne({ _id: req.params.id, ownerId: req.user!._id });
  if (!existing) throw NotFound('Task not found');

  const completing = body.status === 'done' && existing.status !== 'done';
  Object.assign(existing, {
    ...body,
    dueDate: body.dueDate ? new Date(body.dueDate) : existing.dueDate,
    completedAt: completing ? new Date() : existing.completedAt,
  });
  await existing.save();

  await logActivity({
    ownerId: req.user!._id,
    type: completing ? 'task_completed' : 'task_updated',
    title: completing ? `Completed: ${existing.title}` : `Updated task: ${existing.title}`,
    entityType: 'task',
    entityId: existing._id,
  });
  res.json(existing.toJSON());
}

export async function deleteTask(req: Request, res: Response) {
  const existing = await TaskModel.findOneAndDelete({ _id: req.params.id, ownerId: req.user!._id });
  if (!existing) throw NotFound('Task not found');
  await logActivity({
    ownerId: req.user!._id,
    type: 'task_deleted',
    title: `Deleted task: ${existing.title}`,
    entityType: 'task',
    entityId: existing._id,
  });
  res.json({ ok: true });
}
