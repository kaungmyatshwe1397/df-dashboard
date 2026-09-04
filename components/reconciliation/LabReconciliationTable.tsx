// ============================================
// Lab Reconciliation Table
// Admin portal — lab assignment + lab fee input per Case record
// ============================================

"use client";

import { useState, useCallback, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { PatientRecord, RecordCategory, LabPaymentStatus } from "@/lib/global";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ------------------------------------------
// Lab Selector — toggle buttons for lab assignment
// ------------------------------------------

interface LabSelectorProps {
  record: PatientRecord;
  labs: { id: string; lab_name: string }[];
  onSelect: (recordId: string, labId: string, labName: string) => void;
  disabled: boolean;
}

function LabSelector({ record, labs, onSelect, disabled }: LabSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {labs.map((lab) => (
        <Button
          key={lab.id}
          variant={record.lab_id === lab.id ? "default" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={disabled}
          onClick={() => onSelect(record.id, lab.id, lab.lab_name)}
        >
          {lab.lab_name}
        </Button>
      ))}
    </div>
  );
}

// ------------------------------------------
// Lab Fee Input — inline editable number field
// ------------------------------------------

interface LabFeeInputProps {
  record: PatientRecord;
  onSave: (recordId: string, fee: number) => void;
  saving: boolean;
  cycleLocked: boolean;
}

function LabFeeInput({ record, onSave, saving, cycleLocked }: LabFeeInputProps) {
  const [value, setValue] = useState(record.lab_fee?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed === "") {
      onSave(record.id, 0);
      setError(null);
      return;
    }

    const parsed = Number(trimmed);
    if (isNaN(parsed)) {
      setError("Must be a number");
      return;
    }
    if (parsed < 0) {
      setError("Cannot be negative");
      return;
    }
    setError(null);
    onSave(record.id, parsed);
  }, [value, record.id, onSave]);

  return (
    <div className="flex flex-col gap-1">
      <Input
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        disabled={cycleLocked || saving}
        className="h-8 w-28 text-right"
        placeholder="0"
      />
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}

// ------------------------------------------
// Main Table
// ------------------------------------------

interface LabReconciliationTableProps {
  cycleLocked: boolean;
}

export function LabReconciliationTable({ cycleLocked }: LabReconciliationTableProps) {
  const { records, labs, loading, error, refreshData, updateRecord } = useData();
  const [savingId, setSavingId] = useState<string | null>(null);

  const caseRecords = useMemo(
    () => records.filter((r) => r.category === RecordCategory.CASE),
    [records]
  );

  const totalLabFees = useMemo(
    () => caseRecords.reduce((sum, r) => sum + (r.lab_fee ?? 0), 0),
    [caseRecords]
  );

  const handleLabSelect = useCallback(
    (recordId: string, labId: string, labName: string) => {
      updateRecord(recordId, { lab_id: labId, lab_name: labName });
    },
    [updateRecord]
  );

  const handleFeeSave = useCallback(
    (recordId: string, fee: number) => {
      setSavingId(recordId);
      const newStatus =
        fee > 0 ? LabPaymentStatus.PAID : LabPaymentStatus.UNPAID;
      updateRecord(recordId, {
        lab_fee: fee,
        lab_payment_status: newStatus,
      });
      setTimeout(() => setSavingId(null), 300);
    },
    [updateRecord]
  );

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Lab</TableHead>
              <TableHead className="text-right">Lab Fee</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-7 w-40" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="flex items-center justify-between">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="mr-2 h-3 w-3" />
          Retry
        </Button>
      </Alert>
    );
  }

  if (caseRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12">
        <AlertTriangle className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No cases to reconcile</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead className="text-right">Total Cost</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Lab</TableHead>
            <TableHead className="text-right">Lab Fee</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {caseRecords.map((record) => {
            const paid = record.paid ?? 0;
            const balance = record.remaining ?? record.total_cost - paid;
            const isSaving = savingId === record.id;

            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium max-w-[160px] truncate">
                  {record.patient_name}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(record.total_cost)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(paid)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(balance)}
                </TableCell>
                <TableCell>
                  <LabSelector
                    record={record}
                    labs={labs}
                    onSelect={handleLabSelect}
                    disabled={cycleLocked}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <LabFeeInput
                    record={record}
                    onSave={handleFeeSave}
                    saving={isSaving}
                    cycleLocked={cycleLocked}
                  />
                </TableCell>
                <TableCell>
                  {(record.lab_fee ?? 0) > record.total_cost ? (
                    <Badge variant="destructive">Over Cost</Badge>
                  ) : (record.lab_fee ?? 0) > 0 ? (
                    <Badge variant="default">Assigned</Badge>
                  ) : (
                    <Badge variant="secondary">Unassigned</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="text-right font-semibold">
              Total Lab Fees
            </TableCell>
            <TableCell colSpan={2} className="text-right font-semibold">
              {formatCurrency(totalLabFees)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
