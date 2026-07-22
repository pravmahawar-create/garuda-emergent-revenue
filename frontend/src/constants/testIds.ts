export const AUTH = {
  loginEmail: "auth-login-email",
  loginPassword: "auth-login-password",
  loginSubmit: "auth-login-submit",
  loginError: "auth-login-error",
  registerName: "auth-register-name",
  registerEmail: "auth-register-email",
  registerPassword: "auth-register-password",
  registerSubmit: "auth-register-submit",
  registerError: "auth-register-error",
  gotoRegister: "auth-goto-register",
  gotoLogin: "auth-goto-login",
} as const;

export const NAV = {
  sidebar: "sidebar",
  linkDashboard: "nav-link-dashboard",
  linkOpportunities: "nav-link-opportunities",
  linkTasks: "nav-link-tasks",
  linkRevenue: "nav-link-revenue",
  linkSettlements: "nav-link-settlements",
  linkMissions: "nav-link-missions",
  linkExecutionMissions: "nav-link-execution-missions",
  linkAffiliatePilot: "nav-link-affiliate-pilot",
  linkAnalytics: "nav-link-analytics",
  linkActivity: "nav-link-activity",
  linkNotifications: "nav-link-notifications",
  linkSettings: "nav-link-settings",
  topNav: "top-nav",
  logoutBtn: "top-nav-logout",
  notificationBell: "top-nav-notification-bell",
  notificationDropdown: "top-nav-notification-dropdown",
} as const;

export const AFFILIATE = {
  page: "affiliate-pilot-page",
  cases: "affiliate-pilot-cases",
  workflow: "affiliate-pilot-workflow",
  offerSubmit: "affiliate-pilot-offer-submit",
} as const;

export const EXECUTION_MISSION = {
  page: "execution-missions-page",
  approvedCandidates: "execution-mission-approved-candidates",
  missionList: "execution-mission-list",
  scopeForm: "execution-mission-scope-form",
  workPackages: "execution-mission-work-packages",
  evidence: "execution-mission-evidence",
  founderDecision: "execution-mission-founder-decision",
  decisionAudit: "execution-mission-decision-audit",
  correctionForm: "execution-mission-correction-form",
  revisionHistory: "execution-mission-revision-history",
  realWorkIntake: "real-work-intake-panel",
  handoffForm: "real-work-handoff-form",
  realWorkForm: "real-work-mission-form",
  realWorkAudit: "real-work-intake-audit",
  deliverableWorkspace: "execution-mission-deliverable-workspace",
  taskEventAudit: "execution-mission-task-event-audit",
  autonomousRunner: "execution-mission-autonomous-runner",
  autonomousRunAudit: "execution-mission-autonomous-run-audit",
  externalActionQueue: "execution-mission-external-action-queue",
  mvpReadiness: "execution-mission-mvp-readiness",
  productionDelivery: "production-delivery-panel",
  productionQuality: "production-delivery-quality",
  finalDeliveryApproval: "production-delivery-final-approval",
  authorizedDeliveryHandoff: "production-delivery-handoff",
  deliveryReceipt: "production-delivery-receipt",
  clientAcceptance: "production-delivery-client-acceptance",
  paymentReadiness: "production-payment-readiness",
  productionAudit: "production-delivery-audit",
  acquisitionBridge: "real-pilot-acquisition-bridge",
  acquisitionDraft: "real-pilot-acquisition-draft",
  acquisitionApproval: "real-pilot-acquisition-approval",
  acquisitionSubmission: "real-pilot-acquisition-submission",
  acquisitionResponse: "real-pilot-acquisition-response",
  acquisitionAward: "real-pilot-acquisition-award",
  acquisitionAudit: "real-pilot-acquisition-audit",
} as const;

export const MISSION = {
  page: "income-missions-page",
  target: "income-mission-target",
  approval: "income-mission-approval",
  start: "income-mission-start",
  list: "income-mission-list",
  candidates: "income-mission-candidates",
} as const;

export const SETTLEMENT = {
  page: "settlements-page",
  coreStatus: "garuda-core-status",
  table: "settlements-table",
} as const;

export const DASH = {
  kpiTotalRevenue: "kpi-total-revenue",
  kpiMtdRevenue: "kpi-mtd-revenue",
  kpiPipelineValue: "kpi-pipeline-value",
  kpiConversion: "kpi-conversion-rate",
  revenueChart: "dashboard-revenue-chart",
  pipelineSnapshot: "dashboard-pipeline-snapshot",
  recentActivity: "dashboard-recent-activity",
} as const;

export const OPP = {
  page: "opportunities-page",
  newBtn: "opportunity-new-btn",
  viewToggleKanban: "opportunity-view-kanban",
  viewToggleList: "opportunity-view-list",
  kanban: "opportunity-kanban",
  list: "opportunity-list",
  form: "opportunity-form",
  formTitle: "opportunity-form-title",
  formClient: "opportunity-form-client",
  formValue: "opportunity-form-value",
  formStage: "opportunity-form-stage",
  formSource: "opportunity-form-source",
  formProbability: "opportunity-form-probability",
  formNotes: "opportunity-form-notes",
  formSubmit: "opportunity-form-submit",
  formCancel: "opportunity-form-cancel",
} as const;

export const TASK = {
  page: "tasks-page",
  newBtn: "task-new-btn",
  form: "task-form",
  formTitle: "task-form-title",
  formPriority: "task-form-priority",
  formStatus: "task-form-status",
  formDue: "task-form-due",
  formSubmit: "task-form-submit",
  formCancel: "task-form-cancel",
} as const;

export const REV = {
  page: "revenue-page",
  newBtn: "revenue-new-btn",
  form: "revenue-form",
  formClient: "revenue-form-client",
  formAmount: "revenue-form-amount",
  formSource: "revenue-form-source",
  formDate: "revenue-form-date",
  formSubmit: "revenue-form-submit",
  formCancel: "revenue-form-cancel",
} as const;

export const ANALYTICS = {
  page: "analytics-page",
  monthlyChart: "analytics-monthly-chart",
  sourceChart: "analytics-source-chart",
  clientsTable: "analytics-clients-table",
} as const;

export const ACT = {
  page: "activity-page",
  feed: "activity-feed",
} as const;

export const NOTIF = {
  page: "notifications-page",
  list: "notifications-list",
  markAllRead: "notifications-mark-all-read",
} as const;

export const SETTINGS = {
  page: "settings-page",
  nameInput: "settings-name-input",
  saveProfile: "settings-save-profile",
  currentPassword: "settings-current-password",
  newPassword: "settings-new-password",
  changePassword: "settings-change-password",
} as const;
