import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api";
import type { Notification } from "@/types";
import { NOTIF } from "@/constants/testIds";
import { formatRelative } from "@/lib/format";
import { CheckCircle, Info, Warning, WarningOctagon } from "@phosphor-icons/react";
import { toast } from "sonner";

const LEVEL_META: Record<string, { icon: any; color: string }> = {
  info: { icon: Info, color: "#D4AF37" },
  success: { icon: CheckCircle, color: "#4ADE80" },
  warning: { icon: Warning, color: "#FBBF24" },
  critical: { icon: WarningOctagon, color: "#F87171" },
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<Notification[]>("/notifications")).data,
  });
  const markAll = useMutation({
    mutationFn: async () => (await api.post("/notifications/read-all")).data,
    onSuccess: () => {
      toast.success("All marked as read");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: any) => toast.error(formatApiError(e)),
  });
  const markOne = useMutation({
    mutationFn: async (id: string) => (await api.post(`/notifications/${id}/read`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div data-testid={NOTIF.page} className="animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="g-label">Inbox</div>
          <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Notifications</h1>
          <p className="mt-2 max-w-xl text-sm text-text_secondary">
            System signals and alerts. This surface will grow richer as Guardian and the AI agents come online.
          </p>
        </div>
        <button
          data-testid={NOTIF.markAllRead}
          onClick={() => markAll.mutate()}
          className="g-btn-secondary"
        >
          Mark all as read
        </button>
      </div>

      <div data-testid={NOTIF.list} className="g-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text_muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-text_muted">No notifications.</div>
        ) : (
          <ul>
            {items.map((n) => {
              const meta = LEVEL_META[n.level] || LEVEL_META.info;
              const Icon = meta.icon;
              return (
                <li
                  key={n.id}
                  onClick={() => !n.read && markOne.mutate(n.id)}
                  className={`flex cursor-pointer items-start gap-4 border-b border-gborder px-6 py-4 last:border-0 transition-colors hover:bg-elevated/50 ${
                    !n.read ? "bg-elevated/30" : ""
                  }`}
                >
                  <Icon size={18} weight="fill" color={meta.color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`truncate text-sm ${n.read ? "text-text_secondary" : "text-text_primary"}`}>
                        {n.title}
                      </div>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                    </div>
                    {n.body && <div className="mt-1 text-xs text-text_muted">{n.body}</div>}
                    <div className="mt-1 text-[11px] text-text_muted">{formatRelative(n.createdAt)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
