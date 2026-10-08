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
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/context/AuthContext";

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
  const { user: signedInUser } = useAuth();
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

  const isSelf = Boolean(user && signedInUser && user.id === signedInUser.id);
  const isDemotingSelf = isSelf && role !== UserRole.ADMIN;

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage user</DialogTitle>
          <DialogDescription>
            Update this account’s role or remove the account.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{user?.username}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
            {user && <Badge variant="outline">Current: {user.role}</Badge>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-role">Account role</Label>
            <Select value={role} onValueChange={(v) => setRole(v ?? user?.role ?? "")}>
              <SelectTrigger id="user-role" className="w-full bg-background">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                <SelectItem value={UserRole.ASSISTANT}>Assistant</SelectItem>
                <SelectItem value={UserRole.SUPERVISOR}>Supervisor</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the access role assigned to this account.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isDemotingSelf && (
          <p className="text-sm text-destructive" role="status">
            You can’t remove admin access from your own account.
          </p>
        )}

        <DialogFooter className="mt-2 flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {!confirmDelete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={saving || Boolean(isSelf)}
                title={isSelf ? "You cannot delete your own account" : undefined}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete Account
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm text-destructive">Delete this account permanently?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Delete
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveRole}
              disabled={saving || confirmDelete || role === user?.role || Boolean(isDemotingSelf)}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
