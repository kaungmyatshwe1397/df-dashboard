// Record Table — displays patient records in a tabbed view (GP | Case).
// Combobox month picker with 12 hardcoded months, localStorage persistence.
// Reads from DataContext. Triggers onAdd/onEdit callbacks — does not modify data itself.

"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { EMPTY_PATIENT_FILTERS, hasPatientFilters, matchesRecordFilters } from "@/lib/patient-search";
import { CaseLabFilter } from "./caseLabFilter";

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
  const { records, loading, error, refreshData, selectedMonth, setSelectedMonth, labs = [] } = useData();
  // Keep the saved record's category visible when month loading remounts the tab panels.
  const [activeTab, setActiveTab] = useState<"gp" | "case">("gp");
  useEffect(() => {
    // Returning from Case entry should reveal the saved record in its own tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).get("tab") === "case") setActiveTab("case");
  }, []);
  const [filters, setFilters] = useState({ ...EMPTY_PATIENT_FILTERS });
  const [selectedLab, setSelectedLab] = useState("all");
  const filteredRecords = records.filter((record) => matchesRecordFilters(record, filters));
  const tableKey = JSON.stringify([selectedMonth, filters]);

  const gpRecords = filteredRecords.filter((r) => r.category === RecordCategory.GP) as GPPatientRecordType[];
  const caseRecords = filteredRecords.filter((record) => record.category === RecordCategory.CASE
    && (selectedLab === "all" || (selectedLab === "unassigned"
      ? !record.lab_name?.trim() : record.lab_name?.trim() === selectedLab.slice(4)))) as CasePatientRecordType[];
  const labNames = Array.from(new Set([
    ...labs.map((lab) => lab.lab_name.trim()),
    ...records.filter((record) => record.category === RecordCategory.CASE).map((record) => record.lab_name?.trim() ?? ""),
    ...(selectedLab.startsWith("lab:") ? [selectedLab.slice(4)] : []),
  ].filter(Boolean))).sort((left, right) => left.localeCompare(right));
  const hasCaseFilters = hasPatientFilters(filters) || selectedLab !== "all";

  const selectedMonthAbbr = selectedMonth ? selectedMonth.split(" ")[0] : "";
  const activeFilterCount = [filters.gender, filters.registration !== "all" ? filters.registration : "",
    activeTab === "case" && selectedLab !== "all" ? selectedLab : ""].filter(Boolean).length;

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
            <SheetHeader><SheetTitle>Filter records</SheetTitle><SheetDescription>{activeTab === "case" ? "Filter by registration status, gender, or lab." : "Filter by registration status or gender."}</SheetDescription></SheetHeader>
            <div className="overflow-y-auto px-4"><PatientSearchFilters value={filters} onChange={setFilters} showQuery={false} showAddress={false} showAge={false}
              onClear={() => { setFilters({ ...EMPTY_PATIENT_FILTERS }); setSelectedLab("all"); }}>
              {activeTab === "case" && <div className="grid gap-2">
                <Label htmlFor="record-lab-filter">Lab</Label>
                <CaseLabFilter value={selectedLab} labs={labNames} onChange={setSelectedLab} />
              </div>}
            </PatientSearchFilters></div>
          </SheetContent>
        </Sheet>
      </div>
      {activeTab === "gp" && hasPatientFilters(filters) && gpRecords.length === 0 && <p className="text-body-sm">No visits match these filters in the selected month. Try fewer filters.</p>}

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
            key={`case-${tableKey}-${selectedLab}`}
            records={caseRecords}
            emptyMessage={hasCaseFilters ? "No case records match these filters. Try fewer filters." : undefined}
            onAdd={() => onAdd(RecordCategory.CASE)}
            onEdit={(record) => onEdit(record, RecordCategory.CASE)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
