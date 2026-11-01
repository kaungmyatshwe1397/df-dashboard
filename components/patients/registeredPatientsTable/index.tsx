// Separate status tabs retain one profile per person and load searchable pages from the database.
"use client";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { usePatients } from "@/context/hooks/usePatients";
import { useData } from "@/context/DataContext";
import { useCanEdit } from "@/context/AuthContext";
import type { PatientType, PatientFiltersType, PatientSearchResultType } from "@/lib/global";
import { EMPTY_PATIENT_FILTERS } from "@/lib/patient-search";
import { PatientSearchFilters } from "@/components/patients/patientSearch/filters";
import { TablePagination } from "@/components/records/record-table/RecordTableHelpers";
import { AddPatientDialog } from "./AddPatientDialog";
import { DirectoryRows } from "./directoryRows";

export { PatientDetailDialog } from "./patientDetailDialog";
export interface RegisteredPatientsTablePropsType { onRowSelect: (patient: PatientType) => void; }

export function RegisteredPatientsTable({ onRowSelect }: RegisteredPatientsTablePropsType) {
  const { searchPatients, setPatientRegistration } = usePatients();
  const { refreshData } = useData();
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
  const [busy, setBusy] = useState(false);
  const [descending, setDescending] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const request = descending ? searchPatients(filters, page, undefined, true) : searchPatients(filters, page);
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
  }, [searchPatients, filters, page, revision, descending]);
  function reload() { setLoading(true); setError(null); setRevision((value) => value + 1); }
  function changeFilters(next: PatientFiltersType) { setFilters(next); setPage(1); setLoading(true); setError(null); }
  function edit(patient: PatientType | null, registration: boolean) { setEditing(patient); setRegistrationMode(registration); setDialogOpen(true); }
  async function unregister(patient: PatientType) {
    setBusy(true); setError(null);
    try { await setPatientRegistration(patient.id, false); refreshData(); reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not unregister patient."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-4">
    <Tabs value={filters.registration} onValueChange={(next) => {
      if (next === "registered" || next === "unregistered") changeFilters({ ...filters, registration: next });
    }}><TabsList><TabsTrigger value="registered">Registered</TabsTrigger><TabsTrigger value="unregistered">Unregistered</TabsTrigger></TabsList></Tabs>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Badge variant="secondary" aria-live="polite">{loading ? "Loading..." : `${result.total} ${filters.registration} patients`}</Badge>
      <Button variant="outline" disabled={busy} onClick={() => { setDescending((value) => !value); setPage(1); setLoading(true); }}>
        Clinic ID: {descending ? "Descending" : "Ascending"}
      </Button>
      {canEdit && <Button disabled={busy} onClick={() => edit(null, true)}>Add Patient</Button>}
    </div>
    <PatientSearchFilters value={filters} onChange={changeFilters} disabled={busy} showRegistration={false} />
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription><Button variant="outline" onClick={reload}>Retry</Button></Alert>}
    {loading ? <p role="status">Loading patients...</p> : error ? null : <>
      {!result.patients.length && <p className="text-body-sm">No {filters.registration} patients match. Try fewer filters.</p>}
      <DirectoryRows patients={result.patients} canEdit={canEdit} busy={busy} onSelect={onRowSelect} onEdit={edit} onUnregister={unregister} />
      <TablePagination currentPage={page} totalPages={Math.ceil(result.total / 10)} onPageChange={(next) => { setPage(next); setLoading(true); }} />
    </>}
    <AddPatientDialog open={dialogOpen} patient={editing} registrationMode={registrationMode}
      onOpenChange={setDialogOpen} onCreated={reload} />
  </div>;
}
