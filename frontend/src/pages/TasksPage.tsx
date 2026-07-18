import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api";
import type { Task, TaskStatus, TaskPriority, Opportunity } from "@/types";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/types";
import { TASK } from "@/constants/testIds";
import { Plus, PencilSimple, Trash, CheckCircle, Circle, WarningOctagon } from "@phosphor-icons/react";
import { formatDate } from "@/lib/format";
import TaskForm from "@/components/tasks/TaskForm";
import { toast } from "sonner";

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "text-text_muted",
  medium: "text-text_secondary",
  high: "text-state-warning",
  critical: "text-state-danger",
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  archived: "Archived",
};

export default function TasksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await api.get<Task[]>("/tasks")).data,
  });
  const { data: opps = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => (await api.get<Opportunity[]>("/opportunities")).data,
  });
  const oppMap = new Map(opps.map((o) => [o.id, o]));

  const patch = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Task> }) =>
      (await api.patch(`/tasks/${id}`, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e: any) => toast.error(formatApiError(e)),
  });
  const del = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/tasks/${id}`)).data,
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: any) => toast.error(formatApiError(e)),
  });

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const now = new Date();

  return (
    <div data-testid={TASK.page} className="animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="g-label">Execution</div>
          <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Task Manager</h1>
          <p className="mt-2 max-w-xl text-sm text-text_secondary">
            Every task linked to an opportunity moves revenue forward.
          </p>
        </div>
        <button
          data-testid={TASK.newBtn}
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="g-btn-primary"
        >
          <Plus size={14} /> New task
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", ...TASK_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as TaskStatus | "all")}
            className={`rounded-sm border px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${
              filter === s
                ? "border-gold bg-gold/10 text-gold"
                : "border-gborder bg-elevated/50 text-text_secondary hover:border-gold/40 hover:text-text_primary"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABEL[s as TaskStatus]}
          </button>
        ))}
      </div>

      <div className="g-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text_muted">Loading tasks…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-text_muted">No tasks in this view.</div>
        ) : (
          <ul>
            {filtered.map((t) => {
              const overdue = t.dueDate && new Date(t.dueDate) < now && t.status !== "done";
              const done = t.status === "done";
              const opp = t.opportunityId ? oppMap.get(t.opportunityId) : null;
              return (
                <li
                  key={t.id}
                  className="group flex items-center gap-4 border-b border-gborder px-6 py-4 last:border-0 hover:bg-elevated/50 transition-colors"
                >
                  <button
                    onClick={() =>
                      patch.mutate({ id: t.id, body: { status: done ? "todo" : "done" } as any })
                    }
                    className="text-text_muted transition-colors hover:text-gold"
                    aria-label={done ? "Mark incomplete" : "Mark done"}
                  >
                    {done ? (
                      <CheckCircle size={20} weight="fill" color="#4ADE80" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm ${
                        done ? "text-text_muted line-through" : "text-text_primary"
                      }`}
                    >
                      {t.title}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-text_muted">
                      <span className={`uppercase tracking-widest ${PRIORITY_COLOR[t.priority]}`}>
                        {t.priority}
                      </span>
                      <span>·</span>
                      <span>{STATUS_LABEL[t.status]}</span>
                      {opp && (
                        <>
                          <span>·</span>
                          <span className="text-text_secondary">{opp.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`hidden shrink-0 text-xs sm:block ${overdue ? "text-state-danger" : "text-text_muted"}`}>
                    {overdue && <WarningOctagon size={12} className="mr-1 inline" />}
                    {t.dueDate ? formatDate(t.dueDate) : "No due date"}
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => { setEditing(t); setFormOpen(true); }} className="g-btn-ghost !p-2" aria-label="Edit">
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => confirm(`Delete "${t.title}"?`) && del.mutate(t.id)}
                      className="g-btn-ghost !p-2 hover:!text-state-danger"
                      aria-label="Delete"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {formOpen && (
        <TaskForm
          initial={editing}
          opportunities={opps}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            qc.invalidateQueries({ queryKey: ["tasks"] });
            qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
            qc.invalidateQueries({ queryKey: ["activity"] });
          }}
        />
      )}
    </div>
  );
}
