// RegisteredPatientsTable — searchable, paginated registry listing.
// Reads the full patients registry once (newest first), filters client-side,
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
import { Search } from "lucide-react";
import { PatientType } from "@/lib/global";
import { usePatients } from "@/context/hooks/usePatients";
import {
  ROWS_PER_PAGE,
  TableEmpty,
  TableError,
  TablePagination,
  TableSkeleton,
} from "@/components/records/record-table/RecordTableHelpers";
import { filterPatients, formatRegisteredDate } from "./helpers";

export interface RegisteredPatientsTablePropsType {
  onRowSelect: (patient: PatientType) => void;
}

export { PatientDetailDialog } from "./patientDetailDialog";

export function RegisteredPatientsTable({
  onRowSelect,
}: RegisteredPatientsTablePropsType) {
  const { listPatients } = usePatients();
  const [patients, setPatients] = useState<PatientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  const filtered = filterPatients(patients, query);
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const pageRows = filtered.slice(startIndex, startIndex + ROWS_PER_PAGE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setCurrentPage(1);
  }

  if (loading) return <TableSkeleton columns={5} />;

  if (error) {
    return <TableError message={error} onRetry={load} />;
  }

  if (patients.length === 0) {
    return <TableEmpty message="No registered patients yet." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} patient{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by ID or name"
            aria-label="Search registered patients"
            className="pl-8"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <TableEmpty message={`No patients match “${query.trim()}”.`} />
      ) : (
        <div className="rounded-[14px] border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Address</TableHead>
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
    </div>
  );
}
