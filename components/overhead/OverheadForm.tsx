// Overhead expense input form — admin enters monthly operating costs.
// Saving patches the active cycle's financials in DataContext, updating dashboard totals instantly.

"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/context/DataContext";
import { FormField } from "@/components/records/FormField";

interface OverheadFields {
  general_expenses: string;
  assistant_fee: string;
  bonus: string;
  building_rent: string;
  utility_costs: string;
}

interface OverheadErrors {
  general_expenses?: string;
  assistant_fee?: string;
  bonus?: string;
  building_rent?: string;
  utility_costs?: string;
}

const FIELD_META: { key: keyof OverheadFields; label: string }[] = [
  { key: "general_expenses", label: "General Expense" },
  { key: "assistant_fee", label: "Assistant Salary" },
  { key: "bonus", label: "Bonus" },
  { key: "building_rent", label: "Building Rent" },
  { key: "utility_costs", label: "Utility Costs" },
];

function financialsToFields(f: { general_expenses: number; assistant_fee: number; bonus: number; building_rent: number; utility_costs: number }): OverheadFields {
  return {
    general_expenses: f.general_expenses > 0 ? String(f.general_expenses) : "",
    assistant_fee: f.assistant_fee > 0 ? String(f.assistant_fee) : "",
    bonus: f.bonus > 0 ? String(f.bonus) : "",
    building_rent: f.building_rent > 0 ? String(f.building_rent) : "",
    utility_costs: f.utility_costs > 0 ? String(f.utility_costs) : "",
  };
}

export function OverheadForm() {
  const { financials, updateFinancials, cycleLocked } = useData();

  const [fields, setFields] = useState<OverheadFields>(() =>
    financials ? financialsToFields(financials) : {
      general_expenses: "",
      assistant_fee: "",
      bonus: "",
      building_rent: "",
      utility_costs: "",
    }
  );
  const [errors, setErrors] = useState<OverheadErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleChange(key: keyof OverheadFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
    setSaved(false);
  }

  function validate(): boolean {
    const newErrors: OverheadErrors = {};
    let valid = true;

    for (const { key } of FIELD_META) {
      const raw = fields[key].trim();
      if (raw === "") continue;
      const num = Number(raw);
      if (isNaN(num)) {
        newErrors[key] = "Must be a valid number";
        valid = false;
      } else if (num < 0) {
        newErrors[key] = "Value cannot be negative";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);
    setSaved(false);

    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      const updates: Record<string, number> = {};
      for (const { key } of FIELD_META) {
        const raw = fields[key].trim();
        updates[key] = raw === "" ? 0 : Number(raw);
      }

      updateFinancials(updates);
      setSaved(true);
    } catch {
      setSubmitError("Failed to save overhead data. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-body-sm font-medium text-muted-foreground">
          Monthly Operating Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELD_META.map(({ key, label }) => (
            <FormField
              key={key}
              label={label}
              htmlFor={key}
              error={errors[key]}
            >
              <Input
                id={key}
                type="number"
                placeholder="0"
                min={0}
                value={fields[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={saving || cycleLocked}
              />
            </FormField>
          ))}
        </div>

        <Separator className="my-4" />

        {submitError && (
          <Alert variant="destructive" className="mb-4">
            {submitError}
          </Alert>
        )}

        {saved && (
          <Alert className="mb-4 border-success bg-success-surface text-success">
            Overhead expenses saved successfully.
          </Alert>
        )}

        {cycleLocked && (
          <Alert className="mb-4">
            This cycle is locked. Expenses cannot be edited.
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || cycleLocked}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Expenses
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
