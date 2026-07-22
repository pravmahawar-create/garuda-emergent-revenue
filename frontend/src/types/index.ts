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
  opportunity: { title: string; company: string; source: string; originalUrl: string; score: number };
  capability: { id: string; name: string; universe: string; readiness: string; matchScore: number; executionMode: string };
  architecturePlan: { status: string; planId: string; tasks: Array<{ id: string; title: string; brain: string; deliverable: string }> };
  boundedScope?: { deliverableType: string; requiredInputs: string[]; acceptanceCriteria: string[]; constraints: string[]; maxAttempts: number; revisionResponse?: string | null; approvedBy: string; approvedAt: string; scopeHash: string } | null;
  workPackages?: Array<{ id: string; order: number; title: string; brain: string; dependencies: string[]; deliverable: string; status: "planned" | "ready" | "in_progress" | "completed" | "blocked"; statusNote?: string; evidence?: RevenueTaskEvidence[]; lastEventHash?: string; acceptanceCriteria: string[] }>;
  deliverableWorkspace?: { status: "active" | "complete"; totalTasks: number; completedTasks: number; blockedTasks: number; progressPercent: number; updatedAt: string; externalActionsAuthorized: false } | null;
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
  };
  missionHash: string;
  founderDecision?: { decision: "approved" | "request_changes" | "rejected"; notes: string; decidedAt: string; decisionHash: string; evidenceHash: string } | null;
  revisionNumber?: number;
  revisionHistory?: Array<{ revisionNumber: number; scopeHash: string | null; loopId: string | null; finalPatchSha256: string | null; founderDecisionHash: string | null; founderNotes: string; responseToFounder: string; archivedAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueTaskEvidence { kind: "artifact" | "test" | "review" | "reference"; label: string; reference: string; sha256?: string | null }
export interface RevenueMissionTaskEvent { id?: string; missionId: string; taskId: string; fromStatus: string; toStatus: string; actor: "founder" | "garuda"; note: string; evidence: RevenueTaskEvidence[]; previousEventHash?: string | null; eventHash: string; createdAt: string }
export interface RevenueAutonomousTaskRun { id?: string; missionId: string; taskId: string; status: "completed" | "blocked"; attempts: number; evidence: RevenueTaskEvidence[]; errors: string[]; eventHashes: string[]; previousRunHash?: string | null; runHash: string; createdAt: string; governance: { internalOnly: true; externalActionsAuthorized: false; sourceGitDeployAuthorized: false; spendingPaymentAuthorized: false } }
export interface RevenueExternalActionRequest { id: string; missionId: string; requestKey: string; actionType: "outreach" | "application" | "contract" | "delivery" | "deployment" | "payment_verification"; status: "pending_founder" | "changes_required" | "rejected" | "handoff_ready" | "externally_completed"; summary: string; destination: string; evidenceHash: string; latestDecisionHash?: string | null; handoffPackage?: { packageHash: string; preparedAt: string } | null; completionReceipt?: { reference: string; provider: string; evidence: string; receiptHash: string; paymentVerified: boolean } | null; }
export interface RevenueConnectorDispatch { id: string; connectorId: string; mode: "dry_run" | "dispatch"; status: "validated" | "dispatched" | "failed"; receiptHash: string; response: { simulated: boolean; providerReference: string }; }
export interface RevenueConnector { id: string; name: string; enabled: boolean; production: boolean; supportedActions: RevenueExternalActionRequest["actionType"][]; requiresCredentials: boolean; }
export interface RevenueMvpReadiness { stage: string; workingMvp: boolean; revenueClaimAllowed: boolean; checks: { founderApproved: boolean; workspaceComplete: boolean; evidenceComplete: boolean; actionApproved: boolean; externalReceiptVerified: boolean; paymentVerified: boolean }; truth: string; }

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
