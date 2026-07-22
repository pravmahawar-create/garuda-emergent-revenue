import { Request, Response } from 'express';
import { completeExternalActionRequest as completeCoreExternalActionRequest, createExecutionMission as createCoreExecutionMission, createExternalActionRequest as createCoreExternalActionRequest, decideDiscoveryCandidate, decideExecutionMission as decideCoreExecutionMission, decideExternalActionRequest as decideCoreExternalActionRequest, getCoreStatus, getRevenueMvpReadiness as getCoreRevenueMvpReadiness, listAutonomousTaskRuns as listCoreAutonomousTaskRuns, listCoreRevenue, listCoreSettlements, listDiscoveryCandidates, listExecutionMissionDecisions as listCoreExecutionMissionDecisions, listExecutionMissions as listCoreExecutionMissions, listExecutionTaskEvents as listCoreExecutionTaskEvents, listExternalActionRequests as listCoreExternalActionRequests, listIncomeGoals, prepareExecutionMission as prepareCoreExecutionMission, previewIncomeGoal, resubmitExecutionMission as resubmitCoreExecutionMission, runAutonomousExecutionTask as runCoreAutonomousExecutionTask, startIncomeGoal, transitionExecutionTask as transitionCoreExecutionTask } from '../integrations/garudaCore';
import { ApiError } from '../utils/errors';
import { dispatchExternalAction as dispatchCoreExternalAction, listConnectorDispatches as listCoreConnectorDispatches, listRevenueConnectors as listCoreRevenueConnectors } from '../integrations/garudaCore';
import { getDeploymentReadiness as getCoreDeploymentReadiness, listPilotLedger as listCorePilotLedger, recordVerifiedEarning as recordCoreVerifiedEarning } from '../integrations/garudaCore';
import { getRazorpayTestReadiness as getCoreRazorpayTestReadiness, prepareRazorpayTestLink as prepareCoreRazorpayTestLink, runAutonomousExecutionMission as runCoreAutonomousExecutionMission } from '../integrations/garudaCore';
import { listWorkIntakes as listCoreWorkIntakes, prepareWorkIntakeHandoff as prepareCoreWorkIntakeHandoff, verifyWorkIntakeAndCreateMission as verifyCoreWorkIntakeAndCreateMission } from '../integrations/garudaCore';
import { approveFinalDelivery as approveCoreFinalDelivery, getPaymentAccountReadiness as getCorePaymentAccountReadiness, getProductionDelivery as getCoreProductionDelivery, prepareProductionDeliveryHandoff as prepareCoreProductionDeliveryHandoff, recordProductionClientAcceptance as recordCoreProductionClientAcceptance, recordProductionDeliveryReceipt as recordCoreProductionDeliveryReceipt, recordProductionQuality as recordCoreProductionQuality } from '../integrations/garudaCore';
import { approveAcquisitionHandoff as approveCoreAcquisitionHandoff, draftAcquisitionProposal as draftCoreAcquisitionProposal, listAcquisitionCases as listCoreAcquisitionCases, recordAcquisitionResponse as recordCoreAcquisitionResponse, recordAcquisitionSubmission as recordCoreAcquisitionSubmission, verifyAcquisitionAwardAndCreateMission as verifyCoreAcquisitionAwardAndCreateMission } from '../integrations/garudaCore';

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

export async function workIntakes(_req: Request, res: Response) {
  res.json(await listCoreWorkIntakes());
}

export async function prepareWorkIntakeHandoff(req: Request, res: Response) {
  requireFounder(req, 'Confirm Founder authorization for this manual application or quotation handoff');
  const { founderApproved: _confirmation, ...payload } = req.body || {};
  res.status(201).json(await prepareCoreWorkIntakeHandoff(req.params.id, payload));
}

export async function verifyWorkIntakeAndCreateMission(req: Request, res: Response) {
  requireFounder(req, 'Confirm Founder verification of the real client engagement and terms');
  const { founderApproved: _confirmation, ...payload } = req.body || {};
  res.status(201).json(await verifyCoreWorkIntakeAndCreateMission(req.params.id, payload));
}

export async function acquisitionCases(_req: Request, res: Response) {
  res.json(await listCoreAcquisitionCases());
}

export async function draftAcquisitionProposal(req: Request, res: Response) {
  res.status(201).json(await draftCoreAcquisitionProposal(req.params.id, req.body || {}));
}

export async function approveAcquisitionHandoff(req: Request, res: Response) {
  requireFounder(req, 'Confirm Founder approval for this exact proposal handoff');
  const { founderApproved: _confirmation, ...payload } = req.body || {};
  res.json(await approveCoreAcquisitionHandoff(req.params.id, payload));
}

export async function recordAcquisitionSubmission(req: Request, res: Response) {
  requireFounder(req, 'Confirm that the approved proposal was actually submitted through an authorized eligible account');
  const { founderApproved: _confirmation, ...payload } = req.body || {};
  res.json(await recordCoreAcquisitionSubmission(req.params.id, payload));
}

export async function recordAcquisitionResponse(req: Request, res: Response) {
  requireFounder(req, 'Confirm review of this genuine client response evidence');
  const { founderApproved: _confirmation, ...payload } = req.body || {};
  res.json(await recordCoreAcquisitionResponse(req.params.id, payload));
}

export async function verifyAcquisitionAwardAndCreateMission(req: Request, res: Response) {
  requireFounder(req, 'Confirm the genuine client award and every accepted work term');
  const { founderApproved: _confirmation, ...payload } = req.body || {};
  res.status(201).json(await verifyCoreAcquisitionAwardAndCreateMission(req.params.id, payload));
}

export async function createExecutionMission(req: Request, res: Response) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED');
  if (req.body?.founderApproved !== true) throw new ApiError(400, 'Confirm founder approval before creating the execution mission', 'APPROVAL_CONFIRMATION_REQUIRED');
  res.status(201).json(await createCoreExecutionMission(req.params.id));
}

export async function prepareExecutionMission(req: Request, res: Response) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED');
  if (req.body?.founderApproved !== true) throw new ApiError(400, 'Confirm founder approval for the bounded scope', 'APPROVAL_CONFIRMATION_REQUIRED');
  const { founderApproved: _confirmation, ...scope } = req.body || {};
  res.json(await prepareCoreExecutionMission(req.params.id, scope));
}

export async function decideExecutionMission(req: Request, res: Response) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED');
  if (req.body?.founderApproved !== true) throw new ApiError(400, 'Confirm the Founder mission decision', 'APPROVAL_CONFIRMATION_REQUIRED');
  if (!['approved', 'request_changes', 'rejected'].includes(req.body?.decision)) throw new ApiError(400, 'Invalid Founder mission decision', 'INVALID_DECISION');
  res.json(await decideCoreExecutionMission(req.params.id, { decision: req.body.decision, notes: req.body.notes || '' }));
}

export async function executionMissionDecisions(req: Request, res: Response) {
  res.json(await listCoreExecutionMissionDecisions(req.params.id));
}

export async function resubmitExecutionMission(req: Request, res: Response) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED');
  if (req.body?.founderApproved !== true) throw new ApiError(400, 'Confirm Founder approval for corrected resubmission', 'APPROVAL_CONFIRMATION_REQUIRED');
  const { founderApproved: _confirmation, ...payload } = req.body || {};
  res.json(await resubmitCoreExecutionMission(req.params.id, payload));
}

export async function transitionExecutionTask(req: Request, res: Response) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED');
  if (req.body?.founderApproved !== true) throw new ApiError(400, 'Confirm Founder approval for the task update', 'APPROVAL_CONFIRMATION_REQUIRED');
  const { founderApproved: _confirmation, ...payload } = req.body || {};
  res.json(await transitionCoreExecutionTask(req.params.id, req.params.taskId, payload));
}

export async function executionTaskEvents(req: Request, res: Response) {
  res.json(await listCoreExecutionTaskEvents(req.params.id));
}

export async function runAutonomousExecutionTask(req: Request, res: Response) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED');
  if (req.body?.founderApproved !== true) throw new ApiError(400, 'Confirm Founder approval for the internal task run', 'APPROVAL_CONFIRMATION_REQUIRED');
  res.json(await runCoreAutonomousExecutionTask(req.params.id, { maxAttempts: 3 }));
}

export async function autonomousTaskRuns(req: Request, res: Response) {
  res.json(await listCoreAutonomousTaskRuns(req.params.id));
}

function requireFounder(req: Request, message: string) { if (req.user?.role !== 'admin') throw new ApiError(403, 'Founder admin approval is required', 'FOUNDER_APPROVAL_REQUIRED'); if (req.body?.founderApproved !== true) throw new ApiError(400, message, 'APPROVAL_CONFIRMATION_REQUIRED'); }
export async function externalActionRequests(req: Request, res: Response) { res.json(await listCoreExternalActionRequests(req.params.id)); }
export async function createExternalActionRequest(req: Request, res: Response) { requireFounder(req, 'Confirm Founder approval to create this action-specific request'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.status(201).json(await createCoreExternalActionRequest(req.params.id, payload)); }
export async function decideExternalActionRequest(req: Request, res: Response) { requireFounder(req, 'Confirm this action-specific Founder decision'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.json(await decideCoreExternalActionRequest(req.params.id, req.params.requestId, payload)); }
export async function completeExternalActionRequest(req: Request, res: Response) { requireFounder(req, 'Confirm the external completion receipt'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.json(await completeCoreExternalActionRequest(req.params.id, req.params.requestId, payload)); }
export async function revenueMvpReadiness(req: Request, res: Response) { res.json(await getCoreRevenueMvpReadiness(req.params.id)); }
export async function revenueConnectors(_req: Request, res: Response) { res.json(await listCoreRevenueConnectors()); }
export async function dispatchExternalAction(req: Request, res: Response) { requireFounder(req, req.body.dryRun === false ? 'Confirm Founder approval for production connector dispatch' : 'Confirm Founder approval for connector validation'); res.json(await dispatchCoreExternalAction(req.params.id, req.params.requestId, { connectorId: req.body.connectorId, dryRun: req.body.dryRun !== false })); }
export async function connectorDispatches(req: Request, res: Response) { res.json(await listCoreConnectorDispatches(req.params.id, req.params.requestId)); }
export async function deploymentReadiness(_req: Request, res: Response) { res.json(await getCoreDeploymentReadiness()); }
export async function pilotLedger(req: Request, res: Response) { res.json(await listCorePilotLedger(req.params.id)); }
export async function recordVerifiedEarning(req: Request, res: Response) { requireFounder(req, 'Confirm Founder approval to record this verified payment'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.status(201).json(await recordCoreVerifiedEarning(req.params.id, req.params.requestId, payload)); }
export async function runAutonomousExecutionMission(req: Request, res: Response) { requireFounder(req, 'Confirm one-tap internal execution'); res.json(await runCoreAutonomousExecutionMission(req.params.id, {})); }
export async function razorpayTestReadiness(_req: Request, res: Response) { res.json(await getCoreRazorpayTestReadiness()); }
export async function prepareRazorpayTestLink(req: Request, res: Response) { requireFounder(req, 'Confirm preparation of this test-mode payment link'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.status(201).json(await prepareCoreRazorpayTestLink(payload)); }
export async function productionDelivery(req: Request, res: Response) { res.json(await getCoreProductionDelivery(req.params.id)); }
export async function recordProductionQuality(req: Request, res: Response) { requireFounder(req, 'Confirm this final-artifact production QA evidence'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.status(201).json(await recordCoreProductionQuality(req.params.id, payload)); }
export async function approveFinalDelivery(req: Request, res: Response) { requireFounder(req, 'Confirm final Founder approval of the tested artifacts'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.json(await approveCoreFinalDelivery(req.params.id, payload)); }
export async function prepareProductionDeliveryHandoff(req: Request, res: Response) { requireFounder(req, 'Authorize preparation of this exact delivery handoff'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.json(await prepareCoreProductionDeliveryHandoff(req.params.id, payload)); }
export async function recordProductionDeliveryReceipt(req: Request, res: Response) { requireFounder(req, 'Confirm that authorized external delivery actually occurred'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.json(await recordCoreProductionDeliveryReceipt(req.params.id, payload)); }
export async function recordProductionClientAcceptance(req: Request, res: Response) { requireFounder(req, 'Confirm verified client acceptance evidence'); const { founderApproved: _confirmation, ...payload } = req.body || {}; res.json(await recordCoreProductionClientAcceptance(req.params.id, payload)); }
export async function paymentAccountReadiness(_req: Request, res: Response) { res.json(await getCorePaymentAccountReadiness()); }
