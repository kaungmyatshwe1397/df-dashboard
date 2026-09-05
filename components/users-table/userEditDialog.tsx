// userEditDialog — edit username and/or password for a user account.
// Admin-only. If password is left blank, it is not changed.

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
import { User } from "@/lib/global";
import { PasswordField } from "@/components/shared/passwordField";

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

function UserEditForm({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const { updateUser, users } = useData();
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim() || username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    } else {
      const duplicate = users.find(
        (u) =>
          u.id !== user.id &&
          u.username.toLowerCase() === username.trim().toLowerCase()
      );
      if (duplicate) {
        newErrors.username = "Username is already taken.";
      }
    }

    if (password && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const updates: { username?: string; password?: string } = {};
    if (username.trim() !== user.username) {
      updates.username = username.trim();
    }
    if (password) {
      updates.password = password;
    }

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      onClose();
      return;
    }

    const success = await updateUser(user.id, updates);
    setSaving(false);

    if (success) {
      onClose();
    } else {
      setSubmitError("Failed to update user. Please try again.");
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
          <Label htmlFor="edit-username">
            Username <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-username"
            placeholder="Enter username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({ ...prev, username: undefined }));
            }}
            aria-invalid={!!errors.username}
            disabled={saving}
          />
          {errors.username && (
            <p className="text-caption text-destructive">{errors.username}</p>
          )}
        </div>

        <PasswordField
          label="New Password"
          htmlFor="edit-password"
          value={password}
          onChange={(val) => {
            setPassword(val);
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="Leave blank to keep current"
          disabled={saving}
          error={errors.password}
        />
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
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export function UserEditDialog({
  open,
  onOpenChange,
  user,
}: UserEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update account details for {user?.username}.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <UserEditForm
            key={user.id}
            user={user}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
