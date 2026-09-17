"use client";

import { useReducedMotion, motion } from "framer-motion";
import { useData } from "@/context/DataContext";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardError } from "./DashboardError";
import { AnimatedNumber } from "./AnimatedNumber";
import { KpiCard } from "./KpiCard";
import { RevenueChart } from "./RevenueChart";
import { useDashboardKPIs } from "./useDashboardKPIs";
import { TrendingUp, FlaskConical, Stethoscope, Building2, ArrowDownRight } from "lucide-react";

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export function DashboardKPIs() {
  const { loading, error, refreshData } = useData();
  const kpis = useDashboardKPIs();
  const shouldReduceMotion = useReducedMotion();

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError onRetry={refreshData} />;

  const profitType = kpis.netProfitLoss > 0 ? "up" : kpis.netProfitLoss < 0 ? "down" : "neutral";
  const profitLabel = kpis.netProfitLoss > 0 ? "Profit" : kpis.netProfitLoss < 0 ? "Loss" : "Break-even";

  const Section = shouldReduceMotion ? "div" : motion.div;

  return (
    <Section
      {...(!shouldReduceMotion && {
        variants: stagger,
        initial: "hidden",
        animate: "show",
      })}
      className="grid grid-cols-4 gap-3.5"
    >
      {/* Gross Income — hero, spans 2 cols */}
      <motion.div variants={fadeUp} className="col-span-2">
        <div className="rounded-[14px] border border-border p-5 h-full bg-gradient-to-br from-accent-dark to-card flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-muted-foreground mb-2">Gross income</div>
              <div className="text-[36px] font-bold tracking-[-1px] leading-none">
                <AnimatedNumber value={kpis.grossIncome} formatFn={formatCurrency} />
              </div>
            </div>
            <div className="w-[30px] h-[30px] rounded-lg bg-white/5 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="flex gap-8 mt-4 pt-4 border-t border-white/10">
            <div>
              <div className="text-[18px] font-bold">
                <AnimatedNumber value={kpis.totalGpRevenue} formatFn={formatCurrency} />
              </div>
              <div className="text-[11px] text-muted-foreground">GP Revenue</div>
            </div>
            <div>
              <div className="text-[18px] font-bold">
                <AnimatedNumber value={kpis.totalCaseRevenue} formatFn={formatCurrency} />
              </div>
              <div className="text-[11px] text-muted-foreground">Case Revenue</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Total Lab Fees — single col */}
      <motion.div variants={fadeUp}>
        <KpiCard
          title="Total lab fees"
          value={<AnimatedNumber value={kpis.totalLabFees} formatFn={formatCurrency} />}
          icon={FlaskConical}
          note={kpis.totalLabFees === 0 ? "No lab fees yet" : undefined}
        />
      </motion.div>

      {/* Doctor Commission — single col */}
      <motion.div variants={fadeUp}>
        <KpiCard
          title="Doctor commission (40%)"
          value={<AnimatedNumber value={kpis.doctorCommission} formatFn={formatCurrency} />}
          icon={Stethoscope}
        />
      </motion.div>

      {/* Operating Overhead — spans 2 cols for breakdown list */}
      <motion.div variants={fadeUp} className="col-span-2">
        <div className="rounded-[14px] border border-border bg-card p-[18px] h-full">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-xs text-muted-foreground">Operating overhead</span>
            <div className="w-[30px] h-[30px] rounded-lg bg-input flex items-center justify-center">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="text-[24px] font-bold tracking-tight mb-3">
            <AnimatedNumber value={kpis.totalOverhead} formatFn={formatCurrency} />
          </div>
          <div className="space-y-0">
            {[
              { label: "General expenses", value: kpis.generalExpenses },
              { label: "Assistant salary", value: kpis.assistantFee },
              { label: "Bonus", value: kpis.bonus },
              { label: "Building rent", value: kpis.buildingRent },
              { label: "Utility costs", value: kpis.utilityCosts },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center py-2 border-b border-border text-[13px] last:border-b-0"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="tabular-nums">{formatCurrency(row.value)}</span>
              </div>
            ))}
            {kpis.customOverheads.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center py-2 border-b border-border text-[13px] last:border-b-0"
              >
                <span className="text-muted-foreground">{item.name}</span>
                <span className="tabular-nums">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Net Profit / Loss — spans 2 cols */}
      <motion.div variants={fadeUp} className="col-span-2">
        <KpiCard
          title="Net profit / loss"
          value={<AnimatedNumber value={kpis.netProfitLoss} formatFn={formatCurrency} />}
          icon={ArrowDownRight}
          change={profitLabel}
          changeType={profitType}
          variant="profit"
        />
      </motion.div>

      {/* Revenue Chart — full width */}
      <motion.div variants={fadeUp} className="col-span-4">
        <RevenueChart />
      </motion.div>
    </Section>
  );
}
