// CaseTypeTable — displays all case types with add, edit, and delete actions.
// Admin-only. Follows the same pattern as LabTable.

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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Pencil, Plus, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { useData } from "@/context/DataContext";
import { CaseType } from "@/lib/global";
import { CaseTypeFormDialog } from "./caseTypeFormDialog";
import { DeleteConfirmDialog } from "./deleteConfirmDialog";

export function CaseTypeTable() {
  const { caseTypes, loading, error, refreshData, deleteCaseType } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CaseType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CaseType | null>(null);

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case Type Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-16" />
                </TableCell>
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

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-semibold">Case Types</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Case Type
        </Button>
      </div>

      {caseTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12">
          <AlertTriangle className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No case types configured</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case Type Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caseTypes.map((ct) => (
                <TableRow key={ct.id}>
                  <TableCell className="font-medium max-w-[300px] truncate" title={ct.name}>
                    {ct.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditTarget(ct);
                          setFormOpen(true);
                        }}
                        title="Edit case type"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(ct)}
                        title="Delete case type"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CaseTypeFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditTarget(null);
        }}
        caseType={editTarget}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        itemName={deleteTarget?.name ?? ""}
        itemType="case type"
        onConfirm={() => deleteCaseType(deleteTarget!.id)}
      />
    </>
  );
}
