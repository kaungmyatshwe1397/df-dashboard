// UserEditDialog — admin changes a user's role or deletes the account.

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { deleteUserAction, updateUserRoleAction } from "@/app/admin/actions";
import { UserRole } from "@/lib/global";

interface EditableUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface UserEditDialogProps {
  user: EditableUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export function UserEditDialog({
  user,
  open,
  onOpenChange,
  onChanged,
}: UserEditDialogProps) {
  const [role, setRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Resync the select whenever a different user is opened.
  const [prevUserId, setPrevUserId] = useState<string | null>(null);
  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setRole(user.role);
    setError(null);
    setConfirmDelete(false);
  }

  const isSelf =
    user && role && user.role === UserRole.ADMIN && role !== UserRole.ADMIN;

  async function handleSaveRole() {
    if (!user) return;

    setSaving(true);
    setError(null);

    const result = await updateUserRoleAction(user.id, role as UserRole);

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
    onChanged();
  }

  async function handleDelete() {
    if (!user) return;

    setSaving(true);
    setError(null);

    const result = await deleteUserAction(user.id);

    setSaving(false);

    if (result.error) {
      setError(result.error);
      setConfirmDelete(false);
      return;
    }

    onOpenChange(false);
    onChanged();
  }

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            {user ? `${user.username} (${user.email})` : ""}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v ?? user?.role ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
              <SelectItem value={UserRole.ASSISTANT}>Assistant</SelectItem>
              <SelectItem value={UserRole.SUPERVISOR}>Supervisor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isSelf && (
          <p className="text-sm text-muted-foreground">
            Demoting your own admin account will fail server-side.
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div>
            {!confirmDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <Button type="button" onClick={handleSaveRole} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
