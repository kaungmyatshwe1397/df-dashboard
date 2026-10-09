// Account settings dialog for profile and password changes.

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import type { UserProfileType } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { updateOwnUsernameAction } from "@/app/settings/actions";

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSettingsModal({
  open,
  onOpenChange,
}: AccountSettingsModalProps) {
  const { profile, loading: profileLoading } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Account settings</DialogTitle>
          <DialogDescription>
            Manage your profile and sign-in password.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="flex flex-col gap-4 py-1 pr-3">
            {profile ? (
              <ProfileSection profile={profile} />
            ) : (
              <p className="py-3 text-sm text-muted-foreground" role="status">
                {profileLoading ? "Loading profile…" : "Profile is unavailable."}
              </p>
            )}
            <PasswordSection />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ProfileSection({ profile }: { profile: UserProfileType }) {
  const { refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile.username);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setSaving(true);
    try {
      const result = await updateOwnUsernameAction(username.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setUsername(username.trim());
      await refreshProfile();
      setSaved(true);
    } catch {
      setError("Could not update your username. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card size="sm" className="bg-muted/20">
      <CardHeader className="border-b">
        <CardTitle className="text-h4">Profile</CardTitle>
        <CardDescription>
          Your username is shown across the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-username">Username</Label>
          <Input
            id="account-username"
            type="text"
            autoComplete="nickname"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setSaved(false);
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || username.trim() === profile.username}
          >
            {saving ? <Spinner className="size-3" /> : "Save changes"}
          </Button>
          {saved && (
            <span className="text-sm text-chart-2" role="status">
              Username updated
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
    setSaved(false);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must differ from current password");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: currentPassword,
      });
      if (verifyError) {
        setError("Current password is incorrect");
        return;
      }

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
    } catch {
      setError("Could not update your password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card size="sm" className="bg-muted/20">
      <CardHeader className="border-b">
        <CardTitle className="text-h4">Password</CardTitle>
        <CardDescription>
          Verify your current password before choosing a new one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-current-password">Current password</Label>
          <Input
            id="account-current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-new-password">New password</Label>
          <Input
            id="account-new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-confirm-password">Confirm new password</Label>
          <Input
            id="account-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleUpdate}
            disabled={
              saving ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
          >
            {saving ? <Spinner className="size-3" /> : "Update password"}
          </Button>
          {saved && (
            <span className="text-sm text-chart-2" role="status">
              Password updated
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
