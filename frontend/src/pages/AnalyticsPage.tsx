import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RevenueAnalytics } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency, formatCompact } from "@/lib/format";
import { ANALYTICS } from "@/constants/testIds";

const SOURCE_COLORS = ["#D4AF37", "#F3CE5A", "#AA8A2A", "#4ADE80", "#FBBF24", "#F87171"];

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["revenue-analytics"],
    queryFn: async () => (await api.get<RevenueAnalytics>("/dashboard/revenue-analytics")).data,
  });

  return (
    <div data-testid={ANALYTICS.page} className="animate-fade-in-up space-y-6">
      <div>
        <div className="g-label">Insight</div>
        <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Revenue Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-text_secondary">
          Six-month rolling view of booked revenue by month, source, and client — the foundation
          for future forecasting by the Mother Brain.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div data-testid={ANALYTICS.monthlyChart} className="g-card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="g-label">Monthly booked revenue</div>
              <h3 className="mt-2 font-heading text-xl tracking-tight">Last 6 months</h3>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlySeries || []} margin={{ left: -10, right: 10, top: 10 }}>
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
                  contentStyle={{ background: "#0F0F11", border: "1px solid #222226", borderRadius: 6, color: "#FAFAFA" }}
                  cursor={{ fill: "rgba(212, 175, 55, 0.06)" }}
                  formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]}
                />
                <Bar dataKey="amount" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div data-testid={ANALYTICS.sourceChart} className="g-card p-6">
          <div className="g-label mb-2">By source</div>
          <h3 className="font-heading text-xl tracking-tight">Where deals originate</h3>
          <div className="mt-6 space-y-4">
            {(data?.bySource || []).map((s, i) => {
              const maxVal = Math.max(...(data?.bySource || []).map((x) => x.amount), 1);
              const pct = Math.min(100, (s.amount / maxVal) * 100);
              return (
                <div key={s.source}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-text_secondary">{s.source}</span>
                    <span className="font-body text-text_primary">{formatCompact(s.amount)}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data?.bySource || data.bySource.length === 0) && (
              <div className="text-sm text-text_muted">No revenue yet.</div>
            )}
          </div>
        </div>
      </div>

      <div data-testid={ANALYTICS.clientsTable} className="g-card overflow-hidden">
        <div className="border-b border-gborder px-6 py-4">
          <div className="g-label">Top clients</div>
          <h3 className="mt-2 font-heading text-xl tracking-tight">Revenue leaders</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gborder">
              <th className="px-6 py-3 text-left text-xs uppercase tracking-[0.15em] text-text_muted">Client</th>
              <th className="px-6 py-3 text-right text-xs uppercase tracking-[0.15em] text-text_muted">Total booked</th>
            </tr>
          </thead>
          <tbody>
            {(data?.topClients || []).map((c) => (
              <tr key={c.client} className="border-b border-gborder last:border-0 hover:bg-elevated/50 transition-colors">
                <td className="px-6 py-4 text-sm text-text_primary">{c.client}</td>
                <td className="px-6 py-4 text-right font-heading text-sm text-gold">
                  {formatCurrency(c.amount)}
                </td>
              </tr>
            ))}
            {(!data?.topClients || data.topClients.length === 0) && (
              <tr><td colSpan={2} className="px-6 py-10 text-center text-text_muted">No clients yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
