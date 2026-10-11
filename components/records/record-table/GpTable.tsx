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
import { RecordCategory, GPPatientRecordType } from "@/lib/global";
import { useCanEdit } from "@/context/AuthContext";
import { MobileRecordCard } from "./mobileRecordCard";
import {
  ROWS_PER_PAGE,
  formatCurrency,
  formatDate,
  TableEmpty,
  TablePagination,
} from "./RecordTableHelpers";

export function GpTable({
  records,
  onAdd,
  onEdit,
}: {
  records: GPPatientRecordType[];
  onAdd: () => void;
  onEdit: (record: GPPatientRecordType | null, category: RecordCategory) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const canEdit = useCanEdit();
  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = records.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (records.length === 0) {
    return (
      <TableEmpty
        message="No GP records yet this cycle."
        onAdd={canEdit ? onAdd : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {records.length} record{records.length !== 1 ? "s" : ""}
        </p>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onEdit(null, RecordCategory.GP)}
              size="sm"
              variant="outline"
              className="border-input text-foreground"
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Update / Edit
            </Button>
            <Button
              onClick={onAdd}
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add GP Record
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3 lg:hidden">
        {paginatedRecords.map((record) => (
          <MobileRecordCard key={record.id} record={record}
            onEdit={canEdit ? (selected) => onEdit(selected as GPPatientRecordType, RecordCategory.GP) : undefined} />
        ))}
      </div>

      <div className="hidden rounded-xl border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium tabular-nums">
                  {record.patient_id}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
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
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {record.diagnosis}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(record.total_cost)}
                </TableCell>
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
