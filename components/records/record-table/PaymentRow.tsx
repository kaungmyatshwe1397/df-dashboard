// PaymentRow — single table row for a Case record with expand/collapse toggle.
// Extracted from CaseTable to keep each component focused on one responsibility.

"use client";

import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, ChevronDown, Pencil } from "lucide-react";
import { CasePatientRecordType } from "@/lib/global";
import { formatDate } from "./RecordTableHelpers";
import { PaymentHistoryRow } from "./PaymentHistoryRow";

export interface PaymentRowProps {
  record: CasePatientRecordType;
  rowNumber: number;
  remaining: number;
  totalPaid: number;
  isSettled: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onPay?: (record: CasePatientRecordType) => void;
  onEdit?: (record: CasePatientRecordType) => void;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function PaymentRow({
  record,
  rowNumber,
  remaining,
  totalPaid,
  isSettled,
  isExpanded,
  onToggleExpand,
  onPay,
  onEdit,
}: PaymentRowProps) {
  return (
    <>
      <TableRow
        className={record.is_carried_forward ? "bg-muted/30" : ""}
      >
        <TableCell className="text-caption text-muted-foreground tabular-nums">{rowNumber}</TableCell>
        <TableCell className="truncate text-body-sm text-muted-foreground" title={formatDate(record.entry_date)}>{formatDate(record.entry_date)}</TableCell>
        <TableCell className="truncate text-body-sm tabular-nums" title={record.patient_id ?? "Not assigned"}>{record.patient_id ?? "Not assigned"}</TableCell>
        <TableCell className="truncate text-h4 font-semibold" title={record.patient_name}>{record.patient_name}</TableCell>
        <TableCell className="truncate text-body-sm" title={record.diagnosis || undefined}>{record.diagnosis || "No diagnosis"}</TableCell>
        <TableCell className="truncate text-body-sm text-muted-foreground" title={record.lab_name || undefined}>{record.lab_name || "Not assigned"}</TableCell>
        <TableCell className="text-right text-body-sm font-medium tabular-nums">{formatCurrency(record.total_cost)}</TableCell>
        <TableCell className="text-right text-body-sm tabular-nums">{formatCurrency(totalPaid)}</TableCell>
        <TableCell className="text-right text-body-sm tabular-nums">{formatCurrency(remaining)}</TableCell>
        <TableCell>{isSettled ? <Badge variant="default" className="bg-chart-2 text-background text-caption">Payment Complete</Badge> : <Badge variant="secondary" className="text-caption">Incomplete</Badge>}</TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="xs" onClick={() => onToggleExpand(record.id)} aria-label={isExpanded ? `Hide payments for ${record.patient_name}` : `View payments for ${record.patient_name}`}>Payments<ChevronDown className="size-3" /></Button>
            {onEdit && <Button variant="outline" size="xs" onClick={() => onEdit(record)} aria-label={`Edit visit for ${record.patient_name}`}><Pencil className="size-3" />Edit</Button>}
            {!isSettled && onPay && <Button variant="outline" size="xs" onClick={() => onPay(record)} aria-label={`Record payment for ${record.patient_name}`}><CircleDollarSign className="size-3" />Pay</Button>}
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <PaymentHistoryRow recordId={record.id} colSpan={11} />
      )}
    </>
  );
}
