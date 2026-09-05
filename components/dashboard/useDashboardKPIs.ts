import { useMemo } from "react";
import { useData } from "@/context/DataContext";
import { RecordCategory } from "@/lib/global";

export interface DashboardKPIsData {
  totalGpRevenue: number;
  totalCaseRevenue: number;
  grossIncome: number;
  totalLabFees: number;
  doctorCommission: number;
  generalExpenses: number;
  assistantFee: number;
  bonus: number;
  buildingRent: number;
  utilityCosts: number;
  customOverheads: { name: string; amount: number }[];
  totalOverhead: number;
  netProfitLoss: number;
}

export function useDashboardKPIs(): DashboardKPIsData {
  const { records, payments, financials } = useData();

  return useMemo(() => {
    const gpRecords = records.filter((r) => r.category === RecordCategory.GP);
    const caseRecords = records.filter(
      (r) => r.category === RecordCategory.CASE
    );

    const totalGpRevenue = gpRecords.reduce(
      (sum, r) => sum + r.total_cost,
      0
    );

    // Case revenue = total cash collected from case payments in this cycle.
    const caseRecordIds = new Set(caseRecords.map((r) => r.id));
    const totalCaseRevenue = payments
      .filter((p) => caseRecordIds.has(p.record_id))
      .reduce((sum, p) => sum + p.paid_amount, 0);

    const grossIncome = totalGpRevenue + totalCaseRevenue;

    // Lab fees summed from individual records (admin-entered per case).
    const totalLabFees = caseRecords.reduce(
      (sum, r) => sum + (r.lab_fee ?? 0),
      0
    );

    // Commission base = gross income minus lab fees (PRD formula).
    const commissionBase = Math.max(0, grossIncome - totalLabFees);
    const doctorCommission = commissionBase * 0.4;

    // Operating overhead from monthly financials (admin-entered via Overhead form).
    const generalExpenses = financials?.general_expenses ?? 0;
    const assistantFee = financials?.assistant_fee ?? 0;
    const bonus = financials?.bonus ?? 0;
    const buildingRent = financials?.building_rent ?? 0;
    const utilityCosts = financials?.utility_costs ?? 0;
    const customOverheads = financials?.custom_overheads ?? [];
    const customOverheadTotal = customOverheads.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const totalOverhead =
      generalExpenses + assistantFee + bonus + buildingRent + utilityCosts + customOverheadTotal;

    // Remaining clinic income = gross - lab fees - doctor commission.
    const remainingIncome = grossIncome - totalLabFees - doctorCommission;
    const netProfitLoss = remainingIncome - totalOverhead;

    return {
      totalGpRevenue,
      totalCaseRevenue,
      grossIncome,
      totalLabFees,
      doctorCommission,
      generalExpenses,
      assistantFee,
      bonus,
      buildingRent,
      utilityCosts,
      customOverheads: customOverheads.map((c) => ({ name: c.name, amount: c.amount })),
      totalOverhead,
      netProfitLoss,
    };
  }, [records, payments, financials]);
}
