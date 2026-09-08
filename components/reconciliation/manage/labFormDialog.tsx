// labFormDialog — add/edit dialog for lab entries.
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
import { Lab } from "@/lib/global";

interface LabFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lab: Lab | null;
}

function LabForm({
  lab,
  onClose,
}: {
  lab: Lab | null;
  onClose: () => void;
}) {
  const { addLab, updateLab, labs } = useData();
  const [name, setName] = useState(lab?.lab_name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!lab;

  function validate(): boolean {
    if (!name.trim()) {
      setError("Lab name is required.");
      return false;
    }

    const duplicate = labs.find(
      (l) =>
        l.id !== lab?.id &&
        l.lab_name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      setError("A lab with this name already exists.");
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
      ? await updateLab(lab!.id, name.trim())
      : await addLab(name.trim());

    setSaving(false);

    if (success) {
      onClose();
    } else {
      setSubmitError("Failed to save lab. Please try again.");
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
          <Label htmlFor="lab-name">
            Lab Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lab-name"
            placeholder="Enter lab name"
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
            "Add Lab"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export function LabFormDialog({
  open,
  onOpenChange,
  lab,
}: LabFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{lab ? "Edit Lab" : "Add Lab"}</DialogTitle>
          <DialogDescription>
            {lab
              ? "Update the lab name."
              : "Add a new lab to the system."}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <LabForm
            key={lab?.id ?? "new"}
            lab={lab}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
