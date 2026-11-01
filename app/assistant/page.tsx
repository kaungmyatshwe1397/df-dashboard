"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { RecordTable } from "@/components/records/record-table";
import { PatientRecordUpdateForm } from "@/components/records/patient-record-update-form";
import { RecordCategory, PatientRecord } from "@/lib/global";

export default function AssistantPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<RecordCategory>(RecordCategory.GP);
  const [editRecord, setEditRecord] = useState<PatientRecord | null>(null);

  function handleAdd(category: RecordCategory) {
    router.push(category === RecordCategory.CASE ? "/assistant/records/new-case" : "/assistant/records/new");
  }

  function handleEdit(record: PatientRecord | null, category: RecordCategory) {
    setEditRecord(record);
    setDefaultCategory(category);
    setModalOpen(true);
  }

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) {
      setEditRecord(null);
    }
  }

  return (
      <PortalLayout>
      <div>
        <h1 className="text-h1 font-bold text-foreground m-0 mb-1">Records</h1>
        <p className="text-body-sm text-muted-foreground m-0 mb-7">
          View and manage patient records for the current cycle.
        </p>
        <RecordTable onAdd={handleAdd} onEdit={handleEdit} />
      </div>

      <PatientRecordUpdateForm
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        defaultCategory={defaultCategory}
        editRecord={editRecord}
      />
    </PortalLayout>
  );
}
