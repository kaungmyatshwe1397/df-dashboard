// AccountSettingsModal — profile, password, and danger zone sections.
// Opened from the TopNav avatar dropdown. Uses Dialog for the main modal
// and AlertDialog for the delete-account confirmation.

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";

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
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your profile, password, and account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          <ProfileSection />
          <PasswordSection />
          <DangerZone onAccountDeleted={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------
// Profile Section
// ------------------------------------------

function ProfileSection() {
  const { profile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // TODO: Wire to Supabase profiles update (requires RLS policy for self-update).
  // Use supabase.from("profiles").update({ username, email }).eq("id", user.id)
  async function handleSave() {
    setSaving(true);
    // TODO: implement profile update
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Profile</h3>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-input/30 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
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
// Password Section
// ------------------------------------------

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Wire to Supabase auth.updateUser({ password }).
  // Verify current password first via signInWithPassword.
  async function handleUpdate() {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    // TODO: implement password update
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setSaved(false), 2000);
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

// ------------------------------------------
// Danger Zone — Delete Account
// ------------------------------------------

function DangerZone({ onAccountDeleted }: { onAccountDeleted: () => void }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { profile } = useAuth();
  const router = useRouter();

  const isConfirmValid = confirmText === profile?.email || confirmText === "DELETE";

  // TODO: Wire to Supabase admin.deleteUser or auth admin API.
  // This requires service-role key or a server action.
  async function handleDelete() {
    if (!isConfirmValid) return;
    setDeleting(true);
    // TODO: implement account deletion
    await new Promise((r) => setTimeout(r, 1000));
    setDeleting(false);
    setDeleteDialogOpen(false);
    setConfirmText("");
    // TODO: after deletion, sign out and redirect
    await signOut();
    router.push("/login");
    onAccountDeleted();
  }

  return (
    <>
      <div
        className="rounded-xl p-4"
        style={{
          border: "1px solid rgba(251,113,133,0.2)",
          background: "rgba(46,20,24,0.5)",
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-danger-bg flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-danger" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-danger">Danger Zone</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete Account
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data.
              Type your email or &quot;DELETE&quot; to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="px-4">
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="h-9 w-full rounded-lg border border-danger/30 bg-input/30 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 transition-colors"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!isConfirmValid || deleting}
              onClick={handleDelete}
            >
              {deleting ? <Spinner className="size-3" /> : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
