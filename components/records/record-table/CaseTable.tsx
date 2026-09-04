// Case Records tab — multi-installment records with remaining amount tracking.
// "Remaining" is used instead of "Balance" for clarity with patients.
// Includes Pay button per row and expandable payment history.

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { useData } from "@/context/DataContext";
import { RecordCategory, CasePatientRecordType } from "@/lib/global";
import {
  ROWS_PER_PAGE,
  TableEmpty,
  TablePagination,
} from "./RecordTableHelpers";
import { PaymentRow } from "./PaymentRow";
import { PaymentDialog } from "./PaymentDialog";

export function CaseTable({
  records,
  cycleLocked,
  onAdd,
  onEdit,
}: {
  records: CasePatientRecordType[];
  cycleLocked: boolean;
  onAdd: () => void;
  onEdit: (record: CasePatientRecordType | null, category: RecordCategory) => void;
}) {
  const { getRecordBalance, getRecordTotalPaid } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [payRecord, setPayRecord] = useState<CasePatientRecordType | null>(null);

  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = records.slice(startIndex, startIndex + ROWS_PER_PAGE);

  function toggleExpand(recordId: string) {
    setExpandedRow((prev) => (prev === recordId ? null : recordId));
  }

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
          <div className="flex gap-2">
            <Button onClick={() => onEdit(null, RecordCategory.CASE)} size="sm" variant="outline">
              <Pencil className="mr-1.5 h-4 w-4" />
              Update / Edit
            </Button>
            <Button onClick={onAdd} size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Add New Case
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Patient ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Lab</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => {
              const remaining = getRecordBalance(record);
              const totalPaid = getRecordTotalPaid(record.id);
              const isSettled = remaining <= 0;
              const isExpanded = expandedRow === record.id;

              return (
                <PaymentRow
                  key={record.id}
                  record={record}
                  remaining={remaining}
                  totalPaid={totalPaid}
                  isSettled={isSettled}
                  isExpanded={isExpanded}
                  cycleLocked={cycleLocked}
                  onToggleExpand={toggleExpand}
                  onPay={setPayRecord}
                />
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

      {payRecord && (
        <PaymentDialog
          open={!!payRecord}
          onOpenChange={(open) => {
            if (!open) setPayRecord(null);
          }}
          record={payRecord}
        />
      )}
    </div>
  );
}
