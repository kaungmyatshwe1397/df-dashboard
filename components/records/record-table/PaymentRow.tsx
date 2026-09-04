// PaymentRow — single table row for a Case record with expand/collapse toggle.
// Extracted from CaseTable to keep each component focused on one responsibility.

"use client";

import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, ChevronRight, ChevronDown } from "lucide-react";
import { CasePatientRecordType } from "@/lib/global";
import { formatDate } from "./RecordTableHelpers";
import { PaymentHistoryRow } from "./PaymentHistoryRow";

export interface PaymentRowProps {
  record: CasePatientRecordType;
  remaining: number;
  totalPaid: number;
  isSettled: boolean;
  isExpanded: boolean;
  cycleLocked: boolean;
  onToggleExpand: (id: string) => void;
  onPay: (record: CasePatientRecordType) => void;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function PaymentRow({
  record,
  remaining,
  totalPaid,
  isSettled,
  isExpanded,
  cycleLocked,
  onToggleExpand,
  onPay,
}: PaymentRowProps) {
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
