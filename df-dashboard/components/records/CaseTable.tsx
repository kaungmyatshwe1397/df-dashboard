// Case Records tab — multi-installment records with balance tracking.

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { useData } from "@/context/DataContext";
import { PatientRecord } from "@/lib/global";
import {
  ROWS_PER_PAGE,
  formatCurrency,
  formatDate,
  TableEmpty,
  TablePagination,
} from "./RecordTableHelpers";

export function CaseTable({
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
  const { getRecordBalance, getRecordTotalPaid } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = records.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (records.length === 0) {
    return (
      <TableEmpty
        message="No case records yet this cycle."
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
            Add Case Record
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
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
              {!cycleLocked && <TableHead className="w-15" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => {
              const balance = getRecordBalance(record);
              const totalPaid = getRecordTotalPaid(record.id);
              const isSettled = balance <= 0;

              return (
                <TableRow
                  key={record.id}
                  className={record.is_carried_forward ? "bg-muted/30" : ""}
                >
                  <TableCell className="text-body-sm text-muted-foreground">
                    {formatDate(record.entry_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium max-w-50 truncate"
                        title={record.patient_name}
                      >
                        {record.patient_name}
                      </span>
                      {record.is_carried_forward && (
                        <Badge variant="outline" className="text-caption shrink-0">
                          Carried forward
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-body-sm text-muted-foreground max-w-50 truncate">
                    {record.diagnosis}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(record.total_cost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(totalPaid)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={balance > 0 ? "text-muted-foreground" : ""}>
                      {formatCurrency(balance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isSettled ? (
                      <Badge variant="default" className="bg-success text-text-inverse text-caption">
                        Payment Complete
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-caption">
                        In Progress
                      </Badge>
                    )}
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
              );
            })}
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
