// Lab Reconciliation — grouped case fees with responsive inline editing.

"use client";

import { useState, useCallback, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useCanEdit } from "@/context/AuthContext";
import { RecordCategory, CasePatientRecordType, LabPaymentStatus } from "@/lib/global";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { LabFeeInput } from "./LabFeeInput";
import { LabGroup } from "./Types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US");
}

const ALL_LABS_VALUE = "Labs";
const RECORD_GRID_COLUMNS =
  "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.15fr)_minmax(0,1.4fr)_minmax(0,auto)]";

export function LabReconciliationTable() {
  const { records, loading, error, refreshData, updateRecord } = useData();
  const canEdit = useCanEdit();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{ recordId: string; message: string } | null>(null);
  const [selectedLab, setSelectedLab] = useState<string>(ALL_LABS_VALUE);

  const caseRecords = useMemo(
    () => records.filter((r) => r.category === RecordCategory.CASE),
    [records]
  );

  const labGroups = useMemo<LabGroup[]>(() => {
    const map = new Map<string, CasePatientRecordType[]>();

    for (const record of caseRecords) {
      const lab = record.lab_name ?? "Unknown";
      const group = map.get(lab);
      if (group) {
        group.push(record);
      } else {
        map.set(lab, [record]);
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([labName, recs]) => ({
        labName,
        records: recs,
        totalFees: recs.reduce((sum, r) => sum + (r.lab_fee ?? 0), 0),
      }));
  }, [caseRecords]);

  const visibleGroups = useMemo(
    () =>
      selectedLab === ALL_LABS_VALUE
        ? labGroups
        : labGroups.filter((group) => group.labName === selectedLab),
    [labGroups, selectedLab]
  );

  const visibleRecordCount = visibleGroups.reduce(
    (sum, group) => sum + group.records.length,
    0
  );

  const handleFeeSave = useCallback(
    (recordId: string, fee: number) => {
      setSavingId(recordId);
      setSaveError(null);
      const newStatus = fee > 0 ? LabPaymentStatus.PAID : LabPaymentStatus.UNPAID;

      void updateRecord(recordId, {
        lab_fee: fee,
        lab_payment_status: newStatus,
      })
        .catch((saveFailure: unknown) => {
          setSaveError({
            recordId,
            message: saveFailure instanceof Error
              ? saveFailure.message
              : "Could not save the lab fee. Try again.",
          });
        })
        .finally(() => {
          setSavingId((currentId) => (currentId === recordId ? null : currentId));
        });
    },
    [updateRecord]
  );

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading lab reconciliation">
        <Skeleton className="h-20 w-full rounded-xl" />
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <Card key={groupIndex}>
            <CardHeader className="border-b">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4 py-4">
              {Array.from({ length: 2 }).map((__, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`grid gap-4 ${RECORD_GRID_COLUMNS}`}
                >
                  {Array.from({ length: 5 }).map((___, columnIndex) => (
                    <Skeleton key={columnIndex} className="h-10 w-full" />
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </Alert>
    );
  }

  if (caseRecords.length === 0) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <AlertTriangle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No cases to reconcile</p>
            <p className="text-sm text-muted-foreground">
              Case records will appear here when they are added.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">Case records</p>
            <Badge variant="secondary">{visibleRecordCount}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {visibleRecordCount} {visibleRecordCount === 1 ? "case" : "cases"}
            {selectedLab === ALL_LABS_VALUE && ` across ${labGroups.length} labs`}
            {" · "}Fees save when you leave the field or press Enter.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={selectedLab}
            onValueChange={(value) => setSelectedLab(value ?? ALL_LABS_VALUE)}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="Filter cases by lab">
              <SelectValue placeholder="Filter by lab" />
            </SelectTrigger>
            <SelectContent className="[&_[data-slot=select-item-text]]:min-w-0 [&_[data-slot=select-item-text]]:shrink [&_[data-slot=select-item-text]]:whitespace-normal [&_[data-slot=select-item-text]]:[overflow-wrap:anywhere]">
              <SelectItem value={ALL_LABS_VALUE}>
                All labs ({caseRecords.length})
              </SelectItem>
              {labGroups.map((group) => (
                <SelectItem key={group.labName} value={group.labName}>
                  {group.labName} ({group.records.length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedLab !== ALL_LABS_VALUE && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLab(ALL_LABS_VALUE)}
            >
              <X className="mr-2 h-4 w-4" />
              Clear filter
            </Button>
          )}
        </div>
      </div>

      {visibleGroups.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="font-medium">No cases for this lab</p>
            <Button variant="outline" size="sm" onClick={() => setSelectedLab(ALL_LABS_VALUE)}>
              Clear filter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map((group) => (
            <Card key={group.labName}>
              <CardHeader className="flex flex-col items-start gap-4 border-b sm:flex-row sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="[overflow-wrap:anywhere]">{group.labName}</CardTitle>
                  <CardDescription>
                    {group.records.length} {group.records.length === 1 ? "case" : "cases"}
                  </CardDescription>
                </div>
                <div className="min-w-0 max-w-full rounded-lg bg-muted px-3 py-2 text-right">
                  <p className="text-xs text-muted-foreground">Total lab fees</p>
                  <p className="[overflow-wrap:anywhere] font-semibold tabular-nums">{formatCurrency(group.totalFees)}</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  className={`hidden ${RECORD_GRID_COLUMNS} gap-4 border-b bg-muted/30 px-4 py-2 text-caption font-medium text-muted-foreground lg:grid`}
                >
                  <span>Date</span>
                  <span>Patient ID</span>
                  <span>Patient</span>
                  <span>Case</span>
                  <span className="text-right">Lab fee</span>
                </div>
                <div className="divide-y">
                  {group.records.map((record) => (
                    <div
                      key={record.id}
                      className={`grid gap-3 p-4 ${RECORD_GRID_COLUMNS} lg:items-center lg:gap-4`}
                    >
                      <div className="min-w-0">
                        <p className="text-caption text-muted-foreground lg:hidden">
                          Date
                        </p>
                        <p className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(record.entry_date)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-caption text-muted-foreground lg:hidden">
                          Patient ID
                        </p>
                        <p className="[overflow-wrap:anywhere] text-sm text-muted-foreground">{record.patient_id}</p>
                      </div>
                      <div className="order-first min-w-0 lg:order-none">
                        <p className="text-caption text-muted-foreground lg:hidden">
                          Patient
                        </p>
                        <p className="[overflow-wrap:anywhere] font-medium">{record.patient_name}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-caption text-muted-foreground lg:hidden">
                          Case
                        </p>
                        <p className="[overflow-wrap:anywhere] text-sm">{record.diagnosis}</p>
                      </div>
                      <div className="flex min-w-0 flex-col gap-2 lg:items-end lg:justify-end">
                        <span className="text-caption text-muted-foreground lg:hidden">
                          Lab fee
                        </span>
                        <LabFeeInput
                          record={record}
                          onSave={handleFeeSave}
                          saving={savingId === record.id}
                          readOnly={!canEdit}
                        />
                        <Badge variant="secondary" className="w-fit">
                          {(record.lab_fee ?? 0) > 0 ? "Paid" : "Unpaid"}
                        </Badge>
                      </div>
                      {saveError?.recordId === record.id && (
                        <Alert variant="destructive" role="alert" className="lg:col-span-full [overflow-wrap:anywhere]">
                          <span>Lab fee for {record.patient_name}: {saveError.message}</span>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
