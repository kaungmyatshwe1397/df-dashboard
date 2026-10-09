// OverheadForm validates expense entries and saves them to the selected month.

"use client";

import { useState } from "react";
import { useCanEdit } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import {
  calculateOverheadTotal,
  CustomOverheadFormErrors,
  CustomOverheadFormItem,
  financialsToFields,
  OverheadErrors,
  OverheadFields,
  customOverheadsToForm,
  toOverheadFinancialsUpdate,
  validateOverheadEntries,
} from "./Types";
import { AdditionalExpensesCard } from "./additionalExpensesCard";
import { MonthlySummaryCard } from "./monthlySummaryCard";
import { RegularExpensesCard } from "./regularExpensesCard";

export function OverheadForm() {
  const { financials, selectedMonth, updateFinancials, refreshData } = useData();
  const canEdit = useCanEdit();
  const [fields, setFields] = useState<OverheadFields>(() =>
    financials
      ? financialsToFields(financials)
      : {
          general_expenses: "",
          assistant_fee: "",
          bonus: "",
          building_rent: "",
          utility_costs: "",
        },
  );
  const [customItems, setCustomItems] = useState<CustomOverheadFormItem[]>(() =>
    financials ? customOverheadsToForm(financials.custom_overheads) : [],
  );
  const [errors, setErrors] = useState<OverheadErrors>({});
  const [customErrors, setCustomErrors] = useState<CustomOverheadFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const monthlyTotal = calculateOverheadTotal(fields, customItems);

  function clearSaveFeedback() {
    setSubmitError(null);
    setSaved(false);
  }

  function handleChange(key: keyof OverheadFields, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    clearSaveFeedback();
  }

  function handleCustomChange(
    index: number,
    field: "name" | "amount",
    value: string,
  ) {
    setCustomItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
    setCustomErrors((previous) => ({ ...previous, [index]: undefined }));
    clearSaveFeedback();
  }

  function handleAddCustom() {
    setCustomItems((previous) => [...previous, { name: "", amount: "" }]);
    clearSaveFeedback();
  }

  function handleRemoveCustom(index: number) {
    setCustomItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    setCustomErrors((previous) => {
      const next = { ...previous };
      delete next[index];
      return next;
    });
    clearSaveFeedback();
  }

  function validate(): boolean {
    const result = validateOverheadEntries(fields, customItems);
    setErrors(result.errors);
    setCustomErrors(result.customErrors);
    return result.valid;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);
    setSaved(false);

    try {
      await updateFinancials(toOverheadFinancialsUpdate(fields, customItems));
      refreshData();
      setSaved(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to save overhead data. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <RegularExpensesCard
          fields={fields}
          errors={errors}
          disabled={saving || !canEdit}
          onChange={handleChange}
        />
        <AdditionalExpensesCard
          items={customItems}
          errors={customErrors}
          canEdit={canEdit}
          saving={saving}
          onAdd={handleAddCustom}
          onChange={handleCustomChange}
          onRemove={handleRemoveCustom}
        />
      </div>
      <MonthlySummaryCard
        month={selectedMonth}
        total={monthlyTotal}
        canEdit={canEdit}
        saving={saving}
        saved={saved}
        error={submitError}
        onSave={handleSave}
      />
    </div>
  );
}
