import { Fragment } from "react";
import { Building2 } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { DashboardKPIsData } from "./useDashboardKPIs";

interface OverheadSectionProps {
  kpis: DashboardKPIsData;
  formatCurrency: (amount: number) => string;
}

const EXPENSE_ROWS: { label: string; key: keyof DashboardKPIsData }[] = [
  { label: "General Expenses", key: "generalExpenses" },
  { label: "Assistant Salary", key: "assistantFee" },
  { label: "Bonus", key: "bonus" },
  { label: "Building Rent", key: "buildingRent" },
  { label: "Utility Costs", key: "utilityCosts" },
];

export function OverheadSection({ kpis, formatCurrency }: OverheadSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Operating Overhead"
        value={formatCurrency(kpis.totalOverhead)}
        icon={Building2}
        footer={
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-caption text-muted-foreground">
            {EXPENSE_ROWS.map(({ label, key }) => (
              <Fragment key={key}>
                <span>{label}</span>
                <span className="text-right font-medium text-foreground">
                  {formatCurrency(kpis[key] as number)}
                </span>
              </Fragment>
            ))}
          </div>
        }
      />
    </div>
  );
}
