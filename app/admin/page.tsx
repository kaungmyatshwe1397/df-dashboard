"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { DashboardKPIs } from "@/components/dashboard";
import { useData } from "@/context/DataContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPage() {
  const { allMonths, selectedMonth, setSelectedMonth } = useData();
  const monthOptions = allMonths.includes(selectedMonth)
    ? allMonths
    : [selectedMonth, ...allMonths];

  return (
    <PortalLayout>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-foreground m-0 mb-1">Financial overview</h1>
          <p className="text-[13px] text-muted-foreground m-0">
            Live KPIs and clinic performance for the selected month.
          </p>
        </div>
        <Select
          value={selectedMonth}
          onValueChange={(month) => {
            if (month) setSelectedMonth(month);
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Dashboard month">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month} value={month}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DashboardKPIs />
    </PortalLayout>
  );
}
