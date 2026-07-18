import React, { useState } from "react";
import { api, formatApiError } from "@/lib/api";
import type { Opportunity, OppStage } from "@/types";
import { OPP_STAGES, OPP_STAGE_LABEL } from "@/types";
import { X } from "@phosphor-icons/react";
import { OPP } from "@/constants/testIds";
import { toast } from "sonner";

interface Props {
  initial: Opportunity | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function OpportunityForm({ initial, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [client, setClient] = useState(initial?.client || "");
  const [source, setSource] = useState(initial?.source || "direct");
  const [stage, setStage] = useState<OppStage>(initial?.stage || "prospect");
  const [potentialValue, setPotentialValue] = useState<number>(initial?.potentialValue || 0);
  const [currency, setCurrency] = useState(initial?.currency || "USD");
  const [probability, setProbability] = useState<number>(initial?.probability ?? 25);
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    initial?.expectedCloseDate ? initial.expectedCloseDate.slice(0, 10) : "",
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
        title,
        client,
        source,
        stage,
        potentialValue: Number(potentialValue),
        currency,
        probability: Number(probability),
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : undefined,
        notes: notes || undefined,
      };
      if (initial) {
        await api.patch(`/opportunities/${initial.id}`, payload);
        toast.success("Opportunity updated");
      } else {
        await api.post("/opportunities", payload);
        toast.success("Opportunity created");
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
      <div data-testid={OPP.form} className="w-full max-w-lg overflow-hidden rounded-md border border-gborder bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-gborder px-6 py-4">
          <div>
            <div className="g-label">{initial ? "Edit" : "New"}</div>
            <h3 className="mt-1 font-heading text-xl tracking-tight">
              {initial ? initial.title : "New opportunity"}
            </h3>
          </div>
          <button onClick={onClose} className="g-btn-ghost !p-2" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
          <div>
            <label className="g-label">Title</label>
            <input
              data-testid={OPP.formTitle}
              className="g-input mt-2 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="g-label">Client</label>
              <input
                data-testid={OPP.formClient}
                className="g-input mt-2 w-full"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="g-label">Source</label>
              <input
                data-testid={OPP.formSource}
                className="g-input mt-2 w-full"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="g-label">Potential value</label>
              <input
                data-testid={OPP.formValue}
                type="number"
                min={0}
                className="g-input mt-2 w-full"
                value={potentialValue}
                onChange={(e) => setPotentialValue(Number(e.target.value))}
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
              <label className="g-label">Stage</label>
              <select
                data-testid={OPP.formStage}
                className="g-input mt-2 w-full"
                value={stage}
                onChange={(e) => setStage(e.target.value as OppStage)}
              >
                {OPP_STAGES.map((s) => (
                  <option key={s} value={s}>{OPP_STAGE_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="g-label">Probability (%)</label>
              <input
                data-testid={OPP.formProbability}
                type="number"
                min={0}
                max={100}
                className="g-input mt-2 w-full"
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="g-label">Expected close</label>
            <input
              type="date"
              className="g-input mt-2 w-full"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </div>
          <div>
            <label className="g-label">Notes</label>
            <textarea
              data-testid={OPP.formNotes}
              className="g-input mt-2 w-full min-h-[100px] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Deal context, decision makers, next steps…"
            />
          </div>

          {err && (
            <div className="rounded-sm border border-state-danger/40 bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
              {err}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              data-testid={OPP.formCancel}
              onClick={onClose}
              className="g-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid={OPP.formSubmit}
              disabled={busy}
              className="g-btn-primary"
            >
              {busy ? "Saving…" : initial ? "Save changes" : "Create opportunity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
