// Record Table — displays patient records in a tabbed view (GP | Case).
// Combobox month picker with 12 hardcoded months, localStorage persistence.
// Reads from DataContext. Triggers onAdd/onEdit callbacks — does not modify data itself.

"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CalendarDays, Filter, Search } from "lucide-react";
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
import { PatientSearchFilters } from "@/components/patients/patientSearch/filters";
import { EMPTY_PATIENT_FILTERS, hasPatientFilters, matchesPatientFilters } from "@/lib/patient-search";

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
  // Keep the saved record's category visible when month loading remounts the tab panels.
  const [activeTab, setActiveTab] = useState<"gp" | "case">("gp");
  useEffect(() => {
    // Returning from Case entry should reveal the saved record in its own tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).get("tab") === "case") setActiveTab("case");
  }, []);
  const [filters, setFilters] = useState({ ...EMPTY_PATIENT_FILTERS });
  const filteredRecords = records.filter((record) => !hasPatientFilters(filters)
    || (!!record.patient && matchesPatientFilters(record.patient, filters)));
  const tableKey = JSON.stringify([selectedMonth, filters]);

  const gpRecords = filteredRecords.filter((r) => r.category === RecordCategory.GP) as GPPatientRecordType[];
  const caseRecords = filteredRecords.filter((r) => r.category === RecordCategory.CASE) as CasePatientRecordType[];

  const selectedMonthAbbr = selectedMonth ? selectedMonth.split(" ")[0] : "";
  const activeFilterCount = [filters.gender, filters.registration !== "all" ? filters.registration : ""].filter(Boolean).length;

  if (loading) {
    return <TableSkeleton columns={7} />;
  }

  if (error) {
    return <TableError onRetry={refreshData} />;
  }

  return (
    <div className="space-y-4">
      <Tabs className="gap-4" value={activeTab} onValueChange={(value) => {
        if (value === "gp" || value === "case") setActiveTab(value);
      }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList variant="line">
          <TabsTrigger value="gp" className="text-h3">GP Records</TabsTrigger>
          <TabsTrigger value="case" className="text-h3">Case Records</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden="true" />
          <Combobox
          items={MONTHS}
          value={selectedMonthAbbr}
          onValueChange={(v) => v && setSelectedMonth(toFullLabel(v))}
        >
          <ComboboxInput placeholder="Select month" aria-label="Record month" className="h-7 w-24" />
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
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search records by patient name or clinic ID" className="pl-12" placeholder="Search by patient name or clinic ID" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
        </div>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="sm" />}><Filter className="size-4" />Filters{activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}</SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Filter records</SheetTitle><SheetDescription>Filter by registration status or gender.</SheetDescription></SheetHeader>
            <div className="overflow-y-auto px-4"><PatientSearchFilters value={filters} onChange={setFilters} showQuery={false} showAddress={false} showAge={false} /></div>
          </SheetContent>
        </Sheet>
      </div>
      {hasPatientFilters(filters) && filteredRecords.length === 0 && <p className="text-body-sm">No visits match these filters in the selected month. Try fewer filters.</p>}

        <TabsContent value="gp" className="mt-4">
          <GpTable
            key={`gp-${tableKey}`}
            records={gpRecords}
            onAdd={() => onAdd(RecordCategory.GP)}
            onEdit={(record) => onEdit(record, RecordCategory.GP)}
          />
        </TabsContent>

        <TabsContent value="case" className="mt-4">
          <CaseTable
            key={`case-${tableKey}`}
            records={caseRecords}
            onAdd={() => onAdd(RecordCategory.CASE)}
            onEdit={(record) => onEdit(record, RecordCategory.CASE)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
