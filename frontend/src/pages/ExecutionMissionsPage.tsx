import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowSquareOut, CheckCircle, FlowArrow, LockKey, ShieldCheck } from "@phosphor-icons/react";
import { api, formatApiError } from "@/lib/api";
import type { DiscoveryCandidate, RevenueExecutionMission } from "@/types";
import { EXECUTION_MISSION } from "@/constants/testIds";

function eligible(candidate: DiscoveryCandidate) {
  const verification = candidate.verification;
  return candidate.status === "approved" && candidate.opportunityChannel === "garuda_deliverable" && candidate.capabilityAssessment?.selfEarningEligible === true && candidate.capabilityAssessment?.humanIdentityRequired !== true && verification?.sourceVerified === true && verification?.originalLinkPresent === true && verification?.prohibitedContentClear === true && verification?.scamSignalsClear === true;
}

const statusLabel: Record<RevenueExecutionMission["status"], string> = {
  awaiting_bounded_scope: "Awaiting bounded scope",
  ready_for_founder_review: "Ready for Founder review",
  blocked: "Blocked",
};

export default function ExecutionMissionsPage() {
  const qc = useQueryClient();
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const missions = useQuery({ queryKey: ["garuda-execution-missions"], queryFn: async () => (await api.get<RevenueExecutionMission[]>("/garuda-core/execution-missions")).data, refetchInterval: 30000 });
  const approved = useQuery({ queryKey: ["garuda-discovery-candidates", "approved"], queryFn: async () => (await api.get<DiscoveryCandidate[]>("/garuda-core/discovery/candidates?status=approved")).data, refetchInterval: 30000 });
  const create = useMutation({
    mutationFn: async (candidateId: string) => (await api.post<RevenueExecutionMission>(`/garuda-core/discovery/candidates/${candidateId}/execution-mission`, { founderApproved: true })).data,
    onSuccess: (_data, candidateId) => {
      setConfirmed((state) => ({ ...state, [candidateId]: false }));
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
      <div className="grid gap-4 xl:grid-cols-2">{(missions.data || []).map((mission) => <article key={mission.id} className="g-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="g-label">{mission.capability.universe} · {mission.capability.readiness}</div><h3 className="mt-2 font-heading text-xl">{mission.opportunity.title}</h3><div className="mt-1 text-sm text-text_secondary">{mission.opportunity.company || mission.opportunity.source}</div></div><span className="rounded-full border border-state-warning/40 px-3 py-1 text-xs text-state-warning">{statusLabel[mission.status]}</span></div>
        <div className="mt-4 rounded-sm border border-gborder bg-elevated/50 p-4"><div className="flex items-center gap-2 text-sm text-text_primary"><ShieldCheck size={18} className="text-state-success" weight="fill"/>{mission.capability.name}</div><div className="mt-1 text-xs text-text_muted">Capability match {mission.capability.matchScore}% · {mission.architecturePlan.tasks.length} planned checkpoints</div></div>
        <div className="mt-4 flex flex-wrap items-center gap-2">{mission.executionPath.map((brain, index) => <React.Fragment key={brain}><span className="rounded-sm border border-gborder px-2 py-1 text-[10px] uppercase tracking-wider text-text_secondary">{brain}</span>{index < mission.executionPath.length - 1 && <FlowArrow size={13} className="text-gold"/>}</React.Fragment>)}</div>
        <div className="mt-4 flex items-center gap-2 text-xs text-text_muted"><LockKey size={15} className="text-gold"/>External actions and source/Git writes remain blocked.</div>
        <a href={mission.opportunity.originalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-gold">Open verified source <ArrowSquareOut size={15}/></a>
      </article>)}</div>
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
