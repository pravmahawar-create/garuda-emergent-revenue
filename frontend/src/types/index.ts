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
