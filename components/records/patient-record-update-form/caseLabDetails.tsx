// Optional lab work stays out of the initial entry path while preserving editable dates and assignment.
"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/formField";
import { LabSelector } from "./LabSelector";
import type { FormState } from "./Types";

interface CaseLabDetailsPropsType {
  form: FormState;
  saving: boolean;
  updateField: (field: string, value: string) => void;
}

export function CaseLabDetails({ form, saving, updateField }: CaseLabDetailsPropsType) {
  return <Card size="sm"><Collapsible defaultOpen={!!(form.labName || form.labSendDate || form.deliveryDate)} disabled={saving}>
    <CardHeader>
      <CardTitle>Lab details</CardTitle>
      <p className="text-body-sm text-muted-foreground">Optional. You can add these later.</p>
      <CollapsibleTrigger render={<Button type="button" variant="outline" size="sm" />} className="justify-between">
        Lab details (optional)<ChevronDown className="size-4" />
      </CollapsibleTrigger>
    </CardHeader>
    <CollapsibleContent><CardContent className="grid gap-4 pt-4">
      <FormField label="Lab Name" htmlFor="labName" hint="(optional)">
        <LabSelector value={form.labName} onChange={(value) => updateField("labName", value)} disabled={saving} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Lab Send Date" htmlFor="labSendDate" hint="(optional)">
          <Input id="labSendDate" type="date" value={form.labSendDate} disabled={saving} onChange={(event) => updateField("labSendDate", event.target.value)} />
        </FormField>
        <FormField label="Delivery Date" htmlFor="deliveryDate" hint="(optional)">
          <Input id="deliveryDate" type="date" value={form.deliveryDate} disabled={saving} onChange={(event) => updateField("deliveryDate", event.target.value)} />
        </FormField>
      </div>
    </CardContent></CollapsibleContent>
  </Collapsible></Card>;
}
