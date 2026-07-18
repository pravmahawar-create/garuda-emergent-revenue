import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Activity } from "@/types";
import { formatRelative, formatDate } from "@/lib/format";
import { ACT } from "@/constants/testIds";
import {
  Target,
  ListChecks,
  CurrencyCircleDollar,
  User,
  Lightning,
} from "@phosphor-icons/react";

const ICON_MAP: Record<string, any> = {
  opportunity_created: Target,
  opportunity_updated: Target,
  opportunity_stage_changed: Target,
  opportunity_deleted: Target,
  task_created: ListChecks,
  task_updated: ListChecks,
  task_completed: ListChecks,
  task_deleted: ListChecks,
  revenue_recorded: CurrencyCircleDollar,
  revenue_updated: CurrencyCircleDollar,
  revenue_deleted: CurrencyCircleDollar,
  user_login: User,
  user_register: User,
};

export default function ActivityPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: async () => (await api.get<Activity[]>("/activity?limit=100")).data,
  });

  const grouped = groupByDate(items);

  return (
    <div data-testid={ACT.page} className="animate-fade-in-up space-y-6">
      <div>
        <div className="g-label">Signal</div>
        <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Activity Timeline</h1>
        <p className="mt-2 max-w-2xl text-sm text-text_secondary">
          Every operator action is logged here, ready to be consumed by future AI agents
          for pattern recognition and coaching.
        </p>
      </div>

      <div data-testid={ACT.feed} className="g-card p-8">
        {isLoading ? (
          <div className="text-center text-text_muted">Loading timeline…</div>
        ) : items.length === 0 ? (
          <div className="text-center text-text_muted">No activity yet.</div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([day, entries]) => (
              <div key={day}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-text_muted">{day}</div>
                  <div className="h-px flex-1 bg-gborder" />
                </div>
                <ol className="relative pl-6 border-l border-gborder">
                  {entries.map((a) => {
                    const Icon = ICON_MAP[a.type] || Lightning;
                    return (
                      <li key={a.id} className="relative mb-6 last:mb-0">
                        <span className="absolute -left-[27px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gborder bg-bg">
                          <Icon size={11} color="#D4AF37" weight="fill" />
                        </span>
                        <div className="text-sm text-text_primary">{a.title}</div>
                        <div className="mt-1 text-[11px] text-text_muted">
                          {formatRelative(a.createdAt)} · {a.type.replace(/_/g, " ")}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDate(items: Activity[]): Array<[string, Activity[]]> {
  const map = new Map<string, Activity[]>();
  for (const a of items) {
    const key = formatDate(a.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries());
}
