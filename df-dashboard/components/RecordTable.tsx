"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, RefreshCw, Lock } from "lucide-react";
import { useData } from "@/context/DataContext";
import { RecordCategory } from "@/lib/global";

const ROWS_PER_PAGE = 10;

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RecordTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RecordTableEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-md border p-12 text-center">
      <p className="text-muted-foreground text-body mb-4">
        No entries yet this cycle.
      </p>
      <Button onClick={onAdd} size="sm">
        <Plus className="mr-1.5 h-4 w-4" />
        Add Record
      </Button>
    </div>
  );
}

function RecordTableError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center justify-between">
        <span>Failed to load records. Please try again.</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function RecordTable({ onAdd }: { onAdd: () => void }) {
  const {
    records,
    cycleLocked,
    loading,
    error,
    getRecordBalance,
    getRecordTotalPaid,
    refreshData,
  } = useData();

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(records.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedRecords = records.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (loading) {
    return <RecordTableSkeleton />;
  }

  if (error) {
    return <RecordTableError onRetry={refreshData} />;
  }

  if (records.length === 0) {
    return <RecordTableEmpty onAdd={onAdd} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-h4 font-semibold">Patient Records</h2>
          {cycleLocked && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Read-only
            </Badge>
          )}
        </div>
        {!cycleLocked && (
          <Button onClick={onAdd} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Record
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.map((record) => {
              const balance = getRecordBalance(record);
              const totalPaid = getRecordTotalPaid(record.id);
              const isSettled = balance <= 0;
              const isGP = record.category === RecordCategory.GP;

              return (
                <TableRow
                  key={record.id}
                  className={record.is_carried_forward ? "bg-muted/30" : ""}
                >
                  <TableCell className="text-body-sm text-muted-foreground">
                    {formatDate(record.entry_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium max-w-[200px] truncate"
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
                  <TableCell>
                    <Badge
                      variant={isGP ? "secondary" : "default"}
                      className="text-caption"
                    >
                      {record.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(record.total_cost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(totalPaid)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={balance > 0 ? "text-muted-foreground" : ""}>
                      {formatCurrency(balance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isGP || isSettled ? (
                      <Badge variant="default" className="bg-success text-text-inverse text-caption">
                        Payment Complete
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-caption">
                        In Progress
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Prev"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                text="Next"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <p className="text-caption text-muted-foreground">
        {records.length} record{records.length !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}
