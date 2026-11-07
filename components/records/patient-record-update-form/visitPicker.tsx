// Choosing a visit explicitly avoids silently editing the latest visit for a clinic ID.
"use client";
import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PatientSearchFilters } from "@/components/patients/patientSearch/filters";
import { EMPTY_PATIENT_FILTERS, matchesRecordFilters } from "@/lib/patient-search";
import { RecordCategory, type PatientRecord } from "@/lib/global";
import { TablePagination, formatDate } from "../record-table/RecordTableHelpers";

export function VisitPicker({ category, onSelect }: { category: RecordCategory; onSelect: (record: PatientRecord) => void }) {
  const { records } = useData();
  const [filters, setFilters] = useState({ ...EMPTY_PATIENT_FILTERS });
  const [page, setPage] = useState(1);
  const matches = records.filter((record) => record.category === category && matchesRecordFilters(record, filters));
  return <div className="grid gap-4">
    <PatientSearchFilters value={filters} onChange={(next) => { setFilters(next); setPage(1); }} />
    <p className="text-body-sm text-muted-foreground">Visits in the selected month: {matches.length}</p>
    {matches.slice((page - 1) * 10, page * 10).map((record) => <Card key={record.id} size="sm"><CardContent className="grid gap-2">
      <p className="font-medium">{record.patient?.patient_name ?? record.patient_name}</p>
      <p className="text-body-sm">{formatDate(record.entry_date)} · {record.patient?.patient_id ?? "Not assigned"} · {record.diagnosis}</p>
      <Button variant="outline" onClick={() => onSelect(record)}>Edit this visit</Button>
    </CardContent></Card>)}
    {!matches.length && <p>No matching visits. Try fewer filters or select another month.</p>}
    <TablePagination currentPage={page} totalPages={Math.ceil(matches.length / 10)} onPageChange={setPage} />
  </div>;
}
