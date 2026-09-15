// Overhead expense input form — admin enters monthly operating costs.
// Base overheads are fixed; custom overheads can be added and deleted per cycle.

"use client";

import { useState } from "react";
import { Loader2, Save, Plus, Trash2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useData } from "@/context/DataContext";
import { FormField } from "@/components/shared/formField";
import {
  OverheadFields,
  OverheadErrors,
  FIELD_META,
  financialsToFields,
  CustomOverheadFormItem,
  CustomOverheadFormErrors,
  customOverheadsToForm,
} from "./Types";

export function OverheadForm() {
  const { financials, updateFinancials, refreshData } = useData();

  const [fields, setFields] = useState<OverheadFields>(() =>
    financials ? financialsToFields(financials) : {
      general_expenses: "",
      assistant_fee: "",
      bonus: "",
      building_rent: "",
      utility_costs: "",
    }
  );
  const [customItems, setCustomItems] = useState<CustomOverheadFormItem[]>(() =>
    financials ? customOverheadsToForm(financials.custom_overheads) : []
  );
  const [errors, setErrors] = useState<OverheadErrors>({});
  const [customErrors, setCustomErrors] = useState<CustomOverheadFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleChange(key: keyof OverheadFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
    setSaved(false);
  }

  function handleCustomChange(index: number, field: "name" | "amount", value: string) {
    setCustomItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setCustomErrors((prev) => ({ ...prev, [index]: undefined }));
    setSubmitError(null);
    setSaved(false);
  }

  function handleAddCustom() {
    setCustomItems((prev) => [...prev, { name: "", amount: "" }]);
  }

  function handleRemoveCustom(index: number) {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
    setCustomErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
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

    const newCustomErrors: CustomOverheadFormErrors = {};
    for (let i = 0; i < customItems.length; i++) {
      const item = customItems[i];
      const itemErrors: { name?: string; amount?: string } = {};

      const name = item.name.trim();
      const amount = item.amount.trim();

      if (name && !amount) {
        itemErrors.amount = "Amount is required";
        valid = false;
      } else if (!name && amount) {
        itemErrors.name = "Name is required";
        valid = false;
      } else if (name && amount) {
        const num = Number(amount);
        if (isNaN(num)) {
          itemErrors.amount = "Must be a valid number";
          valid = false;
        } else if (num < 0) {
          itemErrors.amount = "Value cannot be negative";
          valid = false;
        }
      }

      if (itemErrors.name || itemErrors.amount) {
        newCustomErrors[i] = itemErrors;
      }
    }

    setErrors(newErrors);
    setCustomErrors(newCustomErrors);
    return valid;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);
    setSaved(false);

    try {
      const updates: Record<string, number> = {};
      for (const { key } of FIELD_META) {
        const raw = fields[key].trim();
        updates[key] = raw === "" ? 0 : Number(raw);
      }

      const customOverheads = customItems
        .filter((item) => item.name.trim() !== "" || item.amount.trim() !== "")
        .map((item, i) => ({
          id: `co-${Date.now()}-${i}`,
          name: item.name.trim(),
          amount: item.amount.trim() === "" ? 0 : Number(item.amount.trim()),
        }));

      await updateFinancials({ ...updates, custom_overheads: customOverheads });
      refreshData();
      setSaved(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save overhead data. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-[18px]">
      <div className="text-xs text-muted-foreground mb-4">Monthly Operating Expenses</div>

      {/* Base overhead fields */}
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
              step="1"
              value={fields[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              disabled={saving}
              className="bg-input border-border focus:ring-2 focus:ring-accent transition-shadow"
            />
          </FormField>
        ))}
      </div>

      <Separator className="my-6 border-border" />

      {/* Custom overhead items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal text-muted-foreground">
            Custom Overhead Items
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCustom}
            disabled={saving}
            className="border-border text-foreground hover:bg-accent/10 hover:text-accent"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {customItems.length === 0 && (
          <p className="text-[12px] text-muted-foreground">
            No custom overhead items added yet.
          </p>
        )}

        {customItems.map((item, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_120px_40px] items-end">
            <FormField
              label="Name"
              htmlFor={`custom-name-${index}`}
              error={customErrors[index]?.name}
            >
              <Input
                id={`custom-name-${index}`}
                placeholder="e.g. Internet, Insurance"
                value={item.name}
                onChange={(e) => handleCustomChange(index, "name", e.target.value)}
                disabled={saving}
                className="bg-input border-border focus:ring-2 focus:ring-accent transition-shadow"
              />
            </FormField>
            <FormField
              label="Amount"
              htmlFor={`custom-amount-${index}`}
              error={customErrors[index]?.amount}
            >
              <Input
                id={`custom-amount-${index}`}
                type="number"
                placeholder="0"
                min={0}
                step="1"
                value={item.amount}
                onChange={(e) => handleCustomChange(index, "amount", e.target.value)}
                disabled={saving}
                className="bg-input border-border focus:ring-2 focus:ring-accent transition-shadow"
              />
            </FormField>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleRemoveCustom(index)}
              disabled={saving}
              title="Remove item"
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-6 border-border" />

      {submitError && (
        <Alert variant="destructive" className="mb-4 border-danger/30 bg-danger-bg text-danger">
          {submitError}
        </Alert>
      )}

      {saved && (
        <Alert className="mb-4 border-accent/30 bg-accent-dark text-accent">
          <Check className="h-4 w-4" />
          Overhead expenses saved successfully.
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Expenses
        </Button>
      </div>
    </div>
  );
}
