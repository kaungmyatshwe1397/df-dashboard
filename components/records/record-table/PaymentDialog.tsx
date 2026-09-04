// Payment Dialog — Record a new installment payment for a Case record.
// Shows remaining balance, accepts paid amount and optional note.

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { CasePatientRecordType, PaymentStatus } from "@/lib/global";
import { FormField } from "@/components/shared/FormField";
import { formatCurrency } from "./RecordTableHelpers";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CasePatientRecordType;
}

export function PaymentDialog({
  open,
  onOpenChange,
  record,
}: PaymentDialogProps) {
  const { addPayment, getRecordBalance } = useData();
  const remaining = getRecordBalance(record);

  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{
    paymentDate?: string;
    paidAmount?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function resetForm() {
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaidAmount("");
    setNote("");
    setErrors({});
    setSubmitError(null);
  }

  function validate(): boolean {
    const newErrors: { paymentDate?: string; paidAmount?: string } = {};

    if (!paymentDate) {
      newErrors.paymentDate = "Payment date is required.";
    }

    const amount = parseFloat(paidAmount);
    if (!paidAmount || isNaN(amount) || amount <= 0) {
      newErrors.paidAmount = "Enter a valid amount greater than 0.";
    } else if (amount > remaining) {
      newErrors.paidAmount = `Amount cannot exceed remaining balance (${formatCurrency(remaining)}).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      addPayment({
        record_id: record.id,
        paid_amount: parseFloat(paidAmount),
        payment_note: note.trim() || undefined,
        payment_status:
          parseFloat(paidAmount) >= remaining
            ? PaymentStatus.PAID
            : PaymentStatus.UNPAID,
      });

      setSaving(false);
      onOpenChange(false);
      resetForm();
    } catch {
      setSaving(false);
      setSubmitError("Failed to save payment. Please try again.");
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Add an installment payment for {record.patient_name} ({record.patient_id}).
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-2">
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Remaining: </span>
            <span className="font-medium tabular-nums">
              {formatCurrency(remaining)}
            </span>
          </div>

          <FormField
            label="Payment Date"
            htmlFor="paymentDate"
            required
            error={errors.paymentDate}
          >
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => {
                setPaymentDate(e.target.value);
                setErrors((prev) => ({ ...prev, paymentDate: undefined }));
              }}
              disabled={saving}
            />
          </FormField>

          <FormField
            label="Paid Amount"
            htmlFor="paidAmount"
            required
            error={errors.paidAmount}
          >
            <Input
              id="paidAmount"
              type="number"
              min="0"
              step="1"
              placeholder={`e.g. ${Math.min(remaining, 100000)}`}
              value={paidAmount}
              onChange={(e) => {
                setPaidAmount(e.target.value);
                setErrors((prev) => ({ ...prev, paidAmount: undefined }));
              }}
              aria-invalid={!!errors.paidAmount}
              disabled={saving}
            />
          </FormField>

          <FormField label="Note" htmlFor="note" hint="(optional)">
            <Input
              id="note"
              placeholder="e.g. 2nd installment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={saving}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
