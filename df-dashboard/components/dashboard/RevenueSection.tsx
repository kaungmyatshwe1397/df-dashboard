import { TrendingUp, CreditCard } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { DashboardKPIsData } from "./useDashboardKPIs";

interface RevenueSectionProps {
  kpis: DashboardKPIsData;
  formatCurrency: (amount: number) => string;
}

export function RevenueSection({ kpis, formatCurrency }: RevenueSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Total GP Revenue"
        value={formatCurrency(kpis.totalGpRevenue)}
        icon={TrendingUp}
      />
      <KpiCard
        title="Total Case Revenue"
        value={formatCurrency(kpis.totalCaseRevenue)}
        icon={CreditCard}
      />
      <KpiCard
        title="Gross Income"
        value={formatCurrency(kpis.grossIncome)}
        icon={TrendingUp}
      />
    </div>
  );
}
