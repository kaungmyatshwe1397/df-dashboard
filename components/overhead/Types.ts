// Types and helpers for OverheadForm.
// Extracted to keep the main form component focused on UI logic.

import { CustomOverhead, MonthlyFinancials } from "@/lib/global";

export interface OverheadFields {
  general_expenses: string;
  assistant_fee: string;
  bonus: string;
  building_rent: string;
  utility_costs: string;
}

export interface OverheadErrors {
  general_expenses?: string;
  assistant_fee?: string;
  bonus?: string;
  building_rent?: string;
  utility_costs?: string;
}

export const FIELD_META: { key: keyof OverheadFields; label: string }[] = [
  { key: "general_expenses", label: "General Expense" },
  { key: "assistant_fee", label: "Assistant Salary" },
  { key: "bonus", label: "Bonus" },
  { key: "building_rent", label: "Building Rent" },
  { key: "utility_costs", label: "Utility Costs" },
];

export function financialsToFields(f: {
  general_expenses: number;
  assistant_fee: number;
  bonus: number;
  building_rent: number;
  utility_costs: number;
}): OverheadFields {
  return {
    general_expenses: f.general_expenses > 0 ? String(f.general_expenses) : "",
    assistant_fee: f.assistant_fee > 0 ? String(f.assistant_fee) : "",
    bonus: f.bonus > 0 ? String(f.bonus) : "",
    building_rent: f.building_rent > 0 ? String(f.building_rent) : "",
    utility_costs: f.utility_costs > 0 ? String(f.utility_costs) : "",
  };
}

export function calculateOverheadTotal(
  fields: OverheadFields,
  customItems: CustomOverheadFormItem[],
): number {
  const fixedTotal = Object.values(fields).reduce(
    (total, amount) => total + parseExpenseAmount(amount),
    0,
  );
  const customTotal = customItems.reduce(
    (total, item) =>
      total +
      (item.name.trim() ? parseExpenseAmount(item.amount) : 0),
    0,
  );

  return fixedTotal + customTotal;
}

function parseExpenseAmount(amount: string) {
  const parsedAmount = Number(amount.trim());
  return Number.isFinite(parsedAmount) && parsedAmount >= 0 ? parsedAmount : 0;
}

// Custom overhead form item — name and amount as strings for input fields.
export interface CustomOverheadFormItem {
  name: string;
  amount: string;
}

export interface CustomOverheadFormErrors {
  [index: number]: { name?: string; amount?: string } | undefined;
}

export interface OverheadValidationResultType {
  valid: boolean;
  errors: OverheadErrors;
  customErrors: CustomOverheadFormErrors;
}

export type OverheadFinancialsUpdateType = Pick<
  MonthlyFinancials,
  | "general_expenses"
  | "assistant_fee"
  | "bonus"
  | "building_rent"
  | "utility_costs"
  | "custom_overheads"
>;

export function validateOverheadEntries(
  fields: OverheadFields,
  customItems: CustomOverheadFormItem[],
): OverheadValidationResultType {
  const errors: OverheadErrors = {};
  const customErrors: CustomOverheadFormErrors = {};
  let valid = true;

  for (const { key } of FIELD_META) {
    const amount = fields[key].trim();
    if (amount === "") continue;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) {
      errors[key] = "Must be a valid number";
      valid = false;
    } else if (numericAmount < 0) {
      errors[key] = "Value cannot be negative";
      valid = false;
    }
  }

  customItems.forEach((item, index) => {
    const name = item.name.trim();
    const amount = item.amount.trim();
    const itemErrors: { name?: string; amount?: string } = {};

    if (name && !amount) {
      itemErrors.amount = "Amount is required";
      valid = false;
    } else if (!name && amount) {
      itemErrors.name = "Name is required";
      valid = false;
    } else if (name && amount) {
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount)) {
        itemErrors.amount = "Must be a valid number";
        valid = false;
      } else if (numericAmount < 0) {
        itemErrors.amount = "Value cannot be negative";
        valid = false;
      }
    }

    if (itemErrors.name || itemErrors.amount) {
      customErrors[index] = itemErrors;
    }
  });

  return { valid, errors, customErrors };
}

export function toOverheadFinancialsUpdate(
  fields: OverheadFields,
  customItems: CustomOverheadFormItem[],
): OverheadFinancialsUpdateType {
  const fixedFields = Object.fromEntries(
    FIELD_META.map(({ key }) => {
      const amount = fields[key].trim();
      return [key, amount === "" ? 0 : Number(amount)];
    }),
  ) as Pick<
    OverheadFinancialsUpdateType,
    "general_expenses" | "assistant_fee" | "bonus" | "building_rent" | "utility_costs"
  >;
  const customOverheads: CustomOverhead[] = customItems
    .filter((item) => item.name.trim() !== "" || item.amount.trim() !== "")
    .map((item, index) => ({
      id: `co-${Date.now()}-${index}`,
      name: item.name.trim(),
      amount: item.amount.trim() === "" ? 0 : Number(item.amount.trim()),
    }));

  return { ...fixedFields, custom_overheads: customOverheads };
}

// Convert stored CustomOverhead to form-ready strings.
export function customOverheadsToForm(items: CustomOverhead[]): CustomOverheadFormItem[] {
  return items.map((item) => ({
    name: item.name,
    amount: item.amount > 0 ? String(item.amount) : "",
  }));
}
