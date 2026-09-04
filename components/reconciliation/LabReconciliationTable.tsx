// ============================================
// Lab Reconciliation Table
// Admin portal — lab fee input per Case record
// Columns: Patient Name, Date, Diagnosis, Lab, Lab Fee
// Lab name is read-only — assigned during case patient creation.
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
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
        step="1"
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
  const { records, loading, error, refreshData, updateRecord } = useData();
  const [savingId, setSavingId] = useState<string | null>(null);

  const caseRecords = useMemo(
    () => records.filter((r) => r.category === RecordCategory.CASE),
    [records]
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
              <TableHead>Patient Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Lab</TableHead>
              <TableHead className="text-right">Lab Fee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
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
            <TableHead>Patient Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Diagnosis</TableHead>
            <TableHead>Lab</TableHead>
            <TableHead className="text-right">Lab Fee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {caseRecords.map((record) => {
            const isSaving = savingId === record.id;

            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium max-w-[160px] truncate">
                  {record.patient_name}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(record.entry_date)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {record.diagnosis}
                </TableCell>
                <TableCell>
                  {record.lab_name ? (
                    <span className="text-sm">{record.lab_name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Not assigned</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <LabFeeInput
                    record={record}
                    onSave={handleFeeSave}
                    saving={isSaving}
                    cycleLocked={cycleLocked}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
