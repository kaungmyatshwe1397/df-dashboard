// GP Records tab — single-session records, no balance tracking.

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { PatientRecord } from "@/lib/global";
import {
  ROWS_PER_PAGE,
  formatCurrency,
  formatDate,
  TableEmpty,
  TablePagination,
} from "./RecordTableHelpers";

export function GpTable({
  records,
  cycleLocked,
  onAdd,
  onEdit,
}: {
  records: PatientRecord[];
  cycleLocked: boolean;
  onAdd: () => void;
  onEdit: (record: PatientRecord) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = records.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (records.length === 0) {
    return (
      <TableEmpty
        message="No GP records yet this cycle."
        onAdd={onAdd}
        cycleLocked={cycleLocked}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-muted-foreground">
          {records.length} record{records.length !== 1 ? "s" : ""}
        </p>
        {!cycleLocked && (
          <Button onClick={onAdd} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add GP Record
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              {!cycleLocked && <TableHead className="w-15" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="text-body-sm text-muted-foreground">
                  {formatDate(record.entry_date)}
                </TableCell>
                <TableCell>
                  <span
                    className="font-medium max-w-50 truncate"
                    title={record.patient_name}
                  >
                    {record.patient_name}
                  </span>
                </TableCell>
                <TableCell className="text-body-sm text-muted-foreground max-w-[200px] truncate">
                  {record.diagnosis}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(record.total_cost)}
                </TableCell>
                {!cycleLocked && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(record)}
                      aria-label={`Edit ${record.patient_name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
