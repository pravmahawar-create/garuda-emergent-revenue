export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator";
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type OppStage = "prospect" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export const OPP_STAGES: OppStage[] = [
  "prospect",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

export const OPP_STAGE_LABEL: Record<OppStage, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export interface Opportunity {
  id: string;
  ownerId: string;
  title: string;
  client: string;
  source: string;
  stage: OppStage;
  potentialValue: number;
  currency: string;
  probability: number;
  expectedCloseDate?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "todo" | "in_progress" | "done" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "done", "archived"];
export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];

export interface Task {
  id: string;
  ownerId: string;
  opportunityId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type RevenueStatus = "pending" | "received" | "refunded";
export const REVENUE_STATUSES: RevenueStatus[] = ["pending", "received", "refunded"];

export interface RevenueRecord {
  id: string;
  ownerId: string;
  opportunityId?: string;
  amount: number;
  currency: string;
  source: string;
  client: string;
  status: RevenueStatus;
  recordedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SettlementStatus = "pending" | "eligible" | "processing" | "settled" | "failed";

export interface SettlementLedger {
  id: string;
  revenueRecordId: string;
  executionMissionId?: string;
  paymentEventKey?: string;
  verificationEvidence?: { paymentReceiptHash?: string; providerReference?: string } | null;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  feeRatePercent: number;
  currency: string;
  status: SettlementStatus;
  payoutEligible: boolean;
  eligibilityReasons: string[];
  payoutReference?: string;
  receiptReference?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type IncomeGoalStatus = "draft" | "active" | "paused" | "completed" | "cancelled";
export interface IncomeGoal {
  id: string;
  title: string;
  targetAmount: number;
  achievedAmount: number;
  currency: string;
  status: IncomeGoalStatus;
  deadline?: string;
  milestones: Array<{ sequence: number; label: string; targetAmount: number; achievedAmount: number; status: "pending" | "in_progress" | "completed" }>;
  missionPolicy: { targetIsMinimum: boolean; stopAtTarget: boolean; continuousDiscovery: boolean; pursueUpsideOpportunities: boolean; idleOnOpportunityGap: boolean; controlRoom: "mobile_first" };
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryCandidate {
  id: string;
  missionId: string;
  source: string;
  title: string;
  company: string;
  category: string;
  location: string;
  url: string;
  sourceAttribution: string;
  publishedAt?: string;
  salaryText?: string;
  tags: string[];
  score: number;
  opportunityChannel?: "garuda_deliverable" | "human_opportunity_only" | "no_verified_capability_match";
  capabilityAssessment?: {
    selfEarningEligible: boolean;
    humanIdentityRequired: boolean;
    decision: string;
    matches: Array<{ capabilityId: string; universe: string; name: string; score: number }>;
  };
  verification?: { sourceVerified: boolean; originalLinkPresent: boolean; prohibitedContentClear: boolean; scamSignalsClear: boolean };
  status: "ranked" | "rejected" | "approved" | "dismissed";
  requiresFounderApproval: boolean;
  discoveredAt: string;
}

export interface RevenueExecutionMission {
  id: string;
  candidateId: string;
  incomeGoalId: string;
  missionKey: string;
  status: "awaiting_bounded_scope" | "ready_for_founder_review" | "founder_approved" | "changes_required" | "rejected" | "blocked";
  opportunity: {
    title: string; company: string; source: string; originalUrl: string; score: number;
    listingClassification?: "public_listing_not_contract";
    engagementVerification?: { verified: true; reference: string; evidenceKind: string; verifiedAt: string; workAuthorizationConfirmed: true; termsAcceptedByClient: true; truthHash: string };
    brief?: RevenueWorkBrief;
  };
  realWorkIntake?: { id: string; status: "work_confirmed" | "mission_created"; truthHash: string; lastAuditHash?: string | null; listingClassification: "public_listing_not_contract"; workAuthorizationConfirmed: true };
  truthStatus?: "verified_real_work" | "listing_only_not_contract";
  capability: { id: string; name: string; universe: string; readiness: string; matchScore: number; executionMode: string };
  architecturePlan: { status: string; planId: string; tasks: Array<{ id: string; title: string; brain: string; deliverable: string }> };
  boundedScope?: { deliverableType: string; requiredInputs: string[]; acceptanceCriteria: string[]; constraints: string[]; maxAttempts: number; revisionResponse?: string | null; approvedBy: string; approvedAt: string; scopeHash: string } | null;
  workPackages?: Array<{ id: string; order: number; title: string; brain: string; dependencies: string[]; deliverable: string; status: "planned" | "ready" | "in_progress" | "completed" | "blocked"; statusNote?: string; evidence?: RevenueTaskEvidence[]; lastEventHash?: string; acceptanceCriteria: string[] }>;
  deliverableWorkspace?: { status: "active" | "complete"; totalTasks: number; completedTasks: number; blockedTasks: number; progressPercent: number; updatedAt: string; externalActionsAuthorized: false } | null;
  productionDelivery?: { id: string; status: RevenueProductionDeliveryStatus; qualityHash?: string | null; finalApprovalHash?: string | null; packageHash?: string | null; deliveryReceiptHash?: string | null; clientAcceptanceHash?: string | null; paymentReceiptHash?: string | null; revenueRecordId?: string | null; settlementLedgerId?: string | null; lastAuditHash?: string | null; automaticDeliveryAllowed: false; livePaymentInitiationAllowed: false } | null;
  executionEvidence?: {
    status: string; loopId: string; planId: string; revisionNumber: number; reviewerVerdict: "APPROVE" | "REQUEST_CHANGES" | "REJECT" | null;
    validationEvidence: Array<{ evidenceId: string; targetFile: string; status: string; exitCode: number; targetModified: boolean }>;
    artifactHashes: Array<{ path: string; kind: string; sha256: string }>;
    reviewerRequestedChanges: string[]; reviewerRejectReasons: string[]; sourceTreeModified: boolean;
    founderApprovalRequired: boolean; authorizesSourceApply: boolean; authorizesCommitPushDeploy: boolean; authorizesExternalAction: boolean;
  } | null;
  executionPath: string[];
  governance: {
    boundedScopeRequiredBeforeEngineering: boolean;
    automaticOutreachAllowed: boolean;
    automaticApplicationAllowed: boolean;
    automaticContractAcceptanceAllowed: boolean;
    automaticSpendingAllowed: boolean;
    automaticPaymentActionAllowed: boolean;
    automaticDeliveryAllowed: boolean;
    sourceApplyAllowed: boolean;
    commitPushDeployAllowed: boolean;
    founderApprovalRequiredForExternalActions: boolean;
    verifiedRealWorkRequired?: boolean;
    listingAloneNeverCreatesMission?: boolean;
  };
  missionHash: string;
  founderDecision?: { decision: "approved" | "request_changes" | "rejected"; notes: string; decidedAt: string; decisionHash: string; evidenceHash: string } | null;
  revisionNumber?: number;
  revisionHistory?: Array<{ revisionNumber: number; scopeHash: string | null; loopId: string | null; finalPatchSha256: string | null; founderDecisionHash: string | null; founderNotes: string; responseToFounder: string; archivedAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueWorkBrief {
  title: string;
  deliverableType: string;
  scopeSummary: string;
  requiredInputs: string[];
  price: { amount: number; currency: string };
  deadline: string;
  acceptanceCriteria: string[];
  clientBriefConfirmed: true;
  priceConfirmedByClient: true;
  deadlineConfirmedByClient: true;
}

export interface RevenueWorkIntakeEvent {
  id: string;
  intakeId: string;
  candidateId: string;
  sequence: number;
  eventType: "handoff_prepared" | "work_confirmed" | "mission_created";
  actor: "founder" | "garuda";
  details: Record<string, unknown>;
  previousEventHash?: string | null;
  eventHash: string;
  occurredAt: string;
}

export interface RevenueWorkIntake {
  id: string;
  candidateId: string;
  incomeGoalId: string;
  status: "handoff_ready" | "work_confirmed" | "mission_created";
  listing: { title: string; company: string; source: string; originalUrl: string; score: number; classification: "public_listing_not_contract" };
  engagement?: { verified: true; counterparty: string; channel: string; evidenceKind: string; reference: string; occurredAt: string; verifiedAt: string; workAuthorizationConfirmed: true; termsAcceptedByClient: true } | null;
  brief?: RevenueWorkBrief | null;
  handoff?: { handoffType: "application" | "quotation"; destination: string; summary: string; preparedAt: string; packageHash: string; governance: { manualSubmissionRequired: true; automaticSubmissionAllowed: false; externalExecutionPerformed: false; contractConfirmed: false; missionCreationAllowed: false } } | null;
  executionMissionId?: string | null;
  truthHash: string;
  lastAuditHash?: string | null;
  auditTrail: RevenueWorkIntakeEvent[];
}

export interface RealWorkMissionResult { intake: RevenueWorkIntake; mission: RevenueExecutionMission }

export type RevenueAcquisitionStatus = "proposal_drafted" | "changes_requested" | "handoff_ready" | "submitted" | "response_received" | "closed_no_award" | "mission_created";
export interface RevenueAcquisitionEvent {
  id: string;
  acquisitionCaseId: string;
  candidateId: string;
  sequence: number;
  eventType: "proposal_drafted" | "founder_handoff_approved" | "submission_recorded" | "client_response_recorded" | "no_award_closed" | "award_verified" | "mission_created";
  actor: "garuda" | "founder" | "client";
  details: Record<string, unknown>;
  previousEventHash?: string | null;
  eventHash: string;
  occurredAt: string;
}
export interface RevenueAcquisitionCase {
  id: string;
  candidateId: string;
  incomeGoalId: string;
  status: RevenueAcquisitionStatus;
  listing: { title: string; company: string; source: string; sourceAttribution: string; originalUrl: string; classification: "public_listing_not_contract" };
  capability: { id: string; name: string; universe: string; matchScore: number };
  sourceRules: { discoveryUse: "public_lead_research_only"; applicationMode: "manual_handoff_only"; automatedSubmissionAllowed: false; platformTermsReviewRequired: true; authorizedEligibleAccountRequired: true; credentialsStoredByGaruda: false; publicListingConfirmsContract: false };
  proposal: { proposalType: "application" | "quotation"; title: string; summary: string; deliverables: string[]; acceptanceCriteria: string[]; commercialOffer: { status: "client_confirmation_required" } | { amount: number; currency: string; deliveryDays: number }; requestedClientConfirmation: string[]; truthfulClaims: string[]; preparedAt: string; proposalHash: string };
  founderApproval?: { decisionHash: string; approvedAt: string } | null;
  handoff?: { destination: string; preparedAt: string; handoffHash: string } | null;
  submissionReceipt?: { channel: string; provider: string; reference: string; evidence: string; submittedAt: string; receiptHash: string } | null;
  latestResponse?: { responseType: "client_message" | "revision_request" | "rejected" | "award_offer"; counterparty: string; reference: string; evidence: string; occurredAt: string; responseHash: string } | null;
  workIntakeId?: string | null;
  executionMissionId?: string | null;
  lastAuditHash?: string | null;
  auditTrail: RevenueAcquisitionEvent[];
}
export interface AcquisitionMissionResult extends RealWorkMissionResult { acquisition: RevenueAcquisitionCase }

export interface RevenueTaskEvidence { kind: "artifact" | "test" | "review" | "reference"; label: string; reference: string; sha256?: string | null }
export interface RevenueMissionTaskEvent { id?: string; missionId: string; taskId: string; fromStatus: string; toStatus: string; actor: "founder" | "garuda"; note: string; evidence: RevenueTaskEvidence[]; previousEventHash?: string | null; eventHash: string; createdAt: string }
export interface RevenueAutonomousTaskRun { id?: string; missionId: string; taskId: string; status: "completed" | "blocked"; attempts: number; evidence: RevenueTaskEvidence[]; errors: string[]; eventHashes: string[]; previousRunHash?: string | null; runHash: string; createdAt: string; governance: { internalOnly: true; externalActionsAuthorized: false; sourceGitDeployAuthorized: false; spendingPaymentAuthorized: false } }
export interface RevenueExternalActionRequest { id: string; missionId: string; requestKey: string; actionType: "outreach" | "application" | "contract" | "delivery" | "deployment" | "payment_verification"; status: "pending_founder" | "changes_required" | "rejected" | "handoff_ready" | "externally_completed"; summary: string; destination: string; evidenceHash: string; latestDecisionHash?: string | null; handoffPackage?: { packageHash: string; preparedAt: string } | null; completionReceipt?: { reference: string; provider: string; evidence: string; receiptHash: string; paymentVerified: boolean } | null; }
export interface RevenueConnectorDispatch { id: string; connectorId: string; mode: "dry_run" | "dispatch"; status: "validated" | "dispatched" | "failed"; receiptHash: string; response: { simulated: boolean; providerReference: string }; }
export interface RevenueConnector { id: string; name: string; enabled: boolean; operational?: boolean; production: boolean; supportedActions: RevenueExternalActionRequest["actionType"][]; requiresCredentials: boolean; health?: { enabled: boolean; requested: boolean; endpointValid: boolean; secretPresent: boolean }; }
export interface RevenueMvpReadiness { stage: string; workingMvp: boolean; revenueClaimAllowed: boolean; checks: { founderApproved: boolean; workspaceComplete: boolean; evidenceComplete: boolean; actionApproved: boolean; externalReceiptVerified: boolean; paymentVerified: boolean }; truth: string; }
export interface RevenueDeploymentReadiness { ready: boolean; checks: { productionMode: boolean; publicHttpsUrl: boolean; databaseConfigured: boolean; connectorExplicitlyConfigured: boolean }; externalDispatchDefaultOff: boolean; truth: string; }
export interface RevenuePilotLedgerEntry { id: string; missionId: string; actionRequestId: string; amount: number; currency: string; provider: string; reference: string; entryHash: string; status: "verified"; verifiedAt: string; governance: { revenueClaimAllowed: true; payoutNotImplied: true }; }

export type RevenueProductionDeliveryStatus = "quality_passed" | "final_approved" | "handoff_ready" | "delivered" | "client_accepted" | "payment_verified";
export interface RevenueProductionDeliveryEvent { id: string; deliveryId: string; missionId: string; sequence: number; eventType: "quality_passed" | "final_approved" | "delivery_handoff_prepared" | "delivery_recorded" | "client_accepted" | "payment_verified" | "settlement_ledger_created"; actor: "garuda" | "founder" | "client" | "payment_provider"; details: Record<string, unknown>; previousEventHash?: string | null; eventHash: string; occurredAt: string; }
export interface RevenueProductionDelivery {
  id: string;
  missionId: string;
  status: RevenueProductionDeliveryStatus;
  workIntakeTruthHash: string;
  client: string;
  contractAmount: number;
  currency: string;
  acceptanceCriteria: string[];
  artifactManifest: RevenueTaskEvidence[];
  qualityReport: { qualityHash: string; outcome: "passed"; testedAt: string; automatedTests: Array<{ name: string; command: string; exitCode: 0; passed: true; reference: string; sha256: string }>; criterionChecks: Array<{ criterion: string; passed: true; reference: string; sha256: string }> };
  finalApproval?: { approvalHash: string; notes: string; approvedAt: string } | null;
  deliveryHandoff?: { packageHash: string; channel: string; destination: string; summary: string; preparedAt: string } | null;
  deliveryReceipt?: { receiptHash: string; provider: string; reference: string; evidence: string; deliveredAt: string } | null;
  clientAcceptance?: { acceptanceHash: string; reference: string; evidence: string; acceptedAt: string } | null;
  paymentReceipt?: { paymentReceiptHash: string; provider: string; providerReference: string; amount: number; currency: string; receivedAt: string; verificationMethod: "signed_provider_webhook" } | null;
  revenueRecordId?: string | null;
  settlementLedgerId?: string | null;
  lastAuditHash?: string | null;
  auditTrail: RevenueProductionDeliveryEvent[];
}
export interface RevenuePaymentAccountReadiness { ready: boolean; provider?: string | null; accountReferenceHash?: string | null; supportedCurrencies: string[]; checks: { providerConfigured: boolean; accountReferenceConfigured: boolean; providerKycVerified: boolean; eligibleAccountHolderConfirmed: boolean; payoutsEnabledByProvider: boolean; supportedCurrenciesConfigured: boolean; signedWebhookConfigured: boolean }; livePaymentInitiationEnabled: false; rawKycDataStored: false; truth: string; }

export interface RevenueMissionDecision {
  id: string;
  missionId: string;
  evidenceHash: string;
  decision: "approved" | "request_changes" | "rejected";
  notes: string;
  actor: "founder";
  decidedAt: string;
  previousDecisionHash?: string | null;
  decisionHash: string;
  governance: { authorizesSourceApply: false; authorizesCommitPushDeploy: false; authorizesExternalAction: false; actionSpecificApprovalStillRequired: true };
}

export interface Activity {
  id: string;
  ownerId: string;
  type: string;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  ownerId: string;
  title: string;
  body?: string;
  level: "info" | "success" | "warning" | "critical";
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface DashboardSummary {
  kpis: {
    totalRevenue: number;
    mtdRevenue: number;
    prevMonthRevenue: number;
    growthPct: number;
    pipelineValue: number;
    pipelineCount: number;
    conversionRate: number;
    openTasks: number;
    overdueTasks: number;
  };
  stageBreakdown: Record<OppStage, { count: number; value: number }>;
  recentActivity: Activity[];
}

export interface RevenueAnalytics {
  monthlySeries: Array<{ label: string; amount: number; count: number }>;
  bySource: Array<{ source: string; amount: number }>;
  topClients: Array<{ client: string; amount: number }>;
}
