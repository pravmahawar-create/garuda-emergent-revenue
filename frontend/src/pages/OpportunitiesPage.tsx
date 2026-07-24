import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api";
import type { Opportunity, OppStage } from "@/types";
import { OPP_STAGES, OPP_STAGE_LABEL } from "@/types";
import { OPP } from "@/constants/testIds";
import { Plus, SquaresFour, ListBullets, PencilSimple, Trash } from "@phosphor-icons/react";
import { formatCurrency, formatDate } from "@/lib/format";
import OpportunityForm from "@/components/opportunities/OpportunityForm";
import { toast } from "sonner";

type View = "kanban" | "list";

const STAGE_COLOR: Record<OppStage, string> = {
  prospect: "text-text_secondary",
  qualified: "text-gold",
  proposal: "text-gold",
  negotiation: "text-state-warning",
  won: "text-state-success",
  lost: "text-state-danger",
};

export default function OpportunitiesPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("kanban");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);

  const { data: rawItems, isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => (await api.get<Opportunity[]>("/opportunities")).data,
  });

  const items = useMemo(
    () => (Array.isArray(rawItems) ? rawItems : Array.isArray((rawItems as any)?.opportunities) ? (rawItems as any).opportunities : []),
    [rawItems]
  );

  const del = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/opportunities/${id}`)).data,
    onSuccess: () => {
      toast.success("Opportunity deleted");
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e: any) => toast.error(formatApiError(e)),
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: OppStage }) =>
      (await api.patch(`/opportunities/${id}`, { stage })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opportunities"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e: any) => toast.error(formatApiError(e)),
  });

  const grouped = useMemo(() => {
    const g: Record<OppStage, Opportunity[]> = {
      prospect: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [],
    };
    for (const o of items) g[o.stage].push(o);
    return g;
  }, [items]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (o: Opportunity) => { setEditing(o); setFormOpen(true); };

  return (
    <div data-testid={OPP.page} className="animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="g-label">Pipeline</div>
          <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Opportunity Manager</h1>
          <p className="mt-2 max-w-xl text-sm text-text_secondary">
            Track every deal from prospect to close. Drag stages, log context, watch the pipeline compound.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-sm border border-gborder bg-elevated/60 p-1">
            <button
              data-testid={OPP.viewToggleKanban}
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs transition-colors ${
                view === "kanban" ? "bg-surface text-gold" : "text-text_secondary hover:text-text_primary"
              }`}
            >
              <SquaresFour size={14} /> Kanban
            </button>
            <button
              data-testid={OPP.viewToggleList}
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs transition-colors ${
                view === "list" ? "bg-surface text-gold" : "text-text_secondary hover:text-text_primary"
              }`}
            >
              <ListBullets size={14} /> List
            </button>
          </div>
          <button data-testid={OPP.newBtn} onClick={openNew} className="g-btn-primary">
            <Plus size={14} /> New opportunity
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="g-card p-10 text-center text-text_muted">Loading opportunities…</div>
      ) : view === "kanban" ? (
        <div data-testid={OPP.kanban} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {OPP_STAGES.map((stage) => {
            const list = grouped[stage];
            const total = list.reduce((s, o) => s + o.potentialValue, 0);
            return (
              <div
                key={stage}
                className="g-card flex flex-col p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) updateStage.mutate({ id, stage });
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className={`text-xs uppercase tracking-widest ${STAGE_COLOR[stage]}`}>
                      {OPP_STAGE_LABEL[stage]}
                    </div>
                    <div className="mt-1 text-[11px] text-text_muted">{list.length} deals</div>
                  </div>
                  <div className="text-right font-heading text-sm text-text_primary">
                    {formatCurrency(total)}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {list.map((o) => (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", o.id)}
                      onClick={() => openEdit(o)}
                      className="g-elevated cursor-grab p-3 transition-colors hover:border-gold/40 active:cursor-grabbing"
                    >
                      <div className="mb-1 truncate text-sm font-semibold text-text_primary">{o.title}</div>
                      <div className="text-xs text-text_muted">{o.client}</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="font-heading text-sm text-gold">{formatCurrency(o.potentialValue, o.currency)}</div>
                        <div className="text-[10px] uppercase tracking-widest text-text_muted">{o.probability}%</div>
                      </div>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <div className="rounded-sm border border-dashed border-gborder p-4 text-center text-xs text-text_muted">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div data-testid={OPP.list} className="g-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gborder">
                <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.15em] text-text_muted">Opportunity</th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.15em] text-text_muted">Client</th>
                <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.15em] text-text_muted">Stage</th>
                <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.15em] text-text_muted">Value</th>
                <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.15em] text-text_muted">Close</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-b border-gborder last:border-0 hover:bg-elevated/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-text_primary">{o.title}</td>
                  <td className="px-6 py-4 text-sm text-text_secondary">{o.client}</td>
                  <td className={`px-6 py-4 text-sm ${STAGE_COLOR[o.stage]}`}>{OPP_STAGE_LABEL[o.stage]}</td>
                  <td className="px-6 py-4 text-right font-heading text-sm text-gold">{formatCurrency(o.potentialValue, o.currency)}</td>
                  <td className="px-6 py-4 text-right text-sm text-text_secondary">{formatDate(o.expectedCloseDate)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => openEdit(o)} className="g-btn-ghost !p-2" aria-label="Edit">
                        <PencilSimple size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${o.title}"?`)) del.mutate(o.id);
                        }}
                        className="g-btn-ghost !p-2 hover:!text-state-danger"
                        aria-label="Delete"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-text_muted">
                    No opportunities yet. Click "New opportunity" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <OpportunityForm
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            qc.invalidateQueries({ queryKey: ["opportunities"] });
            qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
            qc.invalidateQueries({ queryKey: ["activity"] });
          }}
        />
      )}
    </div>
  );
}
