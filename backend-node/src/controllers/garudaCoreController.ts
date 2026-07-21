import { Request, Response } from 'express';
import { getCoreStatus, listCoreRevenue, listCoreSettlements, listIncomeGoals, previewIncomeGoal, startIncomeGoal } from '../integrations/garudaCore';
import { ApiError } from '../utils/errors';

export async function status(_req: Request, res: Response) {
  res.json(await getCoreStatus());
}

export async function revenue(_req: Request, res: Response) {
  res.json(await listCoreRevenue());
}

export async function settlements(_req: Request, res: Response) {
  res.json(await listCoreSettlements());
}

export async function incomeGoals(_req: Request, res: Response) {
  res.json(await listIncomeGoals());
}

export async function previewMission(req: Request, res: Response) {
  res.json(await previewIncomeGoal(req.body || {}));
}

export async function startMission(req: Request, res: Response) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED');
  if (req.body?.founderApproved !== true) throw new ApiError(400, 'Confirm founder approval before starting the mission', 'APPROVAL_CONFIRMATION_REQUIRED');
  const { founderApproved: _confirmation, ...payload } = req.body || {};
  res.status(201).json(await startIncomeGoal(payload));
}
