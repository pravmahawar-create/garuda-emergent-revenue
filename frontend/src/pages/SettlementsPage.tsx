import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { api, formatApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SettlementLedger } from "@/types";
import { SETTLEMENT } from "@/constants/testIds";

interface CoreStatus {
  connected: boolean;
  service: string;
  status: string;
}

export default function SettlementsPage() {
  const status = useQuery({
    queryKey: ["garuda-core-status"],
    queryFn: async () => (await api.get<CoreStatus>("/garuda-core/status")).data,
    refetchInterval: 30000,
  });
  const settlements = useQuery({
    queryKey: ["garuda-core-settlements"],
    queryFn: async () => (await api.get<SettlementLedger[]>("/garuda-core/settlements")).data,
    enabled: status.data?.connected === true,
  });

  const items: SettlementLedger[] = Array.isArray(settlements.data)
    ? settlements.data
    : Array.isArray((settlements.data as any)?.settlements)
    ? (settlements.data as any).settlements
    : [];
  const eligibleNet = items
    .filter((item) => item.payoutEligible && item.status !== "settled")
    .reduce((sum, item) => sum + item.netAmount, 0);

  return (
    <div data-testid={SETTLEMENT.page} className="animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="g-label">GARUDA Core</div>
          <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Settlement Ledger</h1>
          <p className="mt-2 text-sm text-text_secondary">Payout eligibility, fees, receipts, and settlement audit status.</p>
        </div>
        <div data-testid={SETTLEMENT.coreStatus} className="g-card flex items-center gap-3 px-4 py-3">
          {status.data?.connected ? <CheckCircle size={20} weight="fill" className="text-state-success" /> : <WarningCircle size={20} weight="fill" className="text-state-warning" />}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text_muted">Core connection</div>
            <div className="text-sm text-text_primary">{status.isLoading ? "Checking…" : status.data?.connected ? "Connected" : "Unavailable"}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="g-card p-5"><div className="g-label">Ledger entries</div><div className="mt-2 font-heading text-2xl">{items.length}</div></div>
        <div className="g-card p-5"><div className="g-label">Eligible net</div><div className="mt-2 font-heading text-2xl text-gold">{formatCurrency(eligibleNet, items[0]?.currency || "INR")}</div></div>
        <div className="g-card p-5"><div className="g-label">Settled</div><div className="mt-2 font-heading text-2xl">{items.filter((item) => item.status === "settled").length}</div></div>
      </div>

      {status.error && <div className="g-card border-state-danger/40 p-5 text-sm text-state-danger">{formatApiError(status.error)}</div>}
      {settlements.error && <div className="g-card border-state-danger/40 p-5 text-sm text-state-danger">{formatApiError(settlements.error)}</div>}

      <div data-testid={SETTLEMENT.table} className="g-card overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead><tr className="border-b border-gborder">
            {['Created', 'Status', 'Gross', 'Fee', 'Net', 'Eligible', 'Receipt / truth'].map((label) => <th key={label} className="px-5 py-3 text-left text-xs uppercase tracking-[0.15em] text-text_muted">{label}</th>)}
          </tr></thead>
          <tbody>
            {settlements.isLoading && <tr><td colSpan={7} className="px-5 py-10 text-center text-text_muted">Loading ledger…</td></tr>}
            {!settlements.isLoading && items.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-text_muted">No settlement entries yet.</td></tr>}
            {items.map((item) => <tr key={item.id} className="border-b border-gborder last:border-0">
              <td className="px-5 py-4 text-sm text-text_secondary">{formatDate(item.createdAt)}</td>
              <td className="px-5 py-4 text-xs uppercase tracking-widest">{item.status}</td>
              <td className="px-5 py-4">{formatCurrency(item.grossAmount, item.currency)}</td>
              <td className="px-5 py-4 text-text_secondary">{formatCurrency(item.feeAmount, item.currency)} ({item.feeRatePercent}%)</td>
              <td className="px-5 py-4 font-heading text-gold">{formatCurrency(item.netAmount, item.currency)}</td>
              <td className="px-5 py-4">{item.payoutEligible ? "Yes" : "No"}</td>
              <td className="px-5 py-4 text-text_secondary">{item.receiptReference || item.verificationEvidence?.providerReference || (item.eligibilityReasons || []).join(", ") || "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
