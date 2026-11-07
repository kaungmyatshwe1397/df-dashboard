// Case entry keeps patient, treatment, payment, and optional lab work on one responsive page.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/formField";
import { RecordPatientFields } from "./recordPatientFields";
import { RecordDateField } from "./recordDateField";
import { CaseTypeSelector } from "./CaseTypeSelector";
import { ToothNumberGrid } from "./ToothNumberGrid";
import { CaseLabDetails } from "./caseLabDetails";
import type { FormState, FormErrors } from "./Types";

interface CaseRecordFieldsPropsType {
  form: FormState;
  errors: FormErrors;
  saving: boolean;
  updateField: (field: string, value: string) => void;
  isEditing?: boolean;
}

export function CaseRecordFields({ form, errors, saving, updateField, isEditing = false }: CaseRecordFieldsPropsType) {
  const remaining = Number(form.totalCost || 0) - Number(form.paid || 0);
  return <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
    <div className="grid min-w-0 content-start gap-4">
      <Card size="sm"><CardHeader><CardTitle>Patient information</CardTitle></CardHeader><CardContent className="grid gap-4">
        <RecordPatientFields form={form} errors={errors} saving={saving} updateField={updateField} />
      </CardContent></Card>
      <Card size="sm"><CardHeader><CardTitle>Payment</CardTitle></CardHeader><CardContent className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Total Cost" htmlFor="totalCost" required error={errors.totalCost}>
            <Input id="totalCost" inputMode="numeric" value={form.totalCost} disabled={saving} aria-invalid={!!errors.totalCost}
              onChange={(event) => updateField("totalCost", event.target.value)} />
          </FormField>
          <FormField label={isEditing ? "Paid to date" : "Amount paid today"} htmlFor="paid" required={!isEditing} error={errors.paid}>
            <Input id="paid" inputMode="numeric" value={form.paid} disabled={saving || isEditing} aria-invalid={!!errors.paid}
              onChange={(event) => updateField("paid", event.target.value)} />
          </FormField>
        </div>
        <FormField label="Remaining balance" htmlFor="remaining">
          <Input id="remaining" value={Number.isFinite(remaining) ? remaining.toLocaleString("en-US") : ""} readOnly className="bg-muted font-medium" />
        </FormField>
        <p className="text-body-sm text-muted-foreground">{isEditing ? "Use Record payment to add installments." : "Enter 0 if no payment was collected today. Amounts are in MMK."}</p>
      </CardContent></Card>
    </div>
    <div className="grid min-w-0 content-start gap-4">
      <Card size="sm"><CardHeader><CardTitle>Case details</CardTitle></CardHeader><CardContent className="grid gap-4">
        <RecordDateField value={form.recordDate} error={errors.recordDate} saving={saving} onChange={(value) => updateField("recordDate", value)} />
        <FormField label="Case Type" htmlFor="caseType" required error={errors.caseType}>
          <CaseTypeSelector value={form.caseType} disabled={saving} onChange={(value) => updateField("caseType", value)} />
        </FormField>
        <FormField label="Tooth Numbers" hint="(optional)" error={errors.teeth}>
          <ToothNumberGrid selected={form.teeth} disabled={saving} onChange={(value) => updateField("teeth", value)} />
        </FormField>
      </CardContent></Card>
      <CaseLabDetails form={form} saving={saving} updateField={updateField} />
    </div>
  </div>;
}
