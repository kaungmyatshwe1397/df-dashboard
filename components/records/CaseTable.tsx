// Case Records tab — multi-installment records with remaining amount tracking.
// "Remaining" is used instead of "Balance" for clarity with patients.
// Includes Pay button per row and expandable payment history.

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
import { Plus, Pencil, CircleDollarSign, ChevronRight, ChevronDown } from "lucide-react";
import { useData } from "@/context/DataContext";
import { RecordCategory, CasePatientRecordType } from "@/lib/global";
import {
  ROWS_PER_PAGE,
  formatCurrency,
  formatDate,
  TableEmpty,
  TablePagination,
} from "./RecordTableHelpers";
import { PaymentHistoryRow } from "./PaymentHistoryRow";
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

function PaymentRow({
  record,
  remaining,
  totalPaid,
  isSettled,
  isExpanded,
  cycleLocked,
  onToggleExpand,
  onPay,
}: {
  record: CasePatientRecordType;
  remaining: number;
  totalPaid: number;
  isSettled: boolean;
  isExpanded: boolean;
  cycleLocked: boolean;
  onToggleExpand: (id: string) => void;
  onPay: (record: CasePatientRecordType) => void;
}) {
  return (
    <>
      <TableRow
        className={record.is_carried_forward ? "bg-muted/30" : ""}
      >
        <TableCell className="px-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onToggleExpand(record.id)}
            title={isExpanded ? "Collapse payment history" : "View payment history"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium tabular-nums">
          {record.patient_id}
        </TableCell>
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
        <TableCell className="text-body-sm text-muted-foreground">
          {record.lab_name}
        </TableCell>
        <TableCell className="text-right font-medium tabular-nums">
          {formatCurrency(record.total_cost)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {formatCurrency(totalPaid)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          <span className={remaining > 0 ? "text-muted-foreground" : ""}>
            {formatCurrency(remaining)}
          </span>
        </TableCell>
        <TableCell>
          {isSettled ? (
            <Badge variant="default" className="bg-success text-text-inverse text-caption">
              Payment Complete
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-caption">
              Incomplete
            </Badge>
          )}
        </TableCell>
        <TableCell>
          {!cycleLocked && !isSettled && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPay(record)}
              title="Record payment"
            >
              <CircleDollarSign className="h-4 w-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <PaymentHistoryRow recordId={record.id} colSpan={11} />
      )}
    </>
  );
}
