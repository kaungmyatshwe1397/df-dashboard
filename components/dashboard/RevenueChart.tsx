// RevenueChart — interactive area chart with two modes:
// "This Month" — daily revenue trend for the active month
// "Every Month" — monthly revenue trend across all months (lightweight fetch)

"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ChartMode = "thisMonth" | "everyMonth";

const MODE_OPTIONS: { value: ChartMode; label: string }[] = [
  { value: "thisMonth", label: "This Month" },
  { value: "everyMonth", label: "Every Month" },
];

interface ChartPoint {
  key: string;
  label: string;
  gpRevenue: number;
  caseRevenue: number;
  grossIncome: number;
  day?: number;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getDaysInMonth(monthLabel: string): number {
  const [monthName, yearStr] = monthLabel.split(" ");
  const monthIdx = MONTH_NAMES.indexOf(monthName);
  if (monthIdx === -1) return 30;
  const year = parseInt(yearStr, 10);
  if (monthIdx === 1 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
    return 29;
  }
  return DAYS_IN_MONTH[monthIdx];
}

function getMonthIndex(monthLabel: string): number {
  return MONTH_NAMES.indexOf(monthLabel.split(" ")[0]);
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

// ------------------------------------------
// This Month — daily aggregation from DataContext
// ------------------------------------------

function useThisMonthData(selectedMonth: string): ChartPoint[] {
  const { records, payments } = useData();

  return useMemo(() => {
    if (!selectedMonth) return [];

    const daysCount = getDaysInMonth(selectedMonth);
    const byDay = new Map<number, { gp: number; caseRev: number }>();
    for (let d = 1; d <= daysCount; d++) {
      byDay.set(d, { gp: 0, caseRev: 0 });
    }

    for (const r of records) {
      if (r.month_label !== selectedMonth) continue;
      const day = parseInt(r.entry_date.split("-")[2], 10);
      if (r.category === RecordCategory.GP) {
        const bucket = byDay.get(day);
        if (bucket) bucket.gp += r.total_cost;
      }
    }

    const caseRecordIds = new Set(
      records
        .filter((r) => r.category === RecordCategory.CASE && r.month_label === selectedMonth)
        .map((r) => r.id)
    );
    for (const p of payments) {
      if (!caseRecordIds.has(p.record_id)) continue;
      const day = parseInt(p.payment_date.split("-")[2], 10);
      const bucket = byDay.get(day);
      if (bucket) bucket.caseRev += p.paid_amount;
    }

    const points: ChartPoint[] = [];
    for (let d = 1; d <= daysCount; d++) {
      const data = byDay.get(d)!;
      points.push({
        key: `day-${d}`,
        label: `${selectedMonth.split(" ")[0]} ${d}`,
        gpRevenue: data.gp,
        caseRevenue: data.caseRev,
        grossIncome: data.gp + data.caseRev,
        day: d,
      });
    }

    return points;
  }, [records, payments, selectedMonth]);
}

// ------------------------------------------
// Every Month — lightweight aggregated fetch
// ------------------------------------------

function useEveryMonthData(): ChartPoint[] {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const fetchId = ++fetchIdRef.current;

    const supabase = createClient();

    Promise.all([
      supabase.from("patient_records").select("id, month_label, category, total_cost"),
      supabase.from("case_payments").select("record_id, paid_amount"),
    ])
      .then(([recordsRes, paymentsRes]) => {
        if (fetchId !== fetchIdRef.current) return;

        if (recordsRes.error || paymentsRes.error) {
          setChartData([]);
          return;
        }

        const records = recordsRes.data ?? [];
        const payments = paymentsRes.data ?? [];

        const recordMonthMap = new Map<string, string>();
        for (const r of records) {
          recordMonthMap.set(r.id, r.month_label);
        }

        const byMonth = new Map<string, { gp: number; caseRev: number }>();
        for (const r of records) {
          const existing = byMonth.get(r.month_label) ?? { gp: 0, caseRev: 0 };
          if (r.category === RecordCategory.GP) {
            existing.gp += r.total_cost;
          }
          byMonth.set(r.month_label, existing);
        }

        for (const p of payments) {
          const monthLabel = recordMonthMap.get(p.record_id);
          if (!monthLabel) continue;
          const existing = byMonth.get(monthLabel) ?? { gp: 0, caseRev: 0 };
          existing.caseRev += p.paid_amount;
          byMonth.set(monthLabel, existing);
        }

        const points: ChartPoint[] = [];
        for (const [label, data] of byMonth) {
          points.push({
            key: label,
            label,
            gpRevenue: data.gp,
            caseRevenue: data.caseRev,
            grossIncome: data.gp + data.caseRev,
          });
        }

        points.sort((a, b) => {
          const aIdx = getMonthIndex(a.label);
          const bIdx = getMonthIndex(b.label);
          return aIdx - bIdx;
        });

        setChartData(points);
      })
      .catch(() => {
        if (fetchId !== fetchIdRef.current) return;
        setChartData([]);
      });
  }, []);

  return chartData;
}

// ------------------------------------------
// Main Component
// ------------------------------------------

export function RevenueChart() {
  const { selectedMonth } = useData();
  const [chartMode, setChartMode] = useState<ChartMode>("thisMonth");

  const thisMonthData = useThisMonthData(selectedMonth);
  const everyMonthData = useEveryMonthData();

  const chartData = chartMode === "thisMonth" ? thisMonthData : everyMonthData;

  const emptyMessage = chartMode === "thisMonth"
    ? `No revenue data for ${selectedMonth}.`
    : "No revenue data available yet.";

  if (chartData.length === 0) {
    return (
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">Revenue over time</span>
          <div className="flex gap-1">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setChartMode(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                  chartMode === opt.value
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-[18px]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">Revenue over time</span>
        <div className="flex gap-1">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setChartMode(opt.value)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                chartMode === opt.value
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            interval={chartMode === "thisMonth" ? 4 : 0}
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
