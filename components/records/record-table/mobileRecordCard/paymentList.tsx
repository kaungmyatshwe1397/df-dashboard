// Installment history stacks labelled values so payment notes remain readable on phones.

import { Badge } from "@/components/ui/badge";
import { DataField } from "@/components/shared/dataField";
import { PaymentStatus, type CasePayment } from "@/lib/global";
import { formatCurrency, formatDate } from "../RecordTableHelpers";

export function PaymentList({ payments }: { payments: CasePayment[] }) {
  if (!payments.length) {
    return <p className="text-body-sm text-muted-foreground">No payments recorded yet.</p>;
  }
  return (
    <ul className="space-y-3" aria-label="Installment payments">
      {payments.map((payment) => (
        <li key={payment.id} className="space-y-3 rounded-lg border border-border p-3">
          <dl className="grid grid-cols-2 gap-3">
            <DataField label="Date">{formatDate(payment.payment_date)}</DataField>
            <DataField label="Amount"><span className="font-medium tabular-nums">{formatCurrency(payment.paid_amount)}</span></DataField>
            <DataField className="col-span-2" label="Note">{payment.payment_note || "Not provided"}</DataField>
          </dl>
          <Badge variant="secondary">
            {payment.payment_status === PaymentStatus.PAID ? "Completed" : "Incomplete"}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
