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
import { Plus } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useCanEdit } from "@/context/AuthContext";
import { RecordCategory, CasePatientRecordType } from "@/lib/global";
import {
  ROWS_PER_PAGE,
  TableEmpty,
  TablePagination,
} from "./RecordTableHelpers";
import { PaymentRow } from "./PaymentRow";
import { PaymentDialog } from "./PaymentDialog";
import { MobileRecordCard } from "./mobileRecordCard";
import { RecordSortMenu, sortRecords, type RecordSortValueType } from "./recordSort";

export function CaseTable({
  records,
  onAdd,
  onEdit,
}: {
  records: CasePatientRecordType[];
  onAdd: () => void;
  onEdit: (record: CasePatientRecordType | null, category: RecordCategory) => void;
}) {
  const { getRecordBalance, getRecordTotalPaid, getPaymentsForRecord } = useData();
  const canEdit = useCanEdit();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortValue, setSortValue] = useState<RecordSortValueType>("date:desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [payRecord, setPayRecord] = useState<CasePatientRecordType | null>(null);

  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = sortRecords(records, sortValue).slice(startIndex, startIndex + ROWS_PER_PAGE);

  function toggleExpand(recordId: string) {
    setExpandedRow((prev) => (prev === recordId ? null : recordId));
  }

  if (records.length === 0) {
    return (
      <TableEmpty
        message="No case records yet this cycle."
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
              Add New Case
            </Button>}
          </div>
      </div>

      <div className="space-y-3 2xl:hidden">
        {paginatedRecords.map((record) => (
          <MobileRecordCard key={record.id} record={record}
            totalPaid={getRecordTotalPaid(record.id)} remaining={getRecordBalance(record)}
            payments={getPaymentsForRecord(record.id)} expanded={expandedRow === record.id}
            onToggleHistory={toggleExpand} onPay={canEdit ? setPayRecord : undefined}
            onEdit={canEdit ? (selected) => onEdit(selected as CasePatientRecordType, RecordCategory.CASE) : undefined} />
        ))}
      </div>

      <div className="hidden rounded-xl border border-border 2xl:block">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-24">Date</TableHead>
              <TableHead className="w-24">Patient ID</TableHead>
              <TableHead className="w-32">Name</TableHead>
              <TableHead>Treatment</TableHead>
              <TableHead className="w-28">Lab</TableHead>
              <TableHead className="w-24 text-right">Total</TableHead>
              <TableHead className="w-24 text-right">Paid</TableHead>
              <TableHead className="w-24 text-right">Remaining</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record, index) => {
              const remaining = getRecordBalance(record);
              const totalPaid = getRecordTotalPaid(record.id);
              const isSettled = remaining <= 0;
              const isExpanded = expandedRow === record.id;

              return (
                <PaymentRow
                  key={record.id}
                  record={record}
                  rowNumber={startIndex + index + 1}
                  remaining={remaining}
                  totalPaid={totalPaid}
                  isSettled={isSettled}
                  isExpanded={isExpanded}
                  onToggleExpand={toggleExpand}
                  onPay={canEdit ? setPayRecord : undefined}
                  onEdit={canEdit ? (selected) => onEdit(selected, RecordCategory.CASE) : undefined}
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
