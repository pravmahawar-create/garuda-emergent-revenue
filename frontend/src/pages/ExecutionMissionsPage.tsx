import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowSquareOut, ArrowsClockwise, CheckCircle, FlowArrow, Flask, LockKey, ShieldCheck, XCircle } from "@phosphor-icons/react";
import { api, formatApiError } from "@/lib/api";
import type { DiscoveryCandidate, RevenueExecutionMission, RevenueMissionDecision } from "@/types";
import { EXECUTION_MISSION } from "@/constants/testIds";

function eligible(candidate: DiscoveryCandidate) {
  const verification = candidate.verification;
  return candidate.status === "approved" && candidate.opportunityChannel === "garuda_deliverable" && candidate.capabilityAssessment?.selfEarningEligible === true && candidate.capabilityAssessment?.humanIdentityRequired !== true && verification?.sourceVerified === true && verification?.originalLinkPresent === true && verification?.prohibitedContentClear === true && verification?.scamSignalsClear === true;
}

const statusLabel: Record<RevenueExecutionMission["status"], string> = {
  awaiting_bounded_scope: "Awaiting bounded scope",
  ready_for_founder_review: "Ready for Founder review",
  founder_approved: "Founder approved",
  changes_required: "Changes required",
  rejected: "Rejected",
  blocked: "Blocked",
};

type ScopeDraft = { deliverableType: string; requiredInputs: string; acceptanceCriteria: string; constraints: string; confirmed: boolean };
const emptyScope: ScopeDraft = { deliverableType: "", requiredInputs: "", acceptanceCriteria: "", constraints: "No external action without separate Founder approval", confirmed: false };
const lines = (value: string) => value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);

function MissionDecisionPanel({ mission }: { mission: RevenueExecutionMission }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const audit = useQuery({ queryKey: ["garuda-execution-mission-decisions", mission.id], queryFn: async () => (await api.get<RevenueMissionDecision[]>(`/garuda-core/execution-missions/${mission.id}/decisions`)).data });
  const decide = useMutation({
    mutationFn: async (decision: RevenueMissionDecision["decision"]) => (await api.post(`/garuda-core/execution-missions/${mission.id}/decision`, { founderApproved: true, decision, notes: notes.trim() })).data,
    onSuccess: () => {
      setNotes(""); setConfirmed(false);
      qc.invalidateQueries({ queryKey: ["garuda-execution-missions"] });
      qc.invalidateQueries({ queryKey: ["garuda-execution-mission-decisions", mission.id] });
    },
  });
  const canApprove = mission.status === "ready_for_founder_review" && mission.executionEvidence?.reviewerVerdict === "APPROVE";
  const submit = (decision: RevenueMissionDecision["decision"]) => { if (confirmed && (decision === "approved" || notes.trim())) decide.mutate(decision); };
  return <div data-testid={EXECUTION_MISSION.founderDecision} className="mt-5 border-t border-gborder pt-5">
    {mission.status === "ready_for_founder_review" && <div className="space-y-3"><div><div className="g-label">Founder decision checkpoint</div><p className="mt-1 text-xs text-text_muted">This decision changes mission state only. It grants no external-action authority.</p></div><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes required for changes or rejection" rows={3} className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/><label className="flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}/><span>I reviewed the evidence and confirm this Founder decision.</span></label><div className="grid gap-2 sm:grid-cols-3"><button disabled={!confirmed || !canApprove || decide.isPending} onClick={() => submit("approved")} className="flex items-center justify-center gap-2 rounded-sm bg-state-success px-3 py-2 text-xs font-semibold text-bg disabled:opacity-40"><CheckCircle size={16}/>Approve</button><button disabled={!confirmed || !notes.trim() || decide.isPending} onClick={() => submit("request_changes")} className="flex items-center justify-center gap-2 rounded-sm border border-state-warning/50 px-3 py-2 text-xs text-state-warning disabled:opacity-40"><ArrowsClockwise size={16}/>Changes</button><button disabled={!confirmed || !notes.trim() || decide.isPending} onClick={() => submit("rejected")} className="flex items-center justify-center gap-2 rounded-sm border border-state-danger/50 px-3 py-2 text-xs text-state-danger disabled:opacity-40"><XCircle size={16}/>Reject</button></div>{decide.error && <div className="text-sm text-state-danger">{formatApiError(decide.error)}</div>}</div>}
    {mission.founderDecision && <div className="rounded-sm border border-gborder bg-elevated/50 p-3 text-xs"><div className="text-text_muted">Latest Founder decision</div><div className="mt-1 font-semibold uppercase text-text_primary">{mission.founderDecision.decision.replace("_", " ")}</div>{mission.founderDecision.notes && <div className="mt-2 text-text_secondary">{mission.founderDecision.notes}</div>}</div>}
    <div data-testid={EXECUTION_MISSION.decisionAudit} className="mt-4"><div className="g-label">Immutable audit chain</div>{audit.isLoading && <div className="mt-2 text-xs text-text_muted">Loading audit…</div>}{audit.error && <div className="mt-2 text-xs text-state-danger">{formatApiError(audit.error)}</div>}<div className="mt-2 space-y-2">{(audit.data || []).map((item, index) => <div key={item.id} className="rounded-sm border border-gborder p-3 text-xs"><div className="flex items-center justify-between gap-2"><span className="uppercase text-text_primary">{item.decision.replace("_", " ")}</span><span className="text-text_muted">#{index + 1}</span></div><div className="mt-1 font-mono text-[10px] text-text_muted">{item.decisionHash.slice(0, 16)}…</div></div>)}</div></div>
  </div>;
}

function MissionCorrectionPanel({ mission }: { mission: RevenueExecutionMission }) {
  const qc = useQueryClient();
  const scope = mission.boundedScope;
  const [deliverableType, setDeliverableType] = useState(scope?.deliverableType || "");
  const [requiredInputs, setRequiredInputs] = useState((scope?.requiredInputs || []).join("\n"));
  const [acceptanceCriteria, setAcceptanceCriteria] = useState((scope?.acceptanceCriteria || []).join("\n"));
  const [constraints, setConstraints] = useState((scope?.constraints || []).join("\n"));
  const [responseToFounder, setResponseToFounder] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const resubmit = useMutation({
    mutationFn: async () => (await api.post<RevenueExecutionMission>(`/garuda-core/execution-missions/${mission.id}/resubmit`, {
      founderApproved: true, deliverableType: deliverableType.trim(), requiredInputs: lines(requiredInputs),
      acceptanceCriteria: lines(acceptanceCriteria), constraints: lines(constraints), responseToFounder: responseToFounder.trim(), maxAttempts: 2,
    })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["garuda-execution-missions"] }); },
  });
  if (mission.status !== "changes_required") return null;
  const revision = mission.revisionNumber || 1;
  const ready = revision < 3 && confirmed && deliverableType.trim() && lines(requiredInputs).length && lines(acceptanceCriteria).length && responseToFounder.trim();
  return <div data-testid={EXECUTION_MISSION.correctionForm} className="mt-5 space-y-3 border-t border-gborder pt-5"><div className="flex items-center justify-between gap-3"><div><div className="g-label">Correction & resubmission</div><p className="mt-1 text-xs text-text_muted">Founder request: {mission.founderDecision?.notes || "Changes requested"}</p></div><span className="rounded-full border border-state-warning/40 px-2 py-1 text-[10px] text-state-warning">Revision {revision}/3</span></div>{revision >= 3 ? <div className="rounded-sm border border-state-danger/40 p-3 text-sm text-state-danger">Maximum evidence revisions reached. This mission cannot be resubmitted again.</div> : <><input value={deliverableType} onChange={(e) => setDeliverableType(e.target.value)} placeholder="Corrected deliverable type" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/><textarea value={requiredInputs} onChange={(e) => setRequiredInputs(e.target.value)} rows={3} placeholder="Corrected required inputs" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/><textarea value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} rows={3} placeholder="Corrected acceptance criteria" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/><textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} rows={2} placeholder="Constraints" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/><textarea value={responseToFounder} onChange={(e) => setResponseToFounder(e.target.value)} rows={3} placeholder="Explain how the requested changes were addressed" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/><label className="flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}/><span>I approve this corrected bounded scope for fresh internal evidence generation.</span></label><button disabled={!ready || resubmit.isPending} onClick={() => resubmit.mutate()} className="flex w-full items-center justify-center gap-2 rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40"><ArrowsClockwise size={17}/>Generate revision {revision + 1} evidence</button>{resubmit.error && <div className="text-sm text-state-danger">{formatApiError(resubmit.error)}</div>}</>}</div>;
}

export default function ExecutionMissionsPage() {
  const qc = useQueryClient();
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [scopes, setScopes] = useState<Record<string, ScopeDraft>>({});
  const missions = useQuery({ queryKey: ["garuda-execution-missions"], queryFn: async () => (await api.get<RevenueExecutionMission[]>("/garuda-core/execution-missions")).data, refetchInterval: 30000 });
  const approved = useQuery({ queryKey: ["garuda-discovery-candidates", "approved"], queryFn: async () => (await api.get<DiscoveryCandidate[]>("/garuda-core/discovery/candidates?status=approved")).data, refetchInterval: 30000 });
  const create = useMutation({
    mutationFn: async (candidateId: string) => (await api.post<RevenueExecutionMission>(`/garuda-core/discovery/candidates/${candidateId}/execution-mission`, { founderApproved: true })).data,
    onSuccess: (_data, candidateId) => {
      setConfirmed((state) => ({ ...state, [candidateId]: false }));
      qc.invalidateQueries({ queryKey: ["garuda-execution-missions"] });
    },
  });
  const prepare = useMutation({
    mutationFn: async ({ missionId, draft }: { missionId: string; draft: ScopeDraft }) => (await api.post<RevenueExecutionMission>(`/garuda-core/execution-missions/${missionId}/prepare`, {
      founderApproved: true,
      deliverableType: draft.deliverableType.trim(),
      requiredInputs: lines(draft.requiredInputs),
      acceptanceCriteria: lines(draft.acceptanceCriteria),
      constraints: lines(draft.constraints),
      maxAttempts: 2,
    })).data,
    onSuccess: (_data, variables) => {
      setScopes((state) => ({ ...state, [variables.missionId]: emptyScope }));
      qc.invalidateQueries({ queryKey: ["garuda-execution-missions"] });
    },
  });
  const existing = useMemo(() => new Set((missions.data || []).map((mission) => mission.candidateId)), [missions.data]);

  return <div data-testid={EXECUTION_MISSION.page} className="animate-fade-in-up space-y-7">
    <div><div className="g-label">Mobile Control Room</div><h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Execution Missions</h1><p className="mt-2 max-w-2xl text-sm text-text_secondary">Convert only verified, Founder-approved GARUDA deliverables into governed work. Creating a mission does not contact, apply, spend, contract, deliver, or deploy.</p></div>

    <section data-testid={EXECUTION_MISSION.missionList} className="space-y-4">
      <div><div className="g-label">Active work preparation</div><h2 className="mt-1 font-heading text-2xl">Governed mission chain</h2></div>
      {missions.isLoading && <div className="g-card p-8 text-center text-text_muted">Loading execution missions…</div>}
      {missions.error && <div className="g-card border-state-danger/40 p-5 text-state-danger">{formatApiError(missions.error)}</div>}
      {!missions.isLoading && (missions.data || []).length === 0 && <div className="g-card p-8 text-center text-text_muted">No execution mission created yet.</div>}
      <div className="grid gap-4 xl:grid-cols-2">{(missions.data || []).map((mission) => { const draft = scopes[mission.id] || emptyScope; const scopeReady = draft.deliverableType.trim() && lines(draft.requiredInputs).length && lines(draft.acceptanceCriteria).length && draft.confirmed; return <article key={mission.id} className="g-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="g-label">{mission.capability.universe} · {mission.capability.readiness}</div><h3 className="mt-2 font-heading text-xl">{mission.opportunity.title}</h3><div className="mt-1 text-sm text-text_secondary">{mission.opportunity.company || mission.opportunity.source}</div></div><span className="rounded-full border border-state-warning/40 px-3 py-1 text-xs text-state-warning">{statusLabel[mission.status]}</span></div>
        <div className="mt-4 rounded-sm border border-gborder bg-elevated/50 p-4"><div className="flex items-center gap-2 text-sm text-text_primary"><ShieldCheck size={18} className="text-state-success" weight="fill"/>{mission.capability.name}</div><div className="mt-1 text-xs text-text_muted">Capability match {mission.capability.matchScore}% · {mission.architecturePlan.tasks.length} planned checkpoints</div></div>
        <div className="mt-4 flex flex-wrap items-center gap-2">{mission.executionPath.map((brain, index) => <React.Fragment key={brain}><span className="rounded-sm border border-gborder px-2 py-1 text-[10px] uppercase tracking-wider text-text_secondary">{brain}</span>{index < mission.executionPath.length - 1 && <FlowArrow size={13} className="text-gold"/>}</React.Fragment>)}</div>
        <div className="mt-4 flex items-center gap-2 text-xs text-text_muted"><LockKey size={15} className="text-gold"/>External actions and source/Git writes remain blocked.</div>
        {mission.status === "awaiting_bounded_scope" && <div data-testid={EXECUTION_MISSION.scopeForm} className="mt-5 space-y-3 border-t border-gborder pt-5">
          <div><div className="g-label">Founder bounded scope</div><p className="mt-1 text-xs text-text_muted">One item per line. This starts internal preparation only.</p></div>
          <input value={draft.deliverableType} onChange={(e) => setScopes((s) => ({ ...s, [mission.id]: { ...draft, deliverableType: e.target.value } }))} placeholder="Deliverable type" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/>
          <textarea value={draft.requiredInputs} onChange={(e) => setScopes((s) => ({ ...s, [mission.id]: { ...draft, requiredInputs: e.target.value } }))} placeholder={"Required inputs\nOne per line"} rows={3} className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/>
          <textarea value={draft.acceptanceCriteria} onChange={(e) => setScopes((s) => ({ ...s, [mission.id]: { ...draft, acceptanceCriteria: e.target.value } }))} placeholder={"Acceptance criteria\nOne per line"} rows={3} className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/>
          <textarea value={draft.constraints} onChange={(e) => setScopes((s) => ({ ...s, [mission.id]: { ...draft, constraints: e.target.value } }))} rows={2} className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"/>
          <label className="flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={draft.confirmed} onChange={(e) => setScopes((s) => ({ ...s, [mission.id]: { ...draft, confirmed: e.target.checked } }))}/><span>I approve this bounded internal scope. External actions remain separately gated.</span></label>
          <button disabled={!scopeReady || prepare.isPending} onClick={() => prepare.mutate({ missionId: mission.id, draft })} className="flex w-full items-center justify-center gap-2 rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40"><Flask size={17}/>Prepare governed work</button>
        </div>}
        {(mission.workPackages || []).length > 0 && <div data-testid={EXECUTION_MISSION.workPackages} className="mt-5 border-t border-gborder pt-5"><div className="g-label">Work-package timeline</div><div className="mt-3 space-y-2">{mission.workPackages!.map((item) => <div key={item.id} className="flex gap-3 rounded-sm border border-gborder bg-elevated/50 p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 text-xs text-gold">{item.order}</span><div><div className="text-sm text-text_primary">{item.title}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-text_muted">{item.brain} · {item.deliverable}</div></div></div>)}</div></div>}
        {mission.executionEvidence && <div data-testid={EXECUTION_MISSION.evidence} className="mt-5 border-t border-gborder pt-5"><div className="flex items-center justify-between gap-3"><div className="g-label">Independent evidence</div><span className={`text-xs ${mission.executionEvidence.reviewerVerdict === "APPROVE" ? "text-state-success" : "text-state-warning"}`}>Reviewer: {mission.executionEvidence.reviewerVerdict || "Pending"}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-sm border border-gborder p-3"><div className="text-text_muted">Tests passed</div><div className="mt-1 text-lg text-text_primary">{mission.executionEvidence.validationEvidence.filter((item) => item.status === "PASSED").length}</div></div><div className="rounded-sm border border-gborder p-3"><div className="text-text_muted">Artifacts verified</div><div className="mt-1 text-lg text-text_primary">{mission.executionEvidence.artifactHashes.length}</div></div></div><div className="mt-3 flex items-center gap-2 text-xs text-state-success"><ShieldCheck size={15}/>Source tree unchanged; Founder checkpoint preserved.</div></div>}
        {mission.executionEvidence && <MissionDecisionPanel mission={mission}/>}
        <MissionCorrectionPanel mission={mission}/>
        {(mission.revisionHistory || []).length > 0 && <div data-testid={EXECUTION_MISSION.revisionHistory} className="mt-5 border-t border-gborder pt-5"><div className="g-label">Archived revisions</div><div className="mt-3 space-y-2">{mission.revisionHistory!.map((item) => <div key={`${item.revisionNumber}-${item.loopId}`} className="rounded-sm border border-gborder p-3 text-xs"><div className="flex items-center justify-between"><span className="text-text_primary">Revision {item.revisionNumber}</span><span className="text-text_muted">Archived</span></div><div className="mt-2 text-text_secondary">{item.responseToFounder}</div><div className="mt-2 font-mono text-[10px] text-text_muted">{item.finalPatchSha256?.slice(0, 16) || "no-patch"}…</div></div>)}</div></div>}
        {prepare.error && prepare.variables?.missionId === mission.id && <div className="mt-3 text-sm text-state-danger">{formatApiError(prepare.error)}</div>}
        <a href={mission.opportunity.originalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-gold">Open verified source <ArrowSquareOut size={15}/></a>
      </article>; })}</div>
    </section>

    <section data-testid={EXECUTION_MISSION.approvedCandidates} className="space-y-4">
      <div><div className="g-label">Founder-approved queue</div><h2 className="mt-1 font-heading text-2xl">Prepare eligible work</h2><p className="mt-1 text-sm text-text_muted">Human-only or insufficiently verified opportunities stay blocked.</p></div>
      {approved.isLoading && <div className="g-card p-8 text-center text-text_muted">Loading approved opportunities…</div>}
      {approved.error && <div className="g-card border-state-danger/40 p-5 text-state-danger">{formatApiError(approved.error)}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(approved.data || []).map((candidate) => { const canCreate = eligible(candidate); const alreadyCreated = existing.has(candidate.id); return <article key={candidate.id} className="g-card flex flex-col p-5">
        <div className="flex items-start justify-between gap-2"><div className="g-label">{candidate.sourceAttribution}</div><span className={`rounded-full border px-2 py-1 text-[10px] ${canCreate ? "border-state-success/40 text-state-success" : "border-state-danger/40 text-state-danger"}`}>{canCreate ? "GARUDA eligible" : "Blocked"}</span></div>
        <h3 className="mt-3 font-heading text-lg">{candidate.title}</h3><div className="mt-1 text-sm text-text_secondary">{candidate.company} · Score {candidate.score}</div>
        <div className="mt-3 text-xs text-text_muted">{candidate.capabilityAssessment?.matches?.[0]?.name || candidate.capabilityAssessment?.decision || "No verified capability match"}</div>
        {canCreate && !alreadyCreated && <label className="mt-4 flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={Boolean(confirmed[candidate.id])} onChange={(event) => setConfirmed((state) => ({ ...state, [candidate.id]: event.target.checked }))}/><span>I confirm internal mission preparation. External actions remain separately approval-gated.</span></label>}
        <button disabled={!canCreate || alreadyCreated || !confirmed[candidate.id] || create.isPending} onClick={() => create.mutate(candidate.id)} className="mt-4 flex items-center justify-center gap-2 rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle size={17}/>{alreadyCreated ? "Mission created" : "Create execution mission"}</button>
      </article>; })}</div>
      {create.error && <div className="text-sm text-state-danger">{formatApiError(create.error)}</div>}
    </section>
  </div>;
}
