// caseTypeFormDialog — add/edit dialog for case type entries.
// Admin-only. Validates non-empty name and checks for duplicates.

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { CaseType } from "@/lib/global";

interface CaseTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseType: CaseType | null;
}

function CaseTypeForm({
  caseType,
  onClose,
}: {
  caseType: CaseType | null;
  onClose: () => void;
}) {
  const { addCaseType, updateCaseType, caseTypes } = useData();
  const [name, setName] = useState(caseType?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!caseType;

  function validate(): boolean {
    if (!name.trim()) {
      setError("Case type name is required.");
      return false;
    }

    const duplicate = caseTypes.find(
      (ct) =>
        ct.id !== caseType?.id &&
        ct.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      setError("A case type with this name already exists.");
      return false;
    }

    setError(null);
    return true;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    const success = isEdit
      ? await updateCaseType(caseType!.id, name.trim())
      : await addCaseType(name.trim());

    setSaving(false);

    if (success) {
      onClose();
    } else {
      setSubmitError("Failed to save case type. Please try again.");
    }
  }

  return (
    <>
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="case-type-name">
            Case Type Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="case-type-name"
            placeholder="Enter case type name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            disabled={saving}
          />
          {error && (
            <p className="text-caption text-destructive">{error}</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Add Case Type"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export function CaseTypeFormDialog({
  open,
  onOpenChange,
  caseType,
}: CaseTypeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {caseType ? "Edit Case Type" : "Add Case Type"}
          </DialogTitle>
          <DialogDescription>
            {caseType
              ? "Update the case type name."
              : "Add a new case type to the system."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <CaseTypeForm
            key={caseType?.id ?? "new"}
            caseType={caseType}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
