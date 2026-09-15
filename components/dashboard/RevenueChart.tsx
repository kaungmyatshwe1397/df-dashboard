// RevenueChart — interactive area chart showing revenue over time.
// Uses Recharts. Groups records by month_label for time-series data.

"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useData } from "@/context/DataContext";
import { RecordCategory } from "@/lib/global";
import { cn } from "@/lib/utils";

type Range = "7D" | "30D" | "90D" | "All";

const RANGE_OPTIONS: Range[] = ["7D", "30D", "90D", "All"];

interface ChartPoint {
  month: string;
  gpRevenue: number;
  caseRevenue: number;
  grossIncome: number;
}

function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                entry.name === "gpRevenue"
                  ? "var(--accent)"
                  : entry.name === "caseRevenue"
                    ? "#34D399"
                    : "var(--foreground)",
            }}
          />
          <span className="text-muted-foreground capitalize">
            {entry.name === "gpRevenue"
              ? "GP"
              : entry.name === "caseRevenue"
                ? "Case"
                : "Total"}
            :
          </span>
          <span className="font-medium tabular-nums">
            ${entry.value.toLocaleString("en-US")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart() {
  const { records, payments } = useData();
  const [range, setRange] = useState<Range>("All");

  const chartData = useMemo(() => {
    const monthOrder = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const byMonth = new Map<string, { gp: number; caseRev: number }>();

    for (const r of records) {
      const existing = byMonth.get(r.month_label) ?? { gp: 0, caseRev: 0 };
      if (r.category === RecordCategory.GP) {
        existing.gp += r.total_cost;
      }
      byMonth.set(r.month_label, existing);
    }

    const caseRecordIds = new Set(
      records.filter((r) => r.category === RecordCategory.CASE).map((r) => r.id)
    );
    for (const p of payments) {
      if (!caseRecordIds.has(p.record_id)) continue;
      const rec = records.find((r) => r.id === p.record_id);
      if (!rec) continue;
      const existing = byMonth.get(rec.month_label) ?? { gp: 0, caseRev: 0 };
      existing.caseRev += p.paid_amount;
      byMonth.set(rec.month_label, existing);
    }

    const points: ChartPoint[] = [];
    for (const [label, data] of byMonth) {
      points.push({
        month: label,
        gpRevenue: data.gp,
        caseRevenue: data.caseRev,
        grossIncome: data.gp + data.caseRev,
      });
    }

    points.sort((a, b) => {
      const aIdx = monthOrder.indexOf(a.month.split(" ")[0]);
      const bIdx = monthOrder.indexOf(b.month.split(" ")[0]);
      return aIdx - bIdx;
    });

    return points;
  }, [records, payments]);

  const filteredData = useMemo(() => {
    if (range === "All") return chartData;
    const now = new Date();
    const rangeDays = range === "7D" ? 7 : range === "30D" ? 30 : 90;
    const cutoff = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

    return chartData.filter((point) => {
      const [monthName, year] = point.month.split(" ");
      const monthIdx = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ].indexOf(monthName);
      const pointDate = new Date(parseInt(year), monthIdx, 1);
      return pointDate >= cutoff;
    });
  }, [chartData, range]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <div className="text-xs text-muted-foreground mb-4">Revenue over time</div>
        <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
          No data available yet. Add records to see revenue trends.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-[18px]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">Revenue over time</span>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setRange(opt)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                range === opt
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="caseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrencyShort}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="gpRevenue"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#gpGradient)"
            isAnimationActive={true}
            animationDuration={700}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="caseRevenue"
            stroke="#34D399"
            strokeWidth={2}
            fill="url(#caseGradient)"
            isAnimationActive={true}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
