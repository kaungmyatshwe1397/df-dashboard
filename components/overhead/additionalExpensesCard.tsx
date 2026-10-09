// AdditionalExpensesCard manages optional named costs outside the standard categories.

"use client";

import { Plus, ReceiptText, Trash2 } from "lucide-react";
import { FormField } from "@/components/shared/formField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  CustomOverheadFormErrors,
  CustomOverheadFormItem,
} from "./Types";

interface AdditionalExpensesCardPropsType {
  items: CustomOverheadFormItem[];
  errors: CustomOverheadFormErrors;
  canEdit: boolean;
  saving: boolean;
  onAdd: () => void;
  onChange: (index: number, field: "name" | "amount", value: string) => void;
  onRemove: (index: number) => void;
}

export function AdditionalExpensesCard({
  items,
  errors,
  canEdit,
  saving,
  onAdd,
  onChange,
  onRemove,
}: AdditionalExpensesCardPropsType) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border">
        <div className="space-y-1">
          <CardTitle>Additional expenses</CardTitle>
          <CardDescription>
            Add costs that do not fit the regular categories.
          </CardDescription>
        </div>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            disabled={saving}
            className="shrink-0"
          >
            <Plus className="mr-1.5 size-4" />
            Add item
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <ReceiptText className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No additional expenses. Add an item for costs like internet or insurance.
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="grid items-end gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2"
            >
              <FormField
                label="Expense name"
                htmlFor={`custom-name-${index}`}
                error={errors[index]?.name}
              >
                <InputGroup>
                  <InputGroupInput
                    id={`custom-name-${index}`}
                    placeholder="e.g. Internet, Insurance"
                    value={item.name}
                    onChange={(event) => onChange(index, "name", event.target.value)}
                    disabled={saving || !canEdit}
                    aria-invalid={!!errors[index]?.name}
                  />
                </InputGroup>
              </FormField>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <FormField
                    label="Amount"
                    htmlFor={`custom-amount-${index}`}
                    error={errors[index]?.amount}
                  >
                    <InputGroup>
                      <InputGroupInput
                        id={`custom-amount-${index}`}
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={item.amount}
                        onChange={(event) => onChange(index, "amount", event.target.value)}
                        disabled={saving || !canEdit}
                        aria-invalid={!!errors[index]?.amount}
                      />
                      <InputGroupAddon align="inline-end">MMK</InputGroupAddon>
                    </InputGroup>
                  </FormField>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(index)}
                    disabled={saving}
                    title="Remove item"
                    aria-label={`Remove ${item.name || "additional expense"}`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
