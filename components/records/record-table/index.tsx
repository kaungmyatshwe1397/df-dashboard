// Record Table — displays patient records in a tabbed view (GP | Case).
// Month filter dropdown to switch between months.
// Reads from DataContext. Triggers onAdd/onEdit callbacks — does not modify data itself.

"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock } from "lucide-react";
import { useData } from "@/context/DataContext";
import { RecordCategory, PatientRecord, GPPatientRecordType, CasePatientRecordType } from "@/lib/global";
import { TableSkeleton, TableError } from "./RecordTableHelpers";
import { GpTable } from "./GpTable";
import { CaseTable } from "./CaseTable";

export function RecordTable({
  onAdd,
  onEdit,
}: {
  onAdd: (category: RecordCategory) => void;
  onEdit: (record: PatientRecord | null, category: RecordCategory) => void;
}) {
  const { records, cycleLocked, loading, error, refreshData, allMonths, selectedMonth, setSelectedMonth } = useData();

  const gpRecords = records.filter((r) => r.category === RecordCategory.GP) as GPPatientRecordType[];
  const caseRecords = records.filter((r) => r.category === RecordCategory.CASE) as CasePatientRecordType[];

  if (loading) {
    return <TableSkeleton columns={7} />;
  }

  if (error) {
    return <TableError onRetry={refreshData} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-h4 font-semibold">Patient Records</h2>
          {cycleLocked && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Read-only
            </Badge>
          )}
        </div>

        {allMonths.length > 0 && (
          <Select value={selectedMonth} onValueChange={(v) => v && setSelectedMonth(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {allMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="gp">
        <TabsList>
          <TabsTrigger value="gp">GP Records</TabsTrigger>
          <TabsTrigger value="case">Case Records</TabsTrigger>
        </TabsList>

        <TabsContent value="gp">
          <GpTable
            records={gpRecords}
            cycleLocked={cycleLocked}
            onAdd={() => onAdd(RecordCategory.GP)}
            onEdit={(record) => onEdit(record, RecordCategory.GP)}
          />
        </TabsContent>

        <TabsContent value="case">
          <CaseTable
            records={caseRecords}
            cycleLocked={cycleLocked}
            onAdd={() => onAdd(RecordCategory.CASE)}
            onEdit={(record) => onEdit(record, RecordCategory.CASE)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
