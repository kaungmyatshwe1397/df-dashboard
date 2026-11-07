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
import { Plus } from "lucide-react";
import { RecordCategory, GPPatientRecordType } from "@/lib/global";
import { useCanEdit } from "@/context/AuthContext";
import { MobileRecordCard } from "./mobileRecordCard";
import { RecordSortMenu, sortRecords, type RecordSortValueType } from "./recordSort";
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
  const [sortValue, setSortValue] = useState<RecordSortValueType>("date:desc");
  const canEdit = useCanEdit();
  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = sortRecords(records, sortValue).slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (records.length === 0) {
    return (
      <TableEmpty
        message="No GP records yet this cycle."
        onAdd={canEdit ? onAdd : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-muted-foreground">
          {records.length} record{records.length !== 1 ? "s" : ""}
        </p>
          <div className="flex flex-wrap gap-2">
            <RecordSortMenu value={sortValue} onChange={(next) => { setSortValue(next); setCurrentPage(1); }} />
            {canEdit &&
            <Button
              onClick={onAdd}
              size="sm"
            >
              <Plus className="size-4" />
              Add GP Record
            </Button>}
          </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {paginatedRecords.map((record, index) => (
          <MobileRecordCard key={record.id} record={record}
            rowNumber={startIndex + index + 1}
            onEdit={canEdit ? (selected) => onEdit(selected as GPPatientRecordType, RecordCategory.GP) : undefined} />
        ))}
      </div>

      <div className="hidden rounded-xl border border-border lg:block">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5%]">#</TableHead>
              <TableHead className="w-[14%]">Date</TableHead>
              <TableHead className="w-[24%]">Patient Name</TableHead>
              <TableHead className="w-[27%]">Diagnosis</TableHead>
              <TableHead className="w-[14%] text-right">Total Cost</TableHead>
              <TableHead className="w-[16%] text-right">Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record, index) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium tabular-nums">
                  {startIndex + index + 1}
                </TableCell>
                <TableCell className="truncate text-body-sm text-muted-foreground" title={formatDate(record.entry_date)}>
                  {formatDate(record.entry_date)}
                </TableCell>
                <TableCell>
                  <span
                    className="block truncate text-h4 font-semibold"
                    title={record.patient_name}
                  >
                    {record.patient_name}
                  </span>
                </TableCell>
                <TableCell className="truncate text-body-sm text-muted-foreground" title={record.diagnosis}>
                  {record.diagnosis}
                </TableCell>
                <TableCell className="truncate text-right font-medium tabular-nums" title={formatCurrency(record.total_cost)}>
                  {formatCurrency(record.total_cost)}
                </TableCell>
                <TableCell className="text-right">{canEdit && <Button variant="outline" size="sm" onClick={() => onEdit(record, RecordCategory.GP)}>Edit visit</Button>}</TableCell>
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
