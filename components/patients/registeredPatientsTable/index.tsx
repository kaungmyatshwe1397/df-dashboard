// RegisteredPatientsTable — searchable, sortable, paginated registry listing.
// Reads the full patients registry once, filters and sorts client-side,
// and reports row clicks so the host page can route to the detail dialog.
// Handles the 5 UI states: ideal, loading, error, empty, search-no-match.

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Pencil, Plus, Search, UsersRound } from "lucide-react";
import { PatientType } from "@/lib/global";
import { usePatients } from "@/context/hooks/usePatients";
import { useCanEdit } from "@/context/AuthContext";
import {
  ROWS_PER_PAGE,
  TableEmpty,
  TableError,
  TablePagination,
  TableSkeleton,
} from "@/components/records/record-table/RecordTableHelpers";
import { filterPatients, formatRegisteredDate, sortPatientsById } from "./helpers";
import { AddPatientDialog } from "./AddPatientDialog";
import { Badge } from "@/components/ui/badge";

export interface RegisteredPatientsTablePropsType {
  onRowSelect: (patient: PatientType) => void;
}

export { PatientDetailDialog } from "./patientDetailDialog";

export function RegisteredPatientsTable({
  onRowSelect,
}: RegisteredPatientsTablePropsType) {
  const { listPatients } = usePatients();
  const canEdit = useCanEdit();
  const [patients, setPatients] = useState<PatientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientType | null>(null);
  const [sortDirection, setSortDirection] = useState<"ascending" | "descending">("ascending");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPatients(await listPatients());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, [listPatients]);

  // Initial fetch on mount: only the loading flag flips synchronously —
  // patients/error land after the promise resolves.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = sortPatientsById(filterPatients(patients, query), sortDirection);
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const pageRows = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setCurrentPage(1);
  }

  function openAddDialog() {
    setEditingPatient(null);
    setDialogOpen(true);
  }

  function openEditDialog(patient: PatientType) {
    setEditingPatient(patient);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingPatient(null);
  }

  if (loading) return <TableSkeleton columns={canEdit ? 6 : 5} />;

  if (error) {
    return <TableError message={error} onRetry={load} />;
  }

  if (patients.length === 0) {
    return (
      <>
        <TableEmpty
          message="No registered patients yet."
          onAdd={canEdit ? openAddDialog : undefined}
          addLabel="Add Patient"
        />
        <AddPatientDialog
          open={dialogOpen}
          patient={editingPatient}
          onOpenChange={handleDialogOpenChange}
          onCreated={load}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Badge variant="secondary" className="w-fit gap-2 px-3 py-1.5 text-sm font-medium">
          <UsersRound className="h-4 w-4" aria-hidden="true" />
          <span aria-live="polite">
            {filtered.length} registered
          </span>
        </Badge>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          {canEdit && (
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Patient
            </Button>
          )}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search patient ID"
              aria-label="Search registered patients by ID"
              className="h-7 pl-8"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <TableEmpty message={`No patients match “${query.trim()}”.`} />
      ) : (
        <div className="rounded-[14px] border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead aria-sort={sortDirection}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2"
                    onClick={() =>
                      setSortDirection((current) =>
                        current === "ascending" ? "descending" : "ascending"
                      )
                    }
                    aria-label={`Sort patient IDs ${sortDirection === "ascending" ? "descending" : "ascending"}`}
                  >
                    Patient ID
                    {sortDirection === "ascending" ? (
                      <ArrowUp className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Address</TableHead>
                {canEdit && <TableHead className="w-20 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((patient, i) => (
                <TableRow
                  key={patient.id}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => onRowSelect(patient)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRowSelect(patient);
                  }}
                >
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {startIndex + i + 1}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {patient.patient_id}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {formatRegisteredDate(patient.created_at)}
                  </TableCell>
                  <TableCell>
                    <span
                      className="font-medium max-w-50 truncate"
                      title={patient.patient_name}
                    >
                      {patient.patient_name}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-sm text-muted-foreground max-w-[240px] truncate"
                    title={patient.address}
                  >
                    {patient.address || "—"}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        title="Edit patient"
                        aria-label={`Edit ${patient.patient_name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditDialog(patient);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <AddPatientDialog
        open={dialogOpen}
        patient={editingPatient}
        onOpenChange={handleDialogOpenChange}
        onCreated={load}
      />
    </div>
  );
}
