"use client";

import { useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { RecordTable } from "@/components/records/RecordTable";
import { PatientRecordUpdateForm } from "@/components/records/PatientRecordUpdateForm";
import { RecordCategory, PatientRecord } from "@/lib/global";

export default function AssistantPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<RecordCategory>(RecordCategory.GP);
  const [editRecord, setEditRecord] = useState<PatientRecord | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  function handleAdd(category: RecordCategory) {
    setEditRecord(null);
    setIsAdding(true);
    setDefaultCategory(category);
    setModalOpen(true);
  }

  function handleEdit(record: PatientRecord | null, category: RecordCategory) {
    setEditRecord(record);
    setIsAdding(false);
    setDefaultCategory(category);
    setModalOpen(true);
  }

  return (
    <PortalLayout requiredRole="ASSISTANT">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-h2 font-bold">Record Table</h1>
          <p className="text-body-sm text-muted-foreground">
            View and manage patient records for the current cycle.
          </p>
        </div>
        <RecordTable onAdd={handleAdd} onEdit={handleEdit} />
      </div>

      <PatientRecordUpdateForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultCategory={defaultCategory}
        editRecord={editRecord}
        isAdding={isAdding}
      />
    </PortalLayout>
  );
}
