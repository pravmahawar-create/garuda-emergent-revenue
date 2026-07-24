import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api";
import type { RevenueRecord, Opportunity } from "@/types";
import { REV } from "@/constants/testIds";
import { Plus, Trash, PencilSimple } from "@phosphor-icons/react";
import { formatCurrency, formatDate } from "@/lib/format";
import RevenueForm from "@/components/revenue/RevenueForm";
import { toast } from "sonner";

export default function RevenuePage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RevenueRecord | null>(null);

  const { data: rawItems, isLoading } = useQuery({
    queryKey: ["revenue"],
    queryFn: async () => (await api.get<RevenueRecord[]>("/revenue")).data,
  });
  const { data: rawOpps } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => (await api.get<Opportunity[]>("/opportunities")).data,
  });

  const items: RevenueRecord[] = Array.isArray(rawItems) ? rawItems : Array.isArray((rawItems as any)?.records) ? (rawItems as any).records : [];
  const opps: Opportunity[] = Array.isArray(rawOpps) ? rawOpps : Array.isArray((rawOpps as any)?.opportunities) ? (rawOpps as any).opportunities : [];
  const oppMap = new Map<string, Opportunity>(opps.map((o: Opportunity) => [o.id, o]));

  const del = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/revenue/${id}`)).data,
    onSuccess: () => {
      toast.success("Revenue record deleted");
      qc.invalidateQueries({ queryKey: ["revenue"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["revenue-analytics"] });
    },
    onError: (e: any) => toast.error(formatApiError(e)),
  });

  const total = items.reduce((s, r) => s + r.amount, 0);

  return (
    <div data-testid={REV.page} className="animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="g-label">Earnings</div>
          <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Revenue Records</h1>
          <p className="mt-2 max-w-xl text-sm text-text_secondary">
            Log every dollar. Each record ties back to its originating opportunity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden rounded-sm border border-gborder bg-elevated/60 px-4 py-2 md:block">
            <div className="text-[10px] uppercase tracking-widest text-text_muted">Total booked</div>
            <div className="mt-0.5 font-heading text-lg text-gold">{formatCurrency(total)}</div>
          </div>
          <button
            data-testid={REV.newBtn}
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="g-btn-primary"
          >
            <Plus size={14} /> Record earnings
          </button>
        </div>
      </div>

      <div className="g-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gborder">
              <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.15em] text-text_muted">Date</th>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.15em] text-text_muted">Client</th>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.15em] text-text_muted">Source</th>
              <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.15em] text-text_muted">Opportunity</th>
              <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.15em] text-text_muted">Amount</th>
              <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.15em] text-text_muted">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-text_muted">Loading…</td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-text_muted">No revenue recorded yet.</td></tr>
            )}
            {items.map((r) => (
              <tr key={r.id} className="border-b border-gborder last:border-0 hover:bg-elevated/50 transition-colors">
                <td className="px-6 py-4 text-sm text-text_secondary">{formatDate(r.recordedAt)}</td>
                <td className="px-6 py-4 text-sm text-text_primary">{r.client}</td>
                <td className="px-6 py-4 text-sm text-text_secondary">{r.source}</td>
                <td className="px-6 py-4 text-sm text-text_secondary">
                  {r.opportunityId ? oppMap.get(r.opportunityId)?.title || "—" : "—"}
                </td>
                <td className="px-6 py-4 text-right font-heading text-sm text-gold">
                  {formatCurrency(r.amount, r.currency)}
                </td>
                <td className="px-6 py-4 text-right text-xs uppercase tracking-widest text-text_muted">{r.status}</td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => { setEditing(r); setFormOpen(true); }} className="g-btn-ghost !p-2">
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => confirm("Delete this revenue record?") && del.mutate(r.id)}
                      className="g-btn-ghost !p-2 hover:!text-state-danger"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <RevenueForm
          initial={editing}
          opportunities={opps}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            qc.invalidateQueries({ queryKey: ["revenue"] });
            qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
            qc.invalidateQueries({ queryKey: ["revenue-analytics"] });
            qc.invalidateQueries({ queryKey: ["activity"] });
          }}
        />
      )}
    </div>
  );
}
