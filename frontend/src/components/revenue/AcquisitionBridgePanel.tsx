import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, LockKey, PaperPlaneTilt, ShieldCheck } from "@phosphor-icons/react";
import { api, formatApiError } from "@/lib/api";
import { EXECUTION_MISSION } from "@/constants/testIds";
import type { AcquisitionMissionResult, DiscoveryCandidate, RevenueAcquisitionCase } from "@/types";

const lines = (value: string) => value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
const field = "w-full rounded-sm border border-gborder bg-elevated px-3 py-2 text-xs outline-none focus:border-gold";

export function AcquisitionBridgePanel({ candidate, acquisition, existingMission }: { candidate: DiscoveryCandidate; acquisition?: RevenueAcquisitionCase; existingMission: boolean }) {
  const qc = useQueryClient();
  const [proposalType, setProposalType] = useState<"application" | "quotation">("application");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("INR");
  const [deliveryDays, setDeliveryDays] = useState("14");
  const [destination, setDestination] = useState("");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [submissionChannel, setSubmissionChannel] = useState("platform");
  const [provider, setProvider] = useState("");
  const [submissionReference, setSubmissionReference] = useState("");
  const [submissionEvidence, setSubmissionEvidence] = useState("");
  const [submissionAt, setSubmissionAt] = useState("");
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false);
  const [responseType, setResponseType] = useState("client_message");
  const [counterparty, setCounterparty] = useState("");
  const [responseReference, setResponseReference] = useState("");
  const [responseEvidence, setResponseEvidence] = useState("");
  const [responseAt, setResponseAt] = useState("");
  const [responseConfirmed, setResponseConfirmed] = useState(false);
  const [engagementChannel, setEngagementChannel] = useState("platform_message");
  const [evidenceKind, setEvidenceKind] = useState("platform_award");
  const [awardReference, setAwardReference] = useState("");
  const [awardAt, setAwardAt] = useState("");
  const [briefTitle, setBriefTitle] = useState("");
  const [deliverableType, setDeliverableType] = useState("");
  const [scopeSummary, setScopeSummary] = useState("");
  const [requiredInputs, setRequiredInputs] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [deadline, setDeadline] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [awardConfirmed, setAwardConfirmed] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["garuda-acquisition-cases"] });
    qc.invalidateQueries({ queryKey: ["garuda-work-intakes"] });
    qc.invalidateQueries({ queryKey: ["garuda-execution-missions"] });
  };
  const draft = useMutation({
    mutationFn: async () => (await api.post<RevenueAcquisitionCase>(`/garuda-core/discovery/candidates/${candidate.id}/acquisition/draft`, {
      proposalType,
      ...(proposalType === "quotation" ? { commercialOffer: { amount: Number(quoteAmount), currency: quoteCurrency.trim().toUpperCase(), deliveryDays: Number(deliveryDays) } } : {}),
    })).data,
    onSuccess: refresh,
  });
  const approve = useMutation({
    mutationFn: async () => (await api.post<RevenueAcquisitionCase>(`/garuda-core/discovery/candidates/${candidate.id}/acquisition/handoff-approval`, {
      founderApproved: true,
      proposalHash: acquisition?.proposal.proposalHash,
      destination: destination.trim(),
      proposalReviewed: true,
      sourceRulesReviewed: true,
      authorizedAccountConfirmed: true,
      platformEligibilityConfirmed: true,
      noMisrepresentationConfirmed: true,
    })).data,
    onSuccess: () => { setApprovalConfirmed(false); refresh(); },
  });
  const recordSubmission = useMutation({
    mutationFn: async () => (await api.post<RevenueAcquisitionCase>(`/garuda-core/discovery/candidates/${candidate.id}/acquisition/submission`, {
      founderApproved: true,
      handoffHash: acquisition?.handoff?.handoffHash,
      channel: submissionChannel,
      provider: provider.trim(),
      reference: submissionReference.trim(),
      evidence: submissionEvidence.trim(),
      occurredAt: submissionAt,
      externalSubmissionActuallyCompleted: true,
      sameApprovedPackage: true,
      platformRulesFollowed: true,
      authorizedAccountUsed: true,
      noAutomatedSubmission: true,
    })).data,
    onSuccess: () => { setSubmissionConfirmed(false); refresh(); },
  });
  const recordResponse = useMutation({
    mutationFn: async () => (await api.post<RevenueAcquisitionCase>(`/garuda-core/discovery/candidates/${candidate.id}/acquisition/response`, {
      founderApproved: true,
      responseType,
      counterparty: counterparty.trim(),
      reference: responseReference.trim(),
      evidence: responseEvidence.trim(),
      occurredAt: responseAt,
      genuineClientResponse: true,
      evidenceReviewedByFounder: true,
      responseMatchesSubmission: true,
    })).data,
    onSuccess: () => { setResponseConfirmed(false); refresh(); },
  });
  const createMission = useMutation({
    mutationFn: async () => (await api.post<AcquisitionMissionResult>(`/garuda-core/discovery/candidates/${candidate.id}/acquisition/award-mission`, {
      founderApproved: true,
      engagement: {
        counterparty: counterparty.trim(), channel: engagementChannel, evidenceKind, reference: awardReference.trim(), occurredAt: awardAt,
        clientIdentityVerified: true, evidenceReviewedByFounder: true, workAuthorizationConfirmed: true, termsAcceptedByClient: true,
      },
      brief: {
        title: briefTitle.trim(), deliverableType: deliverableType.trim(), scopeSummary: scopeSummary.trim(), requiredInputs: lines(requiredInputs),
        price: { amount: Number(amount), currency: currency.trim().toUpperCase() }, deadline, acceptanceCriteria: lines(acceptanceCriteria),
        clientBriefConfirmed: true, priceConfirmedByClient: true, deadlineConfirmedByClient: true,
      },
      attestation: { productionData: true, noPlaceholderData: true },
    })).data,
    onSuccess: refresh,
  });

  const error = draft.error || approve.error || recordSubmission.error || recordResponse.error || createMission.error;
  const quoteReady = proposalType === "application" || (Number(quoteAmount) > 0 && /^[A-Za-z]{3}$/.test(quoteCurrency.trim()) && Number(deliveryDays) >= 1);
  const awardReady = awardConfirmed && counterparty.trim() && awardReference.trim() && awardAt && briefTitle.trim() && deliverableType.trim() && scopeSummary.trim() && lines(requiredInputs).length && Number(amount) > 0 && /^[A-Za-z]{3}$/.test(currency.trim()) && deadline && lines(acceptanceCriteria).length;

  return <div data-testid={EXECUTION_MISSION.acquisitionBridge} className="mt-4 space-y-4 border-t border-gborder pt-4">
    <div className="rounded-sm border border-state-warning/40 bg-state-warning/5 p-3 text-xs text-state-warning"><strong>Acquisition truth gate.</strong> This listing stays a lead until a real authorized submission receives a genuine client award with accepted terms.</div>

    {(!acquisition || acquisition.status === "changes_requested" || acquisition.status === "source_invalidated") && <div data-testid={EXECUTION_MISSION.acquisitionDraft} className="rounded-sm border border-gold/30 bg-gold/5 p-3"><div className="text-sm font-semibold text-gold">1. GARUDA drafts the truthful {acquisition?.status === "changes_requested" || acquisition?.status === "source_invalidated" ? "revision" : "proposal"}</div>{acquisition?.status === "changes_requested" && <div className="mt-2 text-xs text-state-warning">Client requested changes. The earlier handoff cannot be reused; a fresh proposal and Founder approval are required.</div>}{acquisition?.status === "source_invalidated" && <div className="mt-2 text-xs text-state-danger">The earlier source snapshot became invalid. Handoff is revoked until current specific client work is verified and a fresh proposal is generated.</div>}<div className="mt-3 grid gap-2 sm:grid-cols-3"><select value={proposalType} onChange={(e) => setProposalType(e.target.value as "application" | "quotation")} className={field}><option value="application">Application</option><option value="quotation">Quotation</option></select>{proposalType === "quotation" && <><input type="number" min="0.01" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} placeholder="Proposed price" className={field}/><div className="grid grid-cols-2 gap-2"><input value={quoteCurrency} onChange={(e) => setQuoteCurrency(e.target.value)} maxLength={3} className={field}/><input type="number" min="1" max="365" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} placeholder="Days" className={field}/></div></>}</div><button disabled={!quoteReady || draft.isPending} onClick={() => draft.mutate()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40"><ShieldCheck size={16}/>Generate grounded {acquisition?.status === "changes_requested" || acquisition?.status === "source_invalidated" ? "revision" : "proposal"}</button></div>}

    {acquisition && <div className="rounded-sm border border-gborder p-3 text-xs"><div className="flex items-center justify-between gap-2"><span className={`uppercase ${acquisition.status === "source_invalidated" ? "text-state-danger" : "text-state-success"}`}>{acquisition.status.replaceAll("_", " ")}</span><span className="text-text_muted">{acquisition.auditTrail.length} chained events</span></div><div className="mt-3 font-semibold text-text_primary">{acquisition.proposal.title}</div><div className="mt-2 text-text_secondary">{acquisition.proposal.summary}</div>{acquisition.proposal.grounding && <div className="mt-3 rounded-sm border border-gborder bg-elevated/50 p-3"><div className="text-[10px] uppercase tracking-wider text-state-success">Source-bound · {acquisition.proposal.grounding.listingKind.replaceAll("_", " ")}</div><div className="mt-2 text-text_secondary">{acquisition.proposal.grounding.sourceSummary}</div><div className="mt-2 space-y-1">{acquisition.proposal.grounding.sourceRequirements.map((item) => <div key={item}>• {item}</div>)}</div><div className="mt-2 font-mono text-[10px] text-text_muted">Source {acquisition.proposal.grounding.sourceRecordHash.slice(0, 16)}…</div></div>}<div className="mt-3 space-y-1">{acquisition.proposal.deliverables.map((item) => <div key={item}>• {item}</div>)}</div><div className="mt-3 font-mono text-[10px] text-text_muted">Proposal {acquisition.proposal.proposalHash.slice(0, 16)}…</div></div>}

    {acquisition?.status === "proposal_drafted" && <div data-testid={EXECUTION_MISSION.acquisitionApproval} className="rounded-sm border border-gold/30 p-3"><div className="text-sm font-semibold text-gold">2. Approve exact handoff</div><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Authorized platform/client destination" className={`${field} mt-3`}/><label className="mt-3 flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={approvalConfirmed} onChange={(e) => setApprovalConfirmed(e.target.checked)}/><span>I reviewed this exact proposal and source rules. The submitting account is authorized and eligible, no identity or experience is misrepresented, and this approval does not confirm a contract.</span></label><button disabled={!approvalConfirmed || !destination.trim() || approve.isPending} onClick={() => approve.mutate()} className="mt-3 w-full rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40">Approve manual handoff</button></div>}

    {acquisition?.status === "handoff_ready" && <div data-testid={EXECUTION_MISSION.acquisitionSubmission} className="rounded-sm border border-gold/30 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-gold"><PaperPlaneTilt size={16}/>3. Record actual authorized submission</div><div className="mt-2 text-xs text-text_muted">GARUDA prepared the package; no submission was automated. Record only a real provider/platform receipt after the approved package is submitted.</div><div className="mt-3 grid gap-2 sm:grid-cols-2"><select value={submissionChannel} onChange={(e) => setSubmissionChannel(e.target.value)} className={field}><option value="platform">Platform</option><option value="email">Email</option><option value="client_portal">Client portal</option><option value="authorized_connector">Authorized connector</option></select><input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Real provider/platform" className={field}/><input value={submissionReference} onChange={(e) => setSubmissionReference(e.target.value)} placeholder="Submission receipt/reference" className={field}/><input type="datetime-local" value={submissionAt} onChange={(e) => setSubmissionAt(e.target.value)} className={field}/></div><textarea value={submissionEvidence} onChange={(e) => setSubmissionEvidence(e.target.value)} rows={2} placeholder="Receipt evidence description" className={`${field} mt-2`}/><label className="mt-3 flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={submissionConfirmed} onChange={(e) => setSubmissionConfirmed(e.target.checked)}/><span>The exact approved package was actually submitted through an authorized eligible account under the platform rules; this record contains genuine evidence and no automated submission claim.</span></label><button disabled={!submissionConfirmed || !provider.trim() || !submissionReference.trim() || !submissionEvidence.trim() || !submissionAt || recordSubmission.isPending} onClick={() => recordSubmission.mutate()} className="mt-3 w-full rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40">Record real submission receipt</button></div>}

    {(acquisition?.status === "submitted" || (acquisition?.status === "response_received" && acquisition.latestResponse?.responseType !== "award_offer")) && <div data-testid={EXECUTION_MISSION.acquisitionResponse} className="rounded-sm border border-gold/30 p-3"><div className="text-sm font-semibold text-gold">4. Record genuine client response</div><div className="mt-3 grid gap-2 sm:grid-cols-2"><select value={responseType} onChange={(e) => setResponseType(e.target.value)} className={field}><option value="client_message">Client message</option><option value="revision_request">Revision request</option><option value="award_offer">Award / accepted quotation</option><option value="rejected">Rejected / no award</option></select><input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Verified counterparty" className={field}/><input value={responseReference} onChange={(e) => setResponseReference(e.target.value)} placeholder="Response/award reference" className={field}/><input type="datetime-local" value={responseAt} onChange={(e) => setResponseAt(e.target.value)} className={field}/></div><textarea value={responseEvidence} onChange={(e) => setResponseEvidence(e.target.value)} rows={2} placeholder="Client response evidence" className={`${field} mt-2`}/><label className="mt-3 flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={responseConfirmed} onChange={(e) => setResponseConfirmed(e.target.checked)}/><span>I reviewed genuine client response evidence and confirm it belongs to this submitted proposal. An award offer still needs full terms verification.</span></label><button disabled={!responseConfirmed || !counterparty.trim() || !responseReference.trim() || !responseEvidence.trim() || !responseAt || recordResponse.isPending} onClick={() => recordResponse.mutate()} className="mt-3 w-full rounded-sm bg-gold px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40">Record client response</button></div>}

    {acquisition?.status === "response_received" && acquisition.latestResponse?.responseType === "award_offer" && !existingMission && <div data-testid={EXECUTION_MISSION.acquisitionAward} className="rounded-sm border border-state-success/40 bg-state-success/5 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-state-success"><CheckCircle size={17}/>5. Verify award terms + create mission</div><p className="mt-2 text-xs text-text_muted">The award message is evidence, but GARUDA starts work only after the exact brief, price, deadline, acceptance criteria, and authority are confirmed.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Verified client/counterparty" className={field}/><select value={engagementChannel} onChange={(e) => setEngagementChannel(e.target.value)} className={field}><option value="platform_message">Platform message</option><option value="email">Email</option><option value="signed_document">Signed document</option><option value="purchase_order">Purchase order</option></select><select value={evidenceKind} onChange={(e) => setEvidenceKind(e.target.value)} className={field}><option value="platform_award">Platform award</option><option value="accepted_quotation">Accepted quotation</option><option value="signed_contract">Signed contract</option><option value="purchase_order">Purchase order</option></select><input value={awardReference} onChange={(e) => setAwardReference(e.target.value)} placeholder="Award/contract reference" className={field}/><input type="datetime-local" value={awardAt} onChange={(e) => setAwardAt(e.target.value)} className={field}/><input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={field}/></div><input value={briefTitle} onChange={(e) => setBriefTitle(e.target.value)} placeholder="Client-confirmed brief title" className={`${field} mt-2`}/><input value={deliverableType} onChange={(e) => setDeliverableType(e.target.value)} placeholder="Deliverable type" className={`${field} mt-2`}/><textarea value={scopeSummary} onChange={(e) => setScopeSummary(e.target.value)} rows={2} placeholder="Exact client-confirmed scope" className={`${field} mt-2`}/><textarea value={requiredInputs} onChange={(e) => setRequiredInputs(e.target.value)} rows={2} placeholder="Required inputs — one per line" className={`${field} mt-2`}/><div className="mt-2 grid grid-cols-[1fr_100px] gap-2"><input type="number" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Confirmed price" className={field}/><input value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={3} className={field}/></div><textarea value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} rows={3} placeholder="Acceptance criteria — one per line" className={`${field} mt-2`}/><label className="mt-3 flex items-start gap-2 text-xs text-text_secondary"><input type="checkbox" checked={awardConfirmed} onChange={(e) => setAwardConfirmed(e.target.checked)}/><span>I verified the client identity and award evidence. The client accepted this exact brief, price, deadline, terms, and acceptance criteria; every field is genuine production data with no placeholder values.</span></label><button disabled={!awardReady || createMission.isPending} onClick={() => createMission.mutate()} className="mt-3 w-full rounded-sm bg-state-success px-3 py-2 text-sm font-semibold text-bg disabled:opacity-40">Verify award + create governed mission</button></div>}

    {acquisition?.status === "closed_no_award" && <div className="rounded-sm border border-state-danger/40 p-3 text-xs text-state-danger">No contract was won. No mission, delivery, revenue, or payment claim was created.</div>}
    {acquisition?.status === "mission_created" && <div className="flex items-start gap-2 rounded-sm border border-state-success/40 p-3 text-xs text-state-success"><CheckCircle size={17} weight="fill"/><span>Verified client award is linked to the governed mission. Continue through delivery, acceptance, and signed payment verification.</span></div>}
    {acquisition && <div data-testid={EXECUTION_MISSION.acquisitionAudit} className="rounded-sm border border-gborder p-3"><div className="g-label">Acquisition audit chain</div><div className="mt-2 space-y-1">{acquisition.auditTrail.map((event) => <div key={event.eventHash} className="flex justify-between gap-2 font-mono text-[10px] text-text_muted"><span>#{event.sequence} {event.eventType}</span><span>{event.eventHash.slice(0, 12)}…</span></div>)}</div></div>}
    <div className="flex items-center gap-2 text-[10px] text-text_muted"><LockKey size={13} className="text-gold"/>No automated application, contract acceptance, payment, or credential storage.</div>
    {error && <div className="text-xs text-state-danger">{formatApiError(error)}</div>}
  </div>;
}
