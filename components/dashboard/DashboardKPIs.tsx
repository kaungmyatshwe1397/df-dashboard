"use client";

import { useData } from "@/context/DataContext";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardError } from "./DashboardError";
import { RevenueSection } from "./RevenueSection";
import { CommissionSection } from "./CommissionSection";
import { OverheadSection } from "./OverheadSection";
import { ProfitSection } from "./ProfitSection";
import { useDashboardKPIs } from "./useDashboardKPIs";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function DashboardKPIs() {
  const { loading, error, refreshData } = useData();
  const kpis = useDashboardKPIs();

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError onRetry={refreshData} />;

  return (
    <div className="space-y-6">
      <RevenueSection kpis={kpis} formatCurrency={formatCurrency} />
      <CommissionSection kpis={kpis} formatCurrency={formatCurrency} />
      <OverheadSection kpis={kpis} formatCurrency={formatCurrency} />
      <ProfitSection kpis={kpis} formatCurrency={formatCurrency} />
    </div>
  );
}
