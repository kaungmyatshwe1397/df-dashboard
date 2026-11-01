// Separate status tabs retain one profile per person and load searchable pages from the database.
"use client";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, Filter, Plus, Search } from "lucide-react";
import { usePatients } from "@/context/hooks/usePatients";
import { useCanEdit } from "@/context/AuthContext";
import type { PatientType, PatientFiltersType, PatientSearchResultType } from "@/lib/global";
import { EMPTY_PATIENT_FILTERS } from "@/lib/patient-search";
import { PatientSearchFilters } from "@/components/patients/patientSearch/filters";
import { ROWS_PER_PAGE, TablePagination } from "@/components/records/record-table/RecordTableHelpers";
import { AddPatientDialog } from "./AddPatientDialog";
import { DirectoryRows } from "./directoryRows";

export { PatientDetailDialog } from "./patientDetailDialog";
export interface RegisteredPatientsTablePropsType { onRowSelect: (patient: PatientType) => void; }

export function RegisteredPatientsTable({ onRowSelect }: RegisteredPatientsTablePropsType) {
  const { searchPatients } = usePatients();
  const canEdit = useCanEdit();
  const [filters, setFilters] = useState<PatientFiltersType>({ ...EMPTY_PATIENT_FILTERS, registration: "registered" });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PatientSearchResultType>({ patients: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PatientType | null>(null);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [sortBy, setSortBy] = useState<"id" | "name" | "registered_at">("id");
  const [descending, setDescending] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const request = searchPatients(filters, page, undefined, descending, sortBy);
      request.then((next) => {
        if (!cancelled) {
          if (page > 1 && next.patients.length === 0) { setPage(1); return; }
          setResult(next); setLoading(false);
        }
      }).catch((err: unknown) => {
        if (!cancelled) { setError(err instanceof Error ? err.message : "Could not load patients."); setLoading(false); }
      });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchPatients, filters, page, revision, descending, sortBy]);
  function reload() { setLoading(true); setError(null); setRevision((value) => value + 1); }
  function changeFilters(next: PatientFiltersType) { setFilters(next); setPage(1); setLoading(true); setError(null); }
  function edit(patient: PatientType | null, registration: boolean) { setEditing(patient); setRegistrationMode(registration); setDialogOpen(true); }
  const activeFilterCount = [filters.address, filters.age].filter(Boolean).length;
  const sortValue = `${sortBy}:${descending ? "desc" : "asc"}`;
  function changeSort(value: string) {
    const [key, direction] = value.split(":");
    if (key !== "id" && key !== "name" && key !== "registered_at") return;
    setSortBy(key);
    setDescending(direction === "desc");
    setPage(1);
    setLoading(true);
  }
  return <div className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
    <Tabs value={filters.registration} onValueChange={(next) => {
      if (next === "registered" || next === "unregistered") changeFilters({ ...filters, registration: next });
    }}><TabsList variant="line"><TabsTrigger value="registered">Registered</TabsTrigger><TabsTrigger value="unregistered">Unregistered</TabsTrigger></TabsList></Tabs>
      {canEdit && <Button size="sm" onClick={() => edit(null, true)}><Plus className="size-4" />Add Patient</Button>}
    </div>
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search by name or clinic ID" className="pl-9" value={filters.query} placeholder="Search by name or clinic ID" onChange={(event) => changeFilters({ ...filters, query: event.target.value })} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="sm" />}><Filter className="size-4" />Filters{activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}</SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Filter patients</SheetTitle><SheetDescription>Narrow the directory by address or exact age.</SheetDescription></SheetHeader>
            <div className="overflow-y-auto px-4"><PatientSearchFilters value={filters} onChange={changeFilters} showRegistration={false} showQuery={false} showGender={false} /></div>
          </SheetContent>
        </Sheet>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>Sort by<ChevronDown className="size-4" /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuRadioGroup value={sortValue} onValueChange={changeSort}>
              <DropdownMenuRadioItem value="id:asc">Clinic ID: ascending</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="id:desc">Clinic ID: descending</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name:asc">Name: A–Z</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name:desc">Name: Z–A</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="registered_at:desc">{filters.registration === "registered" ? "Registered: newest first" : "Added: newest first"}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="registered_at:asc">{filters.registration === "registered" ? "Registered: oldest first" : "Added: oldest first"}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <Badge variant="secondary" className="w-fit" aria-live="polite">{loading ? "Loading..." : `${result.total} ${filters.registration} patients`}</Badge>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription><Button variant="outline" onClick={reload}>Retry</Button></Alert>}
    {loading ? <p role="status">Loading patients...</p> : error ? null : <>
      {!result.patients.length && <p className="text-body-sm">No {filters.registration} patients match. Try fewer filters.</p>}
      <DirectoryRows patients={result.patients} rowOffset={(page - 1) * ROWS_PER_PAGE} onSelect={onRowSelect} />
      <TablePagination currentPage={page} totalPages={Math.ceil(result.total / ROWS_PER_PAGE)} onPageChange={(next) => { setPage(next); setLoading(true); }} />
    </>}
    <AddPatientDialog open={dialogOpen} patient={editing} registrationMode={registrationMode}
      onOpenChange={setDialogOpen} onCreated={reload} />
  </div>;
}
