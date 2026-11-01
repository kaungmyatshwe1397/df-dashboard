// Server pagination searches every person without depending on a visit's month or category.
"use client";

import { useEffect, useState } from "react";
import { usePatients } from "@/context/hooks/usePatients";
import type { PatientFiltersType, PatientSearchResultType, PatientType } from "@/lib/global";
import { EMPTY_PATIENT_FILTERS } from "@/lib/patient-search";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PatientSearchFilters } from "./filters";
import { PatientMatch } from "./patientMatch";
import { TablePagination } from "@/components/records/record-table/RecordTableHelpers";

interface PatientSearchPropsType {
  onSelect: (patient: PatientType) => void;
  onCreate?: () => void;
  disabled?: boolean;
}

export function PatientSearch({ onSelect, onCreate, disabled = false }: PatientSearchPropsType) {
  const { searchPatients } = usePatients();
  const [filters, setFilters] = useState<PatientFiltersType>({ ...EMPTY_PATIENT_FILTERS });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PatientSearchResultType>({ patients: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      searchPatients(filters, page).then((next) => {
        if (!cancelled) { setResult(next); setLoading(false); }
      }).catch((err: unknown) => {
        if (!cancelled) { setError(err instanceof Error ? err.message : "Could not search patients."); setLoading(false); }
      });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters, page, retry, searchPatients]);
  function changeFilters(next: PatientFiltersType) {
    setFilters(next); setPage(1); setLoading(true); setError(null);
  }
  return <div className="grid gap-4">
    <PatientSearchFilters value={filters} onChange={changeFilters} disabled={disabled} />
    {loading ? <p role="status" className="text-body-sm text-muted-foreground">Searching patients…</p>
      : error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription>
        <Button variant="outline" onClick={() => { setError(null); setLoading(true); setRetry((value) => value + 1); }}>Retry</Button></Alert>
      : <>
        <p className="text-body-sm text-muted-foreground" aria-live="polite">{result.total} patients found</p>
        {result.patients.length === 0 && <p className="text-body-sm">No patients match. Try fewer filters or add a new unregistered patient.</p>}
        {result.patients.map((patient) => <PatientMatch key={patient.id} patient={patient} onSelect={onSelect} disabled={disabled} />)}
        <TablePagination currentPage={page} totalPages={Math.ceil(result.total / 10)} onPageChange={(next) => { setPage(next); setLoading(true); }} />
      </>}
    {onCreate && <Button variant="outline" onClick={onCreate} disabled={disabled}>New unregistered patient</Button>}
  </div>;
}
