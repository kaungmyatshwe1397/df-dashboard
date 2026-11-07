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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
        <TableCell className="truncate text-h4 font-semibold" title={record.patient_name}>{record.patient_name}</TableCell>
        <TableCell className="truncate text-body-sm" title={record.diagnosis || undefined}>{record.diagnosis || "No diagnosis"}</TableCell>
        <TableCell className="truncate text-right text-body-sm font-medium tabular-nums" title={formatCurrency(record.total_cost)}>{formatCurrency(record.total_cost)}</TableCell>
        <TableCell className="truncate text-right text-body-sm tabular-nums" title={formatCurrency(totalPaid)}>{formatCurrency(totalPaid)}</TableCell>
        <TableCell className="truncate text-right text-body-sm tabular-nums" title={formatCurrency(remaining)}>{formatCurrency(remaining)}</TableCell>
        <TableCell>{isSettled ? <Badge variant="default" className="max-w-full bg-chart-2 text-background text-caption" title="Payment Complete"><span className="truncate">Payment Complete</span></Badge> : <Badge variant="secondary" className="max-w-full text-caption"><span className="truncate">Incomplete</span></Badge>}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="xs" aria-label={`Actions for ${record.patient_name}`} />}>Actions</DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem onClick={() => onToggleExpand(record.id)}><ChevronDown className="size-3" />{isExpanded ? "Hide payments" : "View payments"}</DropdownMenuItem>
              {onEdit && <DropdownMenuItem onClick={() => onEdit(record)}><Pencil className="size-3" />Edit visit</DropdownMenuItem>}
              {!isSettled && onPay && <DropdownMenuItem onClick={() => onPay(record)}><CircleDollarSign className="size-3" />Record payment</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <PaymentHistoryRow recordId={record.id} colSpan={9} />
      )}
    </>
  );
}
