// Record Table — displays patient records in a tabbed view (GP | Case).
// Combobox month picker with 12 hardcoded months, localStorage persistence.
// Reads from DataContext. Triggers onAdd/onEdit callbacks — does not modify data itself.

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useData } from "@/context/DataContext";
import { RecordCategory, PatientRecord, GPPatientRecordType, CasePatientRecordType } from "@/lib/global";
import { TableSkeleton, TableError } from "./RecordTableHelpers";
import { GpTable } from "./GpTable";
import { CaseTable } from "./CaseTable";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const CURRENT_YEAR = new Date().getFullYear();

function toFullLabel(month: string): string {
  return `${month} ${CURRENT_YEAR}`;
}

export function RecordTable({
  onAdd,
  onEdit,
}: {
  onAdd: (category: RecordCategory) => void;
  onEdit: (record: PatientRecord | null, category: RecordCategory) => void;
}) {
  const { records, loading, error, refreshData, selectedMonth, setSelectedMonth } = useData();

  const gpRecords = records.filter((r) => r.category === RecordCategory.GP) as GPPatientRecordType[];
  const caseRecords = records.filter((r) => r.category === RecordCategory.CASE) as CasePatientRecordType[];

  const selectedMonthAbbr = selectedMonth ? selectedMonth.split(" ")[0] : "";

  if (loading) {
    return <TableSkeleton columns={7} />;
  }

  if (error) {
    return <TableError onRetry={refreshData} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Patient Records</h2>

        <Combobox
          items={MONTHS}
          value={selectedMonthAbbr}
          onValueChange={(v) => v && setSelectedMonth(toFullLabel(v))}
        >
          <ComboboxInput placeholder="Select month" className="w-40 h-6" />
          <ComboboxContent>
            <ComboboxEmpty>No months found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <Tabs defaultValue="gp">
        <TabsList variant="line">
          <TabsTrigger value="gp">GP Records</TabsTrigger>
          <TabsTrigger value="case">Case Records</TabsTrigger>
        </TabsList>

        <TabsContent value="gp">
          <GpTable
            records={gpRecords}
            onAdd={() => onAdd(RecordCategory.GP)}
            onEdit={(record) => onEdit(record, RecordCategory.GP)}
          />
        </TabsContent>

        <TabsContent value="case">
          <CaseTable
            records={caseRecords}
            onAdd={() => onAdd(RecordCategory.CASE)}
            onEdit={(record) => onEdit(record, RecordCategory.CASE)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
