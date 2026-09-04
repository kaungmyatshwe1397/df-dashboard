import { ArrowDownRight } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { DashboardKPIsData } from "./useDashboardKPIs";

interface ProfitSectionProps {
  kpis: DashboardKPIsData;
  formatCurrency: (amount: number) => string;
}

export function ProfitSection({ kpis, formatCurrency }: ProfitSectionProps) {
  const profitBadge =
    kpis.netProfitLoss > 0
      ? { label: "Profit", variant: "default" as const }
      : kpis.netProfitLoss < 0
        ? { label: "Loss", variant: "destructive" as const }
        : { label: "Break-even", variant: "secondary" as const };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Net Profit / Loss"
        value={formatCurrency(kpis.netProfitLoss)}
        icon={ArrowDownRight}
        badge={profitBadge}
      />
    </div>
  );
}
