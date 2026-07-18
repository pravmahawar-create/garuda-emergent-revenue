import React, { useState } from "react";
import { api, formatApiError } from "@/lib/api";
import type { RevenueRecord, RevenueStatus, Opportunity } from "@/types";
import { REVENUE_STATUSES } from "@/types";
import { X } from "@phosphor-icons/react";
import { REV } from "@/constants/testIds";
import { toast } from "sonner";

interface Props {
  initial: RevenueRecord | null;
  opportunities: Opportunity[];
  onClose: () => void;
  onSaved: () => void;
}

export default function RevenueForm({ initial, opportunities, onClose, onSaved }: Props) {
  const [client, setClient] = useState(initial?.client || "");
  const [amount, setAmount] = useState<number>(initial?.amount || 0);
  const [currency, setCurrency] = useState(initial?.currency || "USD");
  const [source, setSource] = useState(initial?.source || "direct");
  const [status, setStatus] = useState<RevenueStatus>(initial?.status || "received");
  const [opportunityId, setOpportunityId] = useState<string>(initial?.opportunityId || "");
  const [recordedAt, setRecordedAt] = useState(
    initial?.recordedAt ? initial.recordedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState(initial?.notes || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        client,
        amount: Number(amount),
        currency,
        source,
        status,
        opportunityId: opportunityId || undefined,
        recordedAt: recordedAt ? new Date(recordedAt).toISOString() : undefined,
        notes: notes || undefined,
      };
      if (initial) {
        await api.patch(`/revenue/${initial.id}`, payload);
        toast.success("Revenue updated");
      } else {
        await api.post("/revenue", payload);
        toast.success("Revenue recorded");
      }
      onSaved();
    } catch (e: any) {
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm">
      <div data-testid={REV.form} className="w-full max-w-lg overflow-hidden rounded-md border border-gborder bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-gborder px-6 py-4">
          <div>
            <div className="g-label">{initial ? "Edit" : "New"}</div>
            <h3 className="mt-1 font-heading text-xl tracking-tight">
              {initial ? "Edit revenue record" : "Record earnings"}
            </h3>
          </div>
          <button onClick={onClose} className="g-btn-ghost !p-2"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
          <div>
            <label className="g-label">Client</label>
            <input
              data-testid={REV.formClient}
              className="g-input mt-2 w-full"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="g-label">Amount</label>
              <input
                data-testid={REV.formAmount}
                type="number"
                min={0}
                className="g-input mt-2 w-full"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="g-label">Currency</label>
              <input
                className="g-input mt-2 w-full"
                value={currency}
                maxLength={3}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="g-label">Source</label>
              <input
                data-testid={REV.formSource}
                className="g-input mt-2 w-full"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div>
              <label className="g-label">Status</label>
              <select
                className="g-input mt-2 w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value as RevenueStatus)}
              >
                {REVENUE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="g-label">Date recorded</label>
              <input
                data-testid={REV.formDate}
                type="date"
                className="g-input mt-2 w-full"
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
              />
            </div>
            <div>
              <label className="g-label">Linked opportunity</label>
              <select
                className="g-input mt-2 w-full"
                value={opportunityId}
                onChange={(e) => setOpportunityId(e.target.value)}
              >
                <option value="">— None —</option>
                {opportunities.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="g-label">Notes</label>
            <textarea
              className="g-input mt-2 min-h-[80px] w-full resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {err && (
            <div className="rounded-sm border border-state-danger/40 bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
              {err}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" data-testid={REV.formCancel} onClick={onClose} className="g-btn-secondary">Cancel</button>
            <button type="submit" data-testid={REV.formSubmit} disabled={busy} className="g-btn-primary">
              {busy ? "Saving…" : initial ? "Save changes" : "Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
