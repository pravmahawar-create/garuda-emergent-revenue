import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AFFILIATE } from "@/constants/testIds";

type PilotStatus = { verifiedOffers: number; campaignsPublished: number; genuineConversions: number; verifiedCommissions: number; verifiedPaymentsReceived: number };
type AffiliateCase = {
  id: string; provider: string; externalOfferId: string; caseKey: string; status: string;
  offer: any; campaign?: any; handoff?: any; publication?: any; conversion?: any; commission?: any; payment?: any;
};

const inputClass = "w-full rounded-sm border border-gborder bg-bg px-3 py-2.5 text-sm text-text_primary outline-none placeholder:text-text_muted focus:border-gold";
const buttonClass = "rounded-sm border border-gold/50 bg-gold px-4 py-2.5 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40";

function Failure({ error }: { error: unknown }) {
  if (!error) return null;
  const value = error as any;
  return <div className="mt-3 border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{value?.response?.data?.message || value?.message || "Request failed"}</div>;
}

function Confirm({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: React.ReactNode }) {
  return <label className="flex items-start gap-3 text-sm text-text_secondary"><input className="mt-1" type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span>{children}</span></label>;
}

function Stage({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-sm border border-gold/30 bg-elevated/30 p-5"><h3 className="mb-4 font-heading text-xl text-gold">{title}</h3>{children}</section>;
}

export default function AffiliatePilotPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ currency: "USD", commissionType: "percentage", channel: "owned_website", payoutStatus: "payable" });
  const set = (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((old) => ({ ...old, [name]: event.target.value }));
  const status = useQuery({ queryKey: ["affiliate-pilot-status"], queryFn: async () => (await api.get<PilotStatus>("/garuda-core/affiliate-pilot/status")).data, refetchInterval: 30000 });
  const cases = useQuery({ queryKey: ["affiliate-pilot-cases"], queryFn: async () => (await api.get<AffiliateCase[]>("/garuda-core/affiliate-pilot/cases")).data, refetchInterval: 30000 });
  const casesList = Array.isArray(cases.data)
    ? cases.data
    : Array.isArray((cases.data as any)?.cases)
    ? (cases.data as any).cases
    : [];
  const selected = useMemo(() => casesList.find((item: any) => item.id === selectedId) || casesList[0], [casesList, selectedId]);
  const refresh = () => { setConfirmed(false); setForm((old) => ({ currency: old.currency || "USD", commissionType: old.commissionType || "percentage", channel: old.channel || "owned_website", payoutStatus: old.payoutStatus || "payable" })); qc.invalidateQueries({ queryKey: ["affiliate-pilot-cases"] }); qc.invalidateQueries({ queryKey: ["affiliate-pilot-status"] }); };

  const create = useMutation({ mutationFn: async () => (await api.post<AffiliateCase>("/garuda-core/affiliate-pilot/offers", {
    founderApproved: true, provider: form.provider, externalOfferId: form.externalOfferId, title: form.title, seller: form.seller,
    category: form.category, officialOfferUrl: form.officialOfferUrl, affiliateTrackingUrl: form.affiliateTrackingUrl,
    currentTermsUrl: form.currentTermsUrl, promotionalRulesUrl: form.promotionalRulesUrl,
    commissionType: form.commissionType, commissionValue: Number(form.commissionValue), currency: form.currency,
    sourceVerifiedAt: new Date().toISOString(), sourceReviewed: confirmed, promotionalRulesReviewed: confirmed,
    sellerPromotionAllowedConfirmed: confirmed, authorizedEligibleOperatorConfirmed: confirmed,
    currentPlatformTermsReviewed: confirmed, regionalEligibilityConfirmed: confirmed,
    trackingLinkOwnedByAuthorizedOperator: confirmed, noCredentialsStored: confirmed
  })).data, onSuccess: (value) => { setSelectedId(value.id); refresh(); } });

  const draft = useMutation({ mutationFn: async () => (await api.post(`/garuda-core/affiliate-pilot/cases/${selected?.id}/campaign`, {
    founderApproved: true, channel: form.channel, channelRulesReviewed: confirmed, audienceOptInConfirmed: form.channel !== "opt_in_email" || confirmed,
    audience: form.audience, headline: form.headline, body: form.body, callToAction: form.callToAction, disclosure: form.disclosure
  })).data, onSuccess: refresh });
  const handoff = useMutation({ mutationFn: async () => (await api.post(`/garuda-core/affiliate-pilot/cases/${selected?.id}/handoff`, {
    founderApproved: true, campaignHash: selected?.campaign?.campaignHash, destination: form.destination,
    campaignReviewed: confirmed, offerRulesRechecked: confirmed, authorizedEligibleOperatorConfirmed: confirmed,
    channelAccountAuthorized: confirmed, disclosureVisibleConfirmed: confirmed, noMisrepresentationConfirmed: confirmed,
    noSpamOrFakeTrafficConfirmed: confirmed
  })).data, onSuccess: refresh });
  const publication = useMutation({ mutationFn: async () => (await api.post(`/garuda-core/affiliate-pilot/cases/${selected?.id}/publication`, {
    founderApproved: true, handoffHash: selected?.handoff?.handoffHash, publicUrl: form.publicUrl,
    providerReference: form.providerReference, evidence: form.publicationEvidence, publishedAt: form.publishedAt,
    publicationActuallyCompleted: confirmed, sameApprovedCampaign: confirmed, platformRulesFollowed: confirmed,
    authorizedEligibleOperatorUsed: confirmed, disclosureVisible: confirmed, noAutomationOrSpam: confirmed
  })).data, onSuccess: refresh });
  const conversion = useMutation({ mutationFn: async () => (await api.post(`/garuda-core/affiliate-pilot/cases/${selected?.id}/conversion`, {
    founderApproved: true, publicationHash: selected?.publication?.publicationHash, providerTransactionId: form.providerTransactionId,
    trackingId: form.trackingId, evidence: form.conversionEvidence, convertedAt: form.convertedAt,
    providerReportReviewed: confirmed, conversionActuallyOccurred: confirmed, notSelfReferral: confirmed,
    notFakeOrIncentivizedTraffic: confirmed, trackingMatchesCampaign: confirmed
  })).data, onSuccess: refresh });
  const commission = useMutation({ mutationFn: async () => (await api.post(`/garuda-core/affiliate-pilot/cases/${selected?.id}/commission`, {
    founderApproved: true, conversionHash: selected?.conversion?.conversionHash, amount: Number(form.amount), currency: form.currency,
    payoutStatus: form.payoutStatus, providerCommissionId: form.providerCommissionId, evidence: form.commissionEvidence,
    providerCommissionReportReviewed: confirmed, transactionMatchesConversion: confirmed, amountConfirmedByProvider: confirmed
  })).data, onSuccess: refresh });
  const payment = useMutation({ mutationFn: async () => (await api.post(`/garuda-core/affiliate-pilot/cases/${selected?.id}/payment`, {
    founderApproved: true, commissionHash: selected?.commission?.commissionHash, amount: Number(form.amount), currency: form.currency,
    providerPayoutId: form.providerPayoutId, receiptReference: form.receiptReference, evidence: form.paymentEvidence, receivedAt: form.receivedAt,
    paymentActuallyReceived: confirmed, providerPayoutReportReviewed: confirmed, amountAndCurrencyMatch: confirmed,
    destinationAccountOwnedByAuthorizedOperator: confirmed
  })).data, onSuccess: refresh });
  const metric = status.data || { verifiedOffers: 0, campaignsPublished: 0, genuineConversions: 0, verifiedCommissions: 0, verifiedPaymentsReceived: 0 };

  return <div data-testid={AFFILIATE.page} className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <header><div className="text-xs uppercase tracking-[0.25em] text-gold">Real revenue truth chain</div><h1 className="mt-2 font-heading text-4xl text-text_primary">Affiliate Conversion Pilot</h1><p className="mt-2 max-w-4xl text-text_secondary">One verified offer, one compliant campaign, one genuine conversion. GARUDA records revenue only after provider evidence and matching received payment.</p></header>
    <div className="border border-gold/40 bg-gold/5 p-4 text-sm text-text_secondary"><strong className="text-gold">Hard boundary:</strong> No credentials, fake clicks, self-referrals, spam, automatic publishing, unsupported claims, or age-restricted offers. Current platform rules and an authorized eligible operator are required.</div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["Verified offers", metric.verifiedOffers], ["Published", metric.campaignsPublished], ["Conversions", metric.genuineConversions], ["Commissions", metric.verifiedCommissions], ["Payments received", metric.verifiedPaymentsReceived]].map(([label, value]) => <div key={String(label)} className="border border-gborder bg-elevated/40 p-4"><div className="text-xs uppercase tracking-wider text-text_muted">{label}</div><div className="mt-2 font-heading text-3xl text-text_primary">{value}</div></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-3" data-testid={AFFILIATE.cases}><h2 className="font-heading text-2xl">Pilot cases</h2>{cases.data?.length ? cases.data.map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setConfirmed(false); }} className={`w-full border p-4 text-left ${selected?.id === item.id ? "border-gold bg-gold/5" : "border-gborder bg-elevated/30"}`}><div className="text-sm text-text_primary">{item.offer.title}</div><div className="mt-1 text-xs uppercase tracking-wider text-gold">{item.status.replaceAll("_", " ")}</div><div className="mt-1 text-xs text-text_muted">{item.provider}</div></button>) : <div className="border border-dashed border-gborder p-4 text-sm text-text_muted">No runtime case exists. Start with one genuinely reviewed offer.</div>}</aside>
      <main className="space-y-5" data-testid={AFFILIATE.workflow}>
        {!selected && <Stage title="1. Verify one real offer"><div className="grid gap-3 sm:grid-cols-2">{[
          ["provider", "Marketplace/provider"], ["externalOfferId", "Official offer ID"], ["title", "Offer title"], ["seller", "Seller"], ["category", "Category"],
          ["officialOfferUrl", "Official HTTPS offer URL"], ["affiliateTrackingUrl", "Authorized HTTPS tracking URL"], ["currentTermsUrl", "Current platform terms URL"], ["promotionalRulesUrl", "Offer promotion rules URL"], ["commissionValue", "Commission value"]
        ].map(([name, placeholder]) => <input key={name} className={inputClass} placeholder={placeholder} value={form[name] || ""} onChange={set(name)} />)}<select className={inputClass} value={form.commissionType} onChange={set("commissionType")}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select><input className={inputClass} placeholder="Currency (USD)" value={form.currency} onChange={set("currency")} /></div><div className="mt-4"><Confirm checked={confirmed} onChange={setConfirmed}>I reviewed the exact current offer, seller rules, platform terms, regional eligibility, and tracking ownership. The external account is controlled by an authorized eligible operator; no credentials are stored in GARUDA.</Confirm></div><button data-testid={AFFILIATE.offerSubmit} className={`${buttonClass} mt-4`} disabled={!confirmed || create.isPending} onClick={() => create.mutate()}>Create verified offer intake</button><Failure error={create.error} /></Stage>}
        {selected && <div className="border border-gborder bg-elevated/30 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs uppercase tracking-wider text-gold">{selected.status.replaceAll("_", " ")}</div><h2 className="mt-1 font-heading text-2xl">{selected.offer.title}</h2><p className="text-sm text-text_muted">{selected.offer.seller} · {selected.provider}</p></div><a className="text-sm text-gold underline" href={selected.offer.officialOfferUrl} target="_blank" rel="noreferrer">Open verified source</a></div></div>}
        {selected?.status === "offer_verified" && <Stage title="2. Draft one grounded campaign"><div className="grid gap-3"><select className={inputClass} value={form.channel} onChange={set("channel")}><option value="owned_website">Owned website</option><option value="approved_social">Approved social account</option><option value="opt_in_email">Opt-in email only</option></select><input className={inputClass} placeholder="Truthful target audience" value={form.audience || ""} onChange={set("audience")} /><input className={inputClass} placeholder="Headline (no guarantees)" value={form.headline || ""} onChange={set("headline")} /><textarea className={inputClass} rows={5} placeholder="Grounded campaign copy" value={form.body || ""} onChange={set("body")} /><input className={inputClass} placeholder="Call to action" value={form.callToAction || ""} onChange={set("callToAction")} /><textarea className={inputClass} rows={2} placeholder="Clear affiliate disclosure" value={form.disclosure || ""} onChange={set("disclosure")} /></div><div className="mt-4"><Confirm checked={confirmed} onChange={setConfirmed}>I reviewed current channel rules; any email audience is genuinely opted in. This creates an internal draft only.</Confirm></div><button className={`${buttonClass} mt-4`} disabled={!confirmed || draft.isPending} onClick={() => draft.mutate()}>Generate compliant campaign draft</button><Failure error={draft.error} /></Stage>}
        {selected?.status === "campaign_drafted" && <Stage title="3. Approve exact manual handoff"><input className={inputClass} placeholder="Authorized publishing destination (HTTPS)" value={form.destination || ""} onChange={set("destination")} /><div className="mt-4"><Confirm checked={confirmed} onChange={setConfirmed}>I reviewed this exact campaign, source rules, disclosure and destination. The authorized operator is eligible; there is no impersonation, spam, fake traffic, or unsupported claim.</Confirm></div><button className={`${buttonClass} mt-4`} disabled={!confirmed || handoff.isPending} onClick={() => handoff.mutate()}>Approve manual publishing handoff</button><Failure error={handoff.error} /></Stage>}
        {selected?.status === "handoff_ready" && <Stage title="4. Record genuine publication"><div className="grid gap-3"><input className={inputClass} placeholder="Public HTTPS campaign URL" value={form.publicUrl || ""} onChange={set("publicUrl")} /><input className={inputClass} placeholder="Platform/post reference" value={form.providerReference || ""} onChange={set("providerReference")} /><textarea className={inputClass} placeholder="Publication evidence" value={form.publicationEvidence || ""} onChange={set("publicationEvidence")} /><input className={inputClass} type="datetime-local" value={form.publishedAt || ""} onChange={set("publishedAt")} /></div><div className="mt-4"><Confirm checked={confirmed} onChange={setConfirmed}>The authorized operator actually published the exact approved campaign, with visible disclosure and current rules followed. No bot posting or spam occurred.</Confirm></div><button className={`${buttonClass} mt-4`} disabled={!confirmed || publication.isPending} onClick={() => publication.mutate()}>Record publication receipt</button><Failure error={publication.error} /></Stage>}
        {selected?.status === "published" && <Stage title="5. Record provider-attributed conversion"><div className="grid gap-3"><input className={inputClass} placeholder="Provider transaction ID" value={form.providerTransactionId || ""} onChange={set("providerTransactionId")} /><input className={inputClass} placeholder="Tracking/campaign ID" value={form.trackingId || ""} onChange={set("trackingId")} /><textarea className={inputClass} placeholder="Provider conversion report evidence" value={form.conversionEvidence || ""} onChange={set("conversionEvidence")} /><input className={inputClass} type="datetime-local" value={form.convertedAt || ""} onChange={set("convertedAt")} /></div><div className="mt-4"><Confirm checked={confirmed} onChange={setConfirmed}>I reviewed the provider report. This is a real third-party conversion linked to this campaign—not self-referral, fake, purchased, or incentivized traffic.</Confirm></div><button className={`${buttonClass} mt-4`} disabled={!confirmed || conversion.isPending} onClick={() => conversion.mutate()}>Record genuine conversion</button><Failure error={conversion.error} /></Stage>}
        {selected?.status === "conversion_recorded" && <Stage title="6. Verify provider commission"><div className="grid gap-3 sm:grid-cols-2"><input className={inputClass} type="number" min="0" step="0.01" placeholder="Commission amount" value={form.amount || ""} onChange={set("amount")} /><input className={inputClass} placeholder="Currency" value={form.currency || ""} onChange={set("currency")} /><select className={inputClass} value={form.payoutStatus} onChange={set("payoutStatus")}><option value="pending">Pending</option><option value="payable">Payable</option><option value="paid">Paid by provider</option></select><input className={inputClass} placeholder="Provider commission ID" value={form.providerCommissionId || ""} onChange={set("providerCommissionId")} /></div><textarea className={`${inputClass} mt-3`} placeholder="Provider commission statement evidence" value={form.commissionEvidence || ""} onChange={set("commissionEvidence")} /><div className="mt-4"><Confirm checked={confirmed} onChange={setConfirmed}>The provider commission report matches this conversion and confirms the exact amount. I understand this is not cash received yet.</Confirm></div><button className={`${buttonClass} mt-4`} disabled={!confirmed || commission.isPending} onClick={() => commission.mutate()}>Verify genuine commission</button><Failure error={commission.error} /></Stage>}
        {selected?.status === "commission_verified" && <Stage title="7. Verify received payment"><div className="grid gap-3 sm:grid-cols-2"><input className={inputClass} type="number" min="0" step="0.01" placeholder={`Exact amount (${selected.commission?.amount || ""})`} value={form.amount || ""} onChange={set("amount")} /><input className={inputClass} placeholder={`Currency (${selected.commission?.currency || ""})`} value={form.currency || ""} onChange={set("currency")} /><input className={inputClass} placeholder="Provider payout ID" value={form.providerPayoutId || ""} onChange={set("providerPayoutId")} /><input className={inputClass} placeholder="Destination receipt reference" value={form.receiptReference || ""} onChange={set("receiptReference")} /><textarea className={inputClass} placeholder="Matched payout evidence" value={form.paymentEvidence || ""} onChange={set("paymentEvidence")} /><input className={inputClass} type="datetime-local" value={form.receivedAt || ""} onChange={set("receivedAt")} /></div><div className="mt-4"><Confirm checked={confirmed} onChange={setConfirmed}>The payment was actually received into the authorized operator’s destination account, and provider payout, amount, currency, and receipt all match.</Confirm></div><button className={`${buttonClass} mt-4`} disabled={!confirmed || payment.isPending} onClick={() => payment.mutate()}>Record verified real earning</button><Failure error={payment.error} /></Stage>}
        {selected?.status === "payment_received" && <Stage title="Verified real earning"><div className="text-3xl font-heading text-success">{selected.payment?.currency} {selected.payment?.amount}</div><p className="mt-2 text-text_secondary">Provider payout and destination receipt matched. This case can now enter settlement reporting.</p></Stage>}
      </main>
    </div>
  </div>;
}
