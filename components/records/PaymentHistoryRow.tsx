// Payment History Row — Expandable sub-row showing all installment payments
// for a specific case record. Displayed below the main case row in CaseTable.

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/DataContext";
import { PaymentStatus } from "@/lib/global";
import { formatCurrency, formatDate } from "./RecordTableHelpers";

interface PaymentHistoryRowProps {
  recordId: string;
  colSpan: number;
}

export function PaymentHistoryRow({
  recordId,
  colSpan,
}: PaymentHistoryRowProps) {
  const { getPaymentsForRecord } = useData();
  const payments = getPaymentsForRecord(recordId);

  if (payments.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="bg-muted/20 px-6 py-4">
          <p className="text-body-sm text-muted-foreground">
            No payments recorded yet.
          </p>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-muted/20 p-0">
        <div className="px-6 py-3">
          <p className="text-body-sm font-medium mb-2">
            Payment History ({payments.length})
          </p>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-body-sm text-muted-foreground">
                      {formatDate(payment.payment_date)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(payment.paid_amount)}
                    </TableCell>
                    <TableCell className="text-body-sm text-muted-foreground">
                      {payment.payment_note || "—"}
                    </TableCell>
                    <TableCell>
                      {payment.payment_status === PaymentStatus.PAID ? (
                        <Badge
                          variant="default"
                          className="bg-success text-text-inverse text-caption"
                        >
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-caption">
                          Incomplete
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
