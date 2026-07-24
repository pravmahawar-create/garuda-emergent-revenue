import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardSummary, RevenueAnalytics } from "@/types";
import { formatCurrency, formatCompact, formatRelative } from "@/lib/format";
import { DASH } from "@/constants/testIds";
import {
  TrendUp,
  TrendDown,
  Target,
  ChartLineUp,
  ListChecks,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Link } from "react-router-dom";
import { OPP_STAGE_LABEL, OppStage } from "@/types";

export default function DashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<DashboardSummary>("/dashboard/summary")).data,
  });
  const { data: analytics } = useQuery({
    queryKey: ["revenue-analytics"],
    queryFn: async () => (await api.get<RevenueAnalytics>("/dashboard/revenue-analytics")).data,
  });

  const k = summary?.kpis;
  const positiveGrowth = (k?.growthPct ?? 0) >= 0;

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          testId={DASH.kpiTotalRevenue}
          label="Total Revenue"
          value={k ? formatCurrency(k.totalRevenue) : "—"}
          hint="All-time booked"
          accent
        />
        <KpiCard
          testId={DASH.kpiMtdRevenue}
          label="This Month"
          value={k ? formatCurrency(k.mtdRevenue) : "—"}
          hint={
            k ? (
              <span className={positiveGrowth ? "text-state-success" : "text-state-danger"}>
                {positiveGrowth ? <TrendUp size={12} className="inline" /> : <TrendDown size={12} className="inline" />}{" "}
                {Math.abs(k.growthPct)}% vs last month
              </span>
            ) : (
              "—"
            )
          }
        />
        <KpiCard
          testId={DASH.kpiPipelineValue}
          label="Pipeline Value"
          value={k ? formatCurrency(k.pipelineValue) : "—"}
          hint={k ? `${k.pipelineCount} open opportunities` : "—"}
        />
        <KpiCard
          testId={DASH.kpiConversion}
          label="Conversion Rate"
          value={k ? `${k.conversionRate}%` : "—"}
          hint={k ? `${k.openTasks} tasks · ${k.overdueTasks} overdue` : "—"}
        />
      </div>

      {/* Revenue chart + Pipeline snapshot */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div
          data-testid={DASH.revenueChart}
          className="g-card p-6 xl:col-span-2"
        >
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="g-label">Revenue trajectory</div>
              <h3 className="mt-2 font-heading text-2xl tracking-tight">Last 6 months</h3>
            </div>
            <Link to="/analytics" className="g-btn-ghost">
              Deep dive <ArrowRight size={14} />
            </Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlySeries || []} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#222226" vertical={false} />
                <XAxis dataKey="label" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#71717A"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(Number(v))}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0F0F11",
                    border: "1px solid #222226",
                    borderRadius: 6,
                    color: "#FAFAFA",
                  }}
                  formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div data-testid={DASH.pipelineSnapshot} className="g-card p-6">
          <div className="g-label mb-2">Pipeline snapshot</div>
          <h3 className="font-heading text-2xl tracking-tight">By stage</h3>
          <div className="mt-6 space-y-4">
            {summary &&
              (() => {
                const breakdown = (summary.stageBreakdown ?? {}) as Record<string, { value: number; count: number }>;
                const stages = Object.keys(breakdown) as OppStage[];
                if (stages.length === 0) {
                  return <div className="text-sm text-text_muted">No pipeline data available.</div>;
                }
                const maxVal = Math.max(
                  ...Object.values(breakdown).map((x) => (x as any)?.value ?? 0),
                  1,
                );
                return stages.map((stage) => {
                  const s = breakdown[stage] ?? { value: 0, count: 0 };
                  const pct = Math.min(100, ((s.value ?? 0) / maxVal) * 100);
                  return (
                    <div key={stage}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text_secondary">{OPP_STAGE_LABEL[stage] || stage}</span>
                        <span className="font-body text-text_primary">
                          {formatCompact(s.value ?? 0)}
                          <span className="ml-2 text-xs text-text_muted">· {s.count ?? 0}</span>
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                        <div
                          className="h-full rounded-full bg-gold transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
          </div>
        </div>
      </div>

      {/* Recent activity + fast stats */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div data-testid={DASH.recentActivity} className="g-card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="g-label">Signal feed</div>
              <h3 className="mt-2 font-heading text-2xl tracking-tight">Recent activity</h3>
            </div>
            <Link to="/activity" className="g-btn-ghost">
              Full timeline <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative pl-6 border-l border-gborder">
            {(summary?.recentActivity || []).slice(0, 6).map((a) => (
              <div key={a.id} className="relative mb-6 last:mb-0">
                <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-bg" />
                <div className="text-sm text-text_primary">{a.title}</div>
                <div className="mt-1 text-xs text-text_muted">
                  {formatRelative(a.createdAt)} · {a.type.replace(/_/g, " ")}
                </div>
              </div>
            ))}
            {(!summary?.recentActivity || summary.recentActivity.length === 0) && (
              <div className="text-sm text-text_muted">No activity yet.</div>
            )}
          </div>
        </div>

        <div className="g-card p-6">
          <div className="g-label mb-2">Operator focus</div>
          <h3 className="font-heading text-2xl tracking-tight">Today</h3>
          <div className="mt-6 space-y-4">
            <FocusRow
              icon={<Target size={16} color="#D4AF37" weight="fill" />}
              label="Open pipeline"
              value={k ? formatCurrency(k.pipelineValue) : "—"}
              hint={k ? `${k.pipelineCount} deals` : ""}
            />
            <FocusRow
              icon={<ListChecks size={16} color="#D4AF37" weight="fill" />}
              label="Open tasks"
              value={k ? String(k.openTasks) : "—"}
              hint={k ? `${k.overdueTasks} overdue` : ""}
            />
            <FocusRow
              icon={<ChartLineUp size={16} color="#D4AF37" weight="fill" />}
              label="Month growth"
              value={k ? `${positiveGrowth ? "+" : ""}${k.growthPct}%` : "—"}
              hint="vs. previous"
              tone={positiveGrowth ? "success" : "danger"}
            />
          </div>
          <Link
            to="/opportunities"
            className="g-btn-secondary mt-6 w-full"
          >
            Open pipeline console
          </Link>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  testId,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  testId?: string;
  accent?: boolean;
}) {
  return (
    <div data-testid={testId} className={`g-card p-6 transition-colors hover:border-gold/40 ${accent ? "shadow-gold" : ""}`}>
      <div className="g-label">{label}</div>
      <div className="mt-3 kpi-value font-heading text-4xl text-text_primary sm:text-5xl">
        {value}
      </div>
      <div className="mt-3 text-xs text-text_muted">{hint}</div>
    </div>
  );
}

function FocusRow({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-gborder bg-elevated/60 px-4 py-3">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-xs uppercase tracking-widest text-text_muted">{label}</div>
          <div className="mt-0.5 text-xs text-text_muted">{hint}</div>
        </div>
      </div>
      <div className={`font-heading text-lg ${tone === "danger" ? "text-state-danger" : tone === "success" ? "text-state-success" : "text-text_primary"}`}>
        {value}
      </div>
    </div>
  );
}
