// passwordChangeDialog — change the current user's own password.
// Uses Supabase Auth reauthentication + updateUser.

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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PasswordField } from "@/components/shared/passwordField";

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordChangeDialog({
  open,
  onOpenChange,
}: PasswordChangeDialogProps) {
  const { user: currentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setSubmitError(null);
    setSuccess(false);
  }

  function validate(): boolean {
    const newErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required.";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required.";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters.";
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = "New password must differ from current password.";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate() || !currentUser) return;

    setSaving(true);
    setSubmitError(null);

    const supabase = createClient();

    // Reauthenticate with current password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });

    if (authError) {
      setSaving(false);
      setSubmitError("Current password is incorrect.");
      return;
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSaving(false);

    if (updateError) {
      setSubmitError("Failed to update password. Please try again.");
    } else {
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1500);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Update your account password. You&apos;ll need to enter your current password.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="border-success bg-success-surface text-success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>Password updated successfully!</AlertDescription>
          </Alert>
        ) : (
          <>
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-2">
              <PasswordField
                label="Current Password"
                htmlFor="currentPassword"
                value={currentPassword}
                onChange={(val) => {
                  setCurrentPassword(val);
                  setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                }}
                placeholder="Enter current password"
                required
                disabled={saving}
                error={errors.currentPassword}
              />

              <PasswordField
                label="New Password"
                htmlFor="newPassword"
                value={newPassword}
                onChange={(val) => {
                  setNewPassword(val);
                  setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                placeholder="Min. 6 characters"
                required
                disabled={saving}
                error={errors.newPassword}
              />

              <PasswordField
                label="Confirm New Password"
                htmlFor="confirmPassword"
                value={confirmPassword}
                onChange={(val) => {
                  setConfirmPassword(val);
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                placeholder="Re-enter new password"
                required
                disabled={saving}
                error={errors.confirmPassword}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
