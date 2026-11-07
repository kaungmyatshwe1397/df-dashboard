// Direct Case entry saves the visit and its initial receipt without requiring registry identity.
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCanEdit } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Gender, RecordCategory } from "@/lib/global";
import { RecordSaveError } from "@/lib/services/atomicRecordSaveService";
import { getEmptyForm, type FormErrors } from "../patient-record-update-form/Types";
import { validateRecordForm } from "../patient-record-update-form/formValidation";
import { CaseRecordFields } from "../patient-record-update-form/caseRecordFields";

export function NewCaseRecord({ listPath }: { listPath: string }) {
  const router = useRouter();
  const returnPath = `${listPath}?tab=case`;
  const canEdit = useCanEdit();
  const { addRecord } = useData();
  const [form, setForm] = useState(() => ({ ...getEmptyForm(), paid: "0" }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [entryVersion, setEntryVersion] = useState(0);
  const submission = useRef<string | undefined>(undefined);
  const saveInProgress = useRef(false);
  const addAnotherAfterSave = useRef(false);
  const locked = saving || retrying;

  function updateField(field: string, value: string) {
    if (locked) return;
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  async function save(addAnother: boolean) {
    if (!canEdit || saveInProgress.current) return;
    const nextErrors = validateRecordForm(form, true, true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    saveInProgress.current = true;
    setSaving(true); setError(null);
    if (!submission.current) {
      submission.current = crypto.randomUUID();
      addAnotherAfterSave.current = addAnother;
    }
    try {
      await addRecord({ entry_date: form.recordDate, category: RecordCategory.CASE,
        diagnosis: form.caseType + (form.teeth ? ` at ${form.teeth}` : ""), total_cost: Number(form.totalCost),
        case_type: form.caseType, teeth: form.teeth || undefined, lab_name: form.labName.trim() || undefined,
        lab_send_date: form.labSendDate || undefined, delivery_date: form.deliveryDate || undefined },
      { record_patient: { patient_name: form.patientName.trim(), age: Number(form.age),
        gender: form.gender as Gender, address: form.address.trim() || undefined,
        telephone: form.telephone.trim() || undefined } }, Number(form.paid), submission.current);
      if (addAnotherAfterSave.current) {
        setForm({ ...getEmptyForm(), paid: "0", recordDate: form.recordDate });
        setEntryVersion((previous) => previous + 1);
        setErrors({}); submission.current = undefined; setRetrying(false);
      } else router.push(returnPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the record. Retry with the same values.");
      const rejected = err instanceof RecordSaveError && (err.code === "PGRST202" || /^(22|23)/.test(err.code ?? ""));
      if (rejected) submission.current = undefined;
      setRetrying(!rejected);
    } finally { saveInProgress.current = false; setSaving(false); }
  }

  return <div className="grid gap-6">
    <div>
      <Button variant="ghost" size="sm" onClick={() => router.push(returnPath)} disabled={saving}><ArrowLeft className="size-4" />Back to records</Button>
      <h1 className="mt-4 text-h1 font-bold">Add Case Record</h1>
      <p className="text-body-sm text-muted-foreground">Enter patient, case, and payment details. Lab details can be added later.</p>
    </div>
    {!canEdit ? <Alert variant="destructive"><AlertDescription>You do not have permission to add records.</AlertDescription></Alert> : <>
      <CaseRecordFields key={entryVersion} form={form} errors={errors} saving={locked} updateField={updateField} />
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {retrying && <p className="text-body-sm text-muted-foreground">Your details are preserved. Retry this save before making changes.</p>}
      <div className="flex flex-wrap justify-end gap-2">
        {retrying ? <Button size="sm" onClick={() => save(addAnotherAfterSave.current)} disabled={saving}>{saving ? "Saving..." : "Retry save"}</Button> : <>
          <Button variant="outline" size="sm" onClick={() => save(true)} disabled={saving}><Plus className="size-4" />Save & add another</Button>
          <Button size="sm" onClick={() => save(false)} disabled={saving}>{saving ? "Saving..." : "Save & back"}</Button>
        </>}
      </div>
    </>}
  </div>;
}
