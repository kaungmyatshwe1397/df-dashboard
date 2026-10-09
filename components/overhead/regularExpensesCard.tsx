// RegularExpensesCard presents the clinic's standard monthly cost fields.

"use client";

import { Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { FormField } from "@/components/shared/formField";
import { FIELD_META, OverheadErrors, OverheadFields } from "./Types";

interface RegularExpensesCardPropsType {
  fields: OverheadFields;
  errors: OverheadErrors;
  disabled: boolean;
  onChange: (key: keyof OverheadFields, value: string) => void;
}

export function RegularExpensesCard({
  fields,
  errors,
  disabled,
  onChange,
}: RegularExpensesCardPropsType) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calculator className="size-5" />
          </span>
          <div className="space-y-1">
            <CardTitle>Regular expenses</CardTitle>
            <CardDescription>
              Enter the clinic’s standard monthly operating costs.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
        {FIELD_META.map(({ key, label }) => (
          <FormField key={key} label={label} htmlFor={key} error={errors[key]}>
            <InputGroup>
              <InputGroupInput
                id={key}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={fields[key]}
                onChange={(event) => onChange(key, event.target.value)}
                disabled={disabled}
                aria-invalid={!!errors[key]}
              />
              <InputGroupAddon align="inline-end">MMK</InputGroupAddon>
            </InputGroup>
          </FormField>
        ))}
      </CardContent>
    </Card>
  );
}
