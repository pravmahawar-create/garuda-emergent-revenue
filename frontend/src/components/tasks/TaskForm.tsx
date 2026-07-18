import React, { useState } from "react";
import { api, formatApiError } from "@/lib/api";
import type { Task, TaskStatus, TaskPriority, Opportunity } from "@/types";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/types";
import { X } from "@phosphor-icons/react";
import { TASK } from "@/constants/testIds";
import { toast } from "sonner";

interface Props {
  initial: Task | null;
  opportunities: Opportunity[];
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskForm({ initial, opportunities, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status || "todo");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority || "medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : "");
  const [opportunityId, setOpportunityId] = useState<string>(initial?.opportunityId || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        title,
        description: description || undefined,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        opportunityId: opportunityId || undefined,
      };
      if (initial) {
        await api.patch(`/tasks/${initial.id}`, payload);
        toast.success("Task updated");
      } else {
        await api.post("/tasks", payload);
        toast.success("Task created");
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
      <div data-testid={TASK.form} className="w-full max-w-lg overflow-hidden rounded-md border border-gborder bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-gborder px-6 py-4">
          <div>
            <div className="g-label">{initial ? "Edit" : "New"}</div>
            <h3 className="mt-1 font-heading text-xl tracking-tight">
              {initial ? "Edit task" : "New task"}
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
              data-testid={TASK.formTitle}
              className="g-input mt-2 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="g-label">Description</label>
            <textarea
              className="g-input mt-2 min-h-[80px] w-full resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="g-label">Priority</label>
              <select
                data-testid={TASK.formPriority}
                className="g-input mt-2 w-full"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="g-label">Status</label>
              <select
                data-testid={TASK.formStatus}
                className="g-input mt-2 w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="g-label">Due date</label>
              <input
                data-testid={TASK.formDue}
                type="date"
                className="g-input mt-2 w-full"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>{o.title}</option>
                ))}
              </select>
            </div>
          </div>

          {err && (
            <div className="rounded-sm border border-state-danger/40 bg-state-danger/10 px-4 py-3 text-sm text-state-danger">
              {err}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" data-testid={TASK.formCancel} onClick={onClose} className="g-btn-secondary">
              Cancel
            </button>
            <button type="submit" data-testid={TASK.formSubmit} disabled={busy} className="g-btn-primary">
              {busy ? "Saving…" : initial ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
