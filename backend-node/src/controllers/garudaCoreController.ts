import { Request, Response } from 'express';
import { createExecutionMission as createCoreExecutionMission, decideDiscoveryCandidate, getCoreStatus, listCoreRevenue, listCoreSettlements, listDiscoveryCandidates, listExecutionMissions as listCoreExecutionMissions, listIncomeGoals, previewIncomeGoal, startIncomeGoal } from '../integrations/garudaCore';
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

export async function discoveryCandidates(req: Request, res: Response) {
  res.json(await listDiscoveryCandidates(String(req.query.status || 'ranked')));
}

export async function decideCandidate(req: Request, res: Response) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED');
  if (req.body?.founderApproved !== true) throw new ApiError(400, 'Confirm founder approval before deciding', 'APPROVAL_CONFIRMATION_REQUIRED');
  if (!['approved', 'dismissed'].includes(req.body?.status)) throw new ApiError(400, 'Decision must be approved or dismissed', 'INVALID_DECISION');
  res.json(await decideDiscoveryCandidate(req.params.id, req.body.status));
}

export async function executionMissions(_req: Request, res: Response) {
  res.json(await listCoreExecutionMissions());
}

export async function createExecutionMission(req: Request, res: Response) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED');
  if (req.body?.founderApproved !== true) throw new ApiError(400, 'Confirm founder approval before creating the execution mission', 'APPROVAL_CONFIRMATION_REQUIRED');
  res.status(201).json(await createCoreExecutionMission(req.params.id));
}
