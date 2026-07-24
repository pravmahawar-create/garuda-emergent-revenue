import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowsClockwise, ArrowSquareOut, Check, RocketLaunch, ShieldCheck, X } from "@phosphor-icons/react";
import { api, formatApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { DiscoveryCandidate, IncomeGoal } from "@/types";
import { MISSION } from "@/constants/testIds";

export default function IncomeMissionsPage() {
  const qc = useQueryClient();
  const [target, setTarget] = useState(100000);
  const [approved, setApproved] = useState(false);
  const [minScore, setMinScore] = useState(60);
  const [candidateStatus, setCandidateStatus] = useState<"ranked" | "approved" | "dismissed">("ranked");
  const goals = useQuery({ queryKey: ["garuda-income-goals"], queryFn: async () => (await api.get<IncomeGoal[]>("/garuda-core/income-goals")).data, refetchInterval: 30000 });
  const start = useMutation({
    mutationFn: async () => (await api.post<IncomeGoal>("/garuda-core/income-goals", { targetAmount: target, founderApproved: approved })).data,
    onSuccess: () => { setApproved(false); qc.invalidateQueries({ queryKey: ["garuda-income-goals"] }); },
  });
  const candidates = useQuery({ queryKey: ["garuda-discovery-candidates", candidateStatus], queryFn: async () => (await api.get<DiscoveryCandidate[]>(`/garuda-core/discovery/candidates?status=${candidateStatus}`)).data, refetchInterval: 30000 });
  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "dismissed" }) => (await api.patch(`/garuda-core/discovery/candidates/${id}/decision`, { status, founderApproved: true })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["garuda-discovery-candidates"] }),
  });
  const items = Array.isArray(goals.data)
    ? goals.data
    : Array.isArray((goals.data as any)?.goals)
    ? (goals.data as any).goals
    : [];
  const rawCandidates = Array.isArray(candidates.data)
    ? candidates.data
    : Array.isArray((candidates.data as any)?.candidates)
    ? (candidates.data as any).candidates
    : [];
  const visibleCandidates = rawCandidates.filter((item) => (item?.score ?? 0) >= minScore);
  const statusLabel = candidateStatus === "ranked" ? "Ranked" : candidateStatus === "approved" ? "Shortlisted" : "Dismissed";

  return <div data-testid={MISSION.page} className="animate-fade-in-up space-y-6">
    <div><div className="g-label">Mobile Control Room</div><h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Income Mission</h1><p className="mt-2 text-sm text-text_secondary">Set a minimum target. GARUDA continues discovering lawful opportunities beyond it.</p></div>
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <section className="g-card space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3"><RocketLaunch size={25} className="text-gold"/><div><div className="font-heading text-xl">Start mission</div><div className="text-xs text-text_muted">Optimization target, not an income guarantee</div></div></div>
        <label className="block"><span className="g-label">Minimum target (INR)</span><input data-testid={MISSION.target} type="number" min="1" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="mt-2 w-full rounded-sm border border-gborder bg-elevated px-4 py-3 text-xl text-text_primary outline-none focus:border-gold"/></label>
        <div className="rounded-sm border border-gold/25 bg-gold/5 p-4 text-sm text-text_secondary"><div className="mb-2 flex items-center gap-2 text-text_primary"><ArrowsClockwise size={18} className="text-gold"/>Continuous discovery</div>Target cross hone par mission nahi rukega. Opportunity gap mein rediscovery aur ranking continue rahegi.</div>
        <label className="flex cursor-pointer items-start gap-3 text-sm"><input data-testid={MISSION.approval} type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="mt-1"/><span><span className="text-text_primary">Founder approval</span><span className="mt-1 block text-xs text-text_muted">Start this lawful mission with current target. Paid or sensitive actions still require their own approval.</span></span></label>
        <button data-testid={MISSION.start} disabled={!approved || target <= 0 || start.isPending} onClick={() => start.mutate()} className="w-full rounded-sm bg-gold px-4 py-3 font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40">{start.isPending ? "Starting…" : `Start ${formatCurrency(target, "INR")} mission`}</button>
        {start.error && <div className="text-sm text-state-danger">{formatApiError(start.error)}</div>}
        {start.isSuccess && <div className="text-sm text-state-success">Mission started and synced with GARUDA Core.</div>}
      </section>
      <section data-testid={MISSION.list} className="space-y-4">
        {goals.isLoading && <div className="g-card p-8 text-center text-text_muted">Loading missions…</div>}
        {goals.error && <div className="g-card border-state-danger/40 p-5 text-state-danger">{formatApiError(goals.error)}</div>}
        {!goals.isLoading && items.length === 0 && <div className="g-card p-8 text-center text-text_muted">No income mission started yet.</div>}
        {items.map((goal) => { const pct = Math.min(100, Math.round((goal.achievedAmount / goal.targetAmount) * 100)); return <article key={goal.id} className="g-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="g-label">{goal.status}</div><h2 className="mt-1 font-heading text-xl">{goal.title}</h2></div><div className="flex items-center gap-2 text-xs text-state-success"><ShieldCheck size={17} weight="fill"/>Continuous</div></div>
          <div className="mt-5 flex items-end justify-between"><div><div className="text-xs text-text_muted">Verified progress</div><div className="font-heading text-2xl text-gold">{formatCurrency(goal.achievedAmount, goal.currency)}</div></div><div className="text-right"><div className="text-xs text-text_muted">Minimum target</div><div>{formatCurrency(goal.targetAmount, goal.currency)}</div></div></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated"><div className="h-full bg-gold" style={{ width: `${pct}%` }}/></div><div className="mt-2 text-right text-xs text-text_muted">{pct}%</div>
        </article>; })}
      </section>
    </div>
    <section data-testid={MISSION.candidates} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="g-label">Founder approval queue</div><h2 className="mt-1 font-heading text-2xl">{statusLabel} opportunities</h2><p className="mt-1 text-sm text-text_muted">Review only. Shortlisting does not apply automatically.</p></div><label className="text-xs text-text_muted">Minimum score<input type="number" min="0" max="100" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="ml-2 w-20 rounded-sm border border-gborder bg-elevated px-2 py-2 text-text_primary"/></label></div>
      <div className="flex flex-wrap gap-2">{(["ranked", "approved", "dismissed"] as const).map((status) => <button key={status} onClick={() => setCandidateStatus(status)} className={`rounded-sm border px-4 py-2 text-sm ${candidateStatus === status ? "border-gold bg-gold/10 text-gold" : "border-gborder text-text_secondary"}`}>{status === "ranked" ? "Ranked" : status === "approved" ? "Shortlisted" : "Dismissed"}</button>)}</div>
      {candidates.isLoading && <div className="g-card p-8 text-center text-text_muted">Loading verified opportunities…</div>}
      {candidates.error && <div className="g-card border-state-danger/40 p-5 text-state-danger">{formatApiError(candidates.error)}</div>}
      {!candidates.isLoading && visibleCandidates.length === 0 && <div className="g-card p-8 text-center text-text_muted">No {statusLabel.toLowerCase()} opportunity matches this score yet.</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleCandidates.map((item) => <article key={item.id} className="g-card flex flex-col p-5">
        <div className="flex items-start justify-between gap-3"><div className="g-label">{item.sourceAttribution}</div><div className="rounded-full border border-gold/30 px-2 py-1 text-xs text-gold">Score {item.score}</div></div>
        <h3 className="mt-3 font-heading text-lg">{item.title}</h3><div className="mt-1 text-sm text-text_secondary">{item.company} · {item.location}</div>
        {item.salaryText && <div className="mt-2 text-sm text-state-success">{item.salaryText}</div>}
        <div className="mt-3 flex flex-wrap gap-1">{item.tags.slice(0, 5).map((tag) => <span key={tag} className="rounded-sm bg-elevated px-2 py-1 text-[10px] text-text_muted">{tag}</span>)}</div>
        <a href={item.url} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 text-sm text-gold">Open original listing <ArrowSquareOut size={15}/></a>
        {candidateStatus === "ranked" ? <div className="mt-auto grid grid-cols-2 gap-2 pt-5"><button disabled={decide.isPending} onClick={() => decide.mutate({ id: item.id, status: "approved" })} className="flex items-center justify-center gap-2 rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg"><Check size={16}/>Shortlist</button><button disabled={decide.isPending} onClick={() => decide.mutate({ id: item.id, status: "dismissed" })} className="flex items-center justify-center gap-2 rounded-sm border border-gborder px-3 py-2 text-sm text-text_secondary"><X size={16}/>Dismiss</button></div> : <div className="mt-auto pt-5 text-xs uppercase tracking-widest text-text_muted">{statusLabel}</div>}
      </article>)}</div>
      {decide.error && <div className="text-sm text-state-danger">{formatApiError(decide.error)}</div>}
    </section>
  </div>;
}
