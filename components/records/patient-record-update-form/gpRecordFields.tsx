// Matching add/edit sections keep GP records compact without exposing registration controls.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordCategory } from "@/lib/global";
import type { FormState, FormErrors } from "./Types";
import { RecordPatientFields } from "./recordPatientFields";
import { RecordDateField } from "./recordDateField";
import { RecordFormFields } from "./RecordFormFields";

interface GpRecordFieldsPropsType {
  form: FormState;
  errors: FormErrors;
  saving: boolean;
  demographicsDisabled?: boolean;
  updateField: (field: string, value: string) => void;
}

export function GpRecordFields(props: GpRecordFieldsPropsType) {
  return <div className="grid min-w-0 gap-4 md:grid-cols-2">
    <Card size="sm"><CardHeader><CardTitle>Patient information</CardTitle></CardHeader><CardContent className="grid gap-4">
      <RecordPatientFields {...props} />
    </CardContent></Card>
    <Card size="sm"><CardHeader><CardTitle>Visit details</CardTitle></CardHeader><CardContent className="grid gap-4">
      <RecordDateField value={props.form.recordDate} error={props.errors.recordDate} saving={props.saving}
        onChange={(value) => props.updateField("recordDate", value)} />
      <RecordFormFields {...props} form={{ ...props.form, category: RecordCategory.GP }} />
    </CardContent></Card>
  </div>;
}
