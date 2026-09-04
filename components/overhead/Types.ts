// Types and helpers for OverheadForm.
// Extracted to keep the main form component focused on UI logic.

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
