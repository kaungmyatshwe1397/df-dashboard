// Mobile records preserve treatment and payment context while keeping actions beside their record.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataField } from "@/components/shared/dataField";
import { RecordCategory } from "@/lib/global";
import { formatCurrency, formatDate } from "../RecordTableHelpers";
import { PaymentList } from "./paymentList";
import type { MobileRecordCardPropsType } from "./types";

export function MobileRecordCard({
  record, totalPaid = 0, remaining = 0, payments = [], expanded = false,
  onToggleHistory, onEdit, onPay,
}: MobileRecordCardPropsType) {
  const isCase = record.category === RecordCategory.CASE;
  const historyId = `mobile-payments-${record.id}`;
  return (
    <Card size="sm" className="min-w-0" aria-label={`Record for ${record.patient_name}`}>
      <CardHeader>
        <CardTitle className="[overflow-wrap:anywhere]">{record.patient_name}</CardTitle>
        <CardDescription className="[overflow-wrap:anywhere]">{record.patient_id}</CardDescription>
        {isCase && (
          <div className="flex flex-wrap gap-2 pt-2">
            {record.is_carried_forward && <Badge variant="outline">Carried forward</Badge>}
            <Badge variant="secondary">{remaining <= 0 ? "Payment Complete" : "Incomplete"}</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="grid grid-cols-2 gap-3">
          <DataField label="Date">{formatDate(record.entry_date)}</DataField>
          <DataField label="Total Cost"><span className="font-medium tabular-nums">{formatCurrency(record.total_cost)}</span></DataField>
          <DataField className="col-span-2" label="Diagnosis">{record.diagnosis || "Not provided"}</DataField>
          {isCase && <>
            <DataField label="Paid"><span className="tabular-nums">{formatCurrency(totalPaid)}</span></DataField>
            <DataField label="Remaining"><span className="font-medium tabular-nums">{formatCurrency(remaining)}</span></DataField>
            <DataField className="col-span-2" label="Lab">{record.lab_name || "Not provided"}</DataField>
          </>}
        </dl>
        {(onEdit || (isCase && onPay && remaining > 0)) && (
          <div className="flex flex-wrap gap-2">
            {onEdit && <Button variant="outline" className="flex-1" onClick={() => onEdit(record)}>Edit record</Button>}
            {isCase && onPay && remaining > 0 && <Button className="flex-1" onClick={() => onPay(record)}>Record payment</Button>}
          </div>
        )}
        {isCase && onToggleHistory && (
          <Button variant="ghost" className="w-full" aria-expanded={expanded} aria-controls={historyId} onClick={() => onToggleHistory(record.id)}>
            Payment history
          </Button>
        )}
        {isCase && expanded && <div id={historyId}><PaymentList payments={payments} /></div>}
      </CardContent>
    </Card>
  );
}
