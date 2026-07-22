import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "@phosphor-icons/react";
import { api, formatApiError } from "@/lib/api";
import { EXECUTION_MISSION } from "@/constants/testIds";
import type { RevenueExecutionMission, RevenuePaymentAccountReadiness, RevenueProductionDelivery } from "@/types";

const sha256 = /^[a-f0-9]{64}$/i;

export function ProductionDeliveryPanel({ mission }: { mission: RevenueExecutionMission }) {
  const qc = useQueryClient();
  const criteria = useMemo(() => mission.opportunity.brief?.acceptanceCriteria || [], [mission.opportunity.brief?.acceptanceCriteria]);
  const [testName, setTestName] = useState("");
  const [testCommand, setTestCommand] = useState("");
  const [testReference, setTestReference] = useState("");
  const [testHash, setTestHash] = useState("");
  const [criterionEvidence, setCriterionEvidence] = useState<Record<number, { reference: string; sha256: string }>>({});
  const [qualityConfirmed, setQualityConfirmed] = useState(false);
  const [finalNotes, setFinalNotes] = useState("");
  const [finalConfirmed, setFinalConfirmed] = useState(false);
  const [channel, setChannel] = useState("platform_message");
  const [destination, setDestination] = useState("");
  const [summary, setSummary] = useState("");
  const [handoffConfirmed, setHandoffConfirmed] = useState(false);
  const [deliveryProvider, setDeliveryProvider] = useState("");
  const [deliveryReference, setDeliveryReference] = useState("");
  const [deliveryEvidence, setDeliveryEvidence] = useState("");
  const [deliveredAt, setDeliveredAt] = useState("");
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [acceptanceReference, setAcceptanceReference] = useState("");
  const [acceptanceEvidence, setAcceptanceEvidence] = useState("");
  const [acceptedAt, setAcceptedAt] = useState("");
  const [acceptanceConfirmed, setAcceptanceConfirmed] = useState(false);

  const delivery = useQuery({
    queryKey: ["garuda-production-delivery", mission.id],
    queryFn: async () => (await api.get<RevenueProductionDelivery | null>(`/garuda-core/execution-missions/${mission.id}/production-delivery`)).data,
    refetchInterval: 30000,
  });
  const payment = useQuery({
    queryKey: ["garuda-payment-account-readiness"],
    queryFn: async () => (await api.get<RevenuePaymentAccountReadiness>("/garuda-core/payments/account-readiness")).data,
    refetchInterval: 60000,
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["garuda-production-delivery", mission.id] });
    qc.invalidateQueries({ queryKey: ["garuda-execution-missions"] });
    qc.invalidateQueries({ queryKey: ["garuda-core-settlements"] });
    qc.invalidateQueries({ queryKey: ["garuda-core-revenue"] });
  };
  const quality = useMutation({
    mutationFn: async () => (await api.post(`/garuda-core/execution-missions/${mission.id}/production-delivery/quality`, {
      founderApproved: true,
      automatedTests: [{ name: testName.trim(), command: testCommand.trim(), exitCode: 0, passed: true, reference: testReference.trim(), sha256: testHash.trim().toLowerCase() }],
      criterionChecks: criteria.map((criterion, index) => ({ criterion, passed: true, reference: criterionEvidence[index]?.reference.trim(), sha256: criterionEvidence[index]?.sha256.trim().toLowerCase() })),
      attestation: { productionData: true, noPlaceholderData: true, testedFinalArtifacts: true },
    })).data,
    onSuccess: refresh,
  });
  const approve = useMutation({
    mutationFn: async () => (await api.post(`/garuda-core/execution-missions/${mission.id}/production-delivery/final-approval`, { founderApproved: true, decision: "approved", confirmedFinalArtifacts: true, notes: finalNotes.trim() })).data,
    onSuccess: refresh,
  });
  const handoff = useMutation({
    mutationFn: async () => (await api.post(`/garuda-core/execution-missions/${mission.id}/production-delivery/handoff`, { founderApproved: true, founderAuthorized: true, channel, destination: destination.trim(), summary: summary.trim() })).data,
    onSuccess: refresh,
  });
  const recordDelivery = useMutation({
    mutationFn: async () => (await api.post(`/garuda-core/execution-missions/${mission.id}/production-delivery/delivery-receipt`, { founderApproved: true, deliveryActuallyPerformed: true, provider: deliveryProvider.trim(), reference: deliveryReference.trim(), evidence: deliveryEvidence.trim(), deliveredAt })).data,
    onSuccess: refresh,
  });
  const accept = useMutation({
    mutationFn: async () => (await api.post(`/garuda-core/execution-missions/${mission.id}/production-delivery/client-acceptance`, { founderApproved: true, clientIdentityConfirmed: true, allAcceptanceCriteriaConfirmed: true, reference: acceptanceReference.trim(), evidence: acceptanceEvidence.trim(), acceptedAt })).data,
    onSuccess: refresh,
  });

  if (mission.truthStatus !== "verified_real_work" || mission.deliverableWorkspace?.status !== "complete") return null;
  const item = delivery.data;
  const qaReady = qualityConfirmed && testName.trim() && testCommand.trim() && testReference.trim() && sha256.test(testHash.trim()) && criteria.length > 0 && criteria.every((_criterion, index) => criterionEvidence[index]?.reference.trim() && sha256.test(criterionEvidence[index]?.sha256.trim() || ""));
  const mutationError = quality.error || approve.error || handoff.error || recordDelivery.error || accept.error;

  return <div data-testid={EXECUTION_MISSION.productionDelivery} className="mt-5 border-t border-gold/30 pt-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="g-label">Production Batch 2</div><h4 className="mt-1 font-heading text-xl">Delivery, acceptance & payment truth chain</h4></div>
      <span className="rounded-full border border-gold/40 px-3 py-1 text-xs uppercase text-gold">{item?.status.replaceAll("_", " ") || "QA required"}</span>
    </div>
    <p className="mt-2 text-xs text-text_muted">Final tested artifacts → Founder approval → authorized delivery → client acceptance → signed provider receipt. No step implies the next one.</p>

    {!item && <div data-testid={EXECUTION_MISSION.productionQuality} className="mt-4 space-y-3 rounded-sm border border-gborder p-4">
      <div><div className="text-sm font-semibold text-text_primary">Record final automated QA evidence</div><div className="mt-1 text-xs text-text_muted">Use results produced against the actual final artifacts. Every SHA-256 must bind the cited evidence.</div></div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Automated test name" className="rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/>
        <input value={testCommand} onChange={(e) => setTestCommand(e.target.value)} placeholder="Executed command" className="rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/>
        <input value={testReference} onChange={(e) => setTestReference(e.target.value)} placeholder="Test report reference" className="rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/>
        <input value={testHash} onChange={(e) => setTestHash(e.target.value)} placeholder="Test report SHA-256" className="rounded-sm border border-gborder bg-elevated px-3 py-2 font-mono text-xs"/>
      </div>
      <div className="space-y-2">{criteria.map((criterion, index) => <div key={criterion} className="rounded-sm border border-gborder p-3">
        <div className="text-xs text-text_primary">{index + 1}. {criterion}</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2"><input value={criterionEvidence[index]?.reference || ""} onChange={(e) => setCriterionEvidence((state) => ({ ...state, [index]: { reference: e.target.value, sha256: state[index]?.sha256 || "" } }))} placeholder="Acceptance evidence reference" className="rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/><input value={criterionEvidence[index]?.sha256 || ""} onChange={(e) => setCriterionEvidence((state) => ({ ...state, [index]: { reference: state[index]?.reference || "", sha256: e.target.value } }))} placeholder="Evidence SHA-256" className="rounded-sm border border-gborder bg-elevated px-3 py-2 font-mono text-xs"/></div>
      </div>)}</div>
      <label className="flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={qualityConfirmed} onChange={(e) => setQualityConfirmed(e.target.checked)}/><span>I confirm these are genuine passing results from the final production artifacts, with no demo or placeholder evidence.</span></label>
      <button disabled={!qaReady || quality.isPending} onClick={() => quality.mutate()} className="w-full rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40">Lock passing QA report</button>
    </div>}

    {item?.status === "quality_passed" && <div data-testid={EXECUTION_MISSION.finalDeliveryApproval} className="mt-4 space-y-3 rounded-sm border border-state-warning/40 p-4">
      <div className="text-sm font-semibold text-text_primary">Final Founder delivery approval</div>
      <div className="text-xs text-text_muted">Quality {item.qualityReport.qualityHash.slice(0, 14)}… · {item.artifactManifest.length} evidence items · {item.acceptanceCriteria.length} criteria passed.</div>
      <textarea value={finalNotes} onChange={(e) => setFinalNotes(e.target.value)} rows={2} placeholder="Final review notes (optional)" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/>
      <label className="flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={finalConfirmed} onChange={(e) => setFinalConfirmed(e.target.checked)}/><span>I reviewed the tested final artifacts. This approves delivery preparation only—not automatic delivery.</span></label>
      <button disabled={!finalConfirmed || approve.isPending} onClick={() => approve.mutate()} className="w-full rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40">Approve tested final package</button>
    </div>}

    {item?.status === "final_approved" && <div data-testid={EXECUTION_MISSION.authorizedDeliveryHandoff} className="mt-4 space-y-3 rounded-sm border border-gborder p-4">
      <div className="text-sm font-semibold text-text_primary">Prepare authorized delivery handoff</div>
      <div className="grid gap-2 sm:grid-cols-2"><select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"><option value="platform_message">Platform message</option><option value="email">Email</option><option value="client_portal">Client portal</option><option value="repository_release">Repository release</option><option value="other_authorized_channel">Other authorized channel</option></select><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Exact authorized destination" className="rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/></div>
      <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="Exact delivery summary" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/>
      <label className="flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={handoffConfirmed} onChange={(e) => setHandoffConfirmed(e.target.checked)}/><span>I authorize preparation of this exact handoff. GARUDA must not send it automatically.</span></label>
      <button disabled={!handoffConfirmed || !destination.trim() || !summary.trim() || handoff.isPending} onClick={() => handoff.mutate()} className="w-full rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40">Prepare manual delivery package</button>
    </div>}

    {item?.status === "handoff_ready" && <div data-testid={EXECUTION_MISSION.deliveryReceipt} className="mt-4 space-y-3 rounded-sm border border-gborder p-4">
      <div className="text-sm font-semibold text-text_primary">Record actual authorized delivery</div><div className="text-xs text-text_muted">Package {item.deliveryHandoff?.packageHash.slice(0, 14)}… is prepared but has not been sent by GARUDA.</div>
      <div className="grid gap-2 sm:grid-cols-2"><input value={deliveryProvider} onChange={(e) => setDeliveryProvider(e.target.value)} placeholder="Delivery channel/provider" className="rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/><input value={deliveryReference} onChange={(e) => setDeliveryReference(e.target.value)} placeholder="Actual delivery receipt/reference" className="rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/></div>
      <textarea value={deliveryEvidence} onChange={(e) => setDeliveryEvidence(e.target.value)} rows={2} placeholder="Evidence reviewed by Founder" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/>
      <label className="text-[10px] text-text_muted">Actual delivery time<input type="datetime-local" value={deliveredAt} onChange={(e) => setDeliveredAt(e.target.value)} className="mt-1 w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs text-text_primary"/></label>
      <label className="flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={deliveryConfirmed} onChange={(e) => setDeliveryConfirmed(e.target.checked)}/><span>I confirm this package was actually delivered through the authorized channel. Client acceptance and payment are not implied.</span></label>
      <button disabled={!deliveryConfirmed || !deliveryProvider.trim() || !deliveryReference.trim() || !deliveryEvidence.trim() || !deliveredAt || recordDelivery.isPending} onClick={() => recordDelivery.mutate()} className="w-full rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40">Record delivery receipt</button>
    </div>}

    {item?.status === "delivered" && <div data-testid={EXECUTION_MISSION.clientAcceptance} className="mt-4 space-y-3 rounded-sm border border-gborder p-4">
      <div className="text-sm font-semibold text-text_primary">Verify client acceptance</div><div className="text-xs text-text_muted">Delivery alone is not acceptance. Record only evidence received from the verified client.</div>
      <input value={acceptanceReference} onChange={(e) => setAcceptanceReference(e.target.value)} placeholder="Client acceptance reference" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/>
      <textarea value={acceptanceEvidence} onChange={(e) => setAcceptanceEvidence(e.target.value)} rows={2} placeholder="Exact acceptance evidence reviewed" className="w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs"/>
      <label className="text-[10px] text-text_muted">Client acceptance time<input type="datetime-local" value={acceptedAt} onChange={(e) => setAcceptedAt(e.target.value)} className="mt-1 w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs text-text_primary"/></label>
      <label className="flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={acceptanceConfirmed} onChange={(e) => setAcceptanceConfirmed(e.target.checked)}/><span>I verified the client identity and confirmation that every acceptance criterion was met. Payment is still unverified.</span></label>
      <button disabled={!acceptanceConfirmed || !acceptanceReference.trim() || !acceptanceEvidence.trim() || !acceptedAt || accept.isPending} onClick={() => accept.mutate()} className="w-full rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40">Record verified client acceptance</button>
    </div>}

    {item && ["client_accepted", "payment_verified"].includes(item.status) && <div data-testid={EXECUTION_MISSION.paymentReadiness} className="mt-4 rounded-sm border border-gold/30 bg-gold/5 p-4">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm text-text_primary"><ShieldCheck size={18} className="text-gold"/>Eligible payment account & signed receipt</div><span className={payment.data?.ready ? "text-xs text-state-success" : "text-xs text-state-warning"}>{payment.data?.ready ? "READY" : "CONFIG REQUIRED"}</span></div>
      <div className="mt-2 text-xs text-text_muted">{payment.data?.truth || "Checking eligible account configuration…"}</div>
      <div className="mt-2 text-[10px] text-text_muted">GARUDA cannot initiate money movement. Revenue appears only after a signed provider webhook matches this mission’s confirmed {item.currency} {item.contractAmount.toLocaleString("en-IN")} payment.</div>
      {item.status === "payment_verified" && <div className="mt-3 rounded-sm border border-state-success/40 p-3 text-xs text-state-success">Payment received verified · {item.paymentReceipt?.currency} {item.paymentReceipt?.amount.toLocaleString("en-IN")} · revenue {item.revenueRecordId?.slice(0, 12)}… · settlement pending {item.settlementLedgerId?.slice(0, 12)}…</div>}
    </div>}

    {item && <div data-testid={EXECUTION_MISSION.productionAudit} className="mt-4"><div className="g-label">Immutable production audit</div><div className="mt-2 space-y-1">{item.auditTrail.map((event) => <div key={event.eventHash} className="flex justify-between gap-2 rounded-sm border border-gborder px-3 py-2 font-mono text-[10px] text-text_muted"><span>#{event.sequence} {event.eventType}</span><span>{event.eventHash.slice(0, 12)}…</span></div>)}</div></div>}
    {(delivery.error || payment.error || mutationError) && <div className="mt-3 rounded-sm border border-state-danger/40 p-3 text-xs text-state-danger">{formatApiError(delivery.error || payment.error || mutationError)}</div>}
  </div>;
}
