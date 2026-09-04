import { FlaskConical, Stethoscope } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { DashboardKPIsData } from "./useDashboardKPIs";

interface CommissionSectionProps {
  kpis: DashboardKPIsData;
  formatCurrency: (amount: number) => string;
}

export function CommissionSection({
  kpis,
  formatCurrency,
}: CommissionSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Total Lab Fees"
        value={formatCurrency(kpis.totalLabFees)}
        icon={FlaskConical}
      />
      <KpiCard
        title="Doctor Commission (40%)"
        value={formatCurrency(kpis.doctorCommission)}
        icon={Stethoscope}
      />
    </div>
  );
}
