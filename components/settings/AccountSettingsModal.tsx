// AccountSettingsModal — profile and password sections.
// Opened from the TopNav avatar dropdown. Uses Dialog for the main modal.

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSettingsModal({
  open,
  onOpenChange,
}: AccountSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto themed-scrollbar">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your profile and password.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          <ProfileSection />
          <PasswordSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------
// Profile Section — username only
// ------------------------------------------

function ProfileSection() {
  const { profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("id", user.id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Profile</h3>
      <div className="flex flex-col gap-3">
        {error && (
          <div className="rounded-lg px-3 py-2 text-xs bg-danger-bg text-danger border border-danger/20">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || username.trim() === (profile?.username ?? "")}
          >
            {saving ? <Spinner className="size-3" /> : "Save changes"}
          </Button>
          {saved && (
            <span className="text-xs text-success">Saved</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------
// Password Section — verify current, then update
// ------------------------------------------

function PasswordSection() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();

      // Verify current password by attempting sign-in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: currentPassword,
      });
      if (verifyError) {
        setError("Current password is incorrect");
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Password</h3>
      <div className="flex flex-col gap-3">
        {error && (
          <div className="rounded-lg px-3 py-2 text-xs bg-danger-bg text-danger border border-danger/20">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleUpdate}
            disabled={saving || !currentPassword || !newPassword}
          >
            {saving ? <Spinner className="size-3" /> : "Update password"}
          </Button>
          {saved && (
            <span className="text-xs text-success">Updated</span>
          )}
        </div>
      </div>
    </div>
  );
}
