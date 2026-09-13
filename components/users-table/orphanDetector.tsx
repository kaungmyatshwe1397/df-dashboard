// OrphanDetector — checks for auth users with no matching profile.
// Admin-only diagnostic tool. Shows orphans and allows one-click cleanup.

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Trash2, RefreshCw } from "lucide-react";
import {
  checkOrphanedUsers,
  deleteOrphanedAuthUser,
  type OrphanedUser,
} from "@/app/admin/actions";

export function OrphanDetector() {
  const [orphans, setOrphans] = useState<OrphanedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    const result = await checkOrphanedUsers();
    setLoading(false);
    setChecked(true);

    if (result.error) {
      setError(result.error);
    } else {
      setOrphans(result.orphans);
    }
  }

  async function handleDelete(userId: string) {
    setDeleting(userId);
    const success = await deleteOrphanedAuthUser(userId);
    setDeleting(null);

    if (success) {
      setOrphans((prev) => prev.filter((o) => o.id !== userId));
    }
  }

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Orphaned Auth Users</h3>
          <p className="text-xs text-muted-foreground">
            Auth users with no matching profile entry.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCheck}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="mr-2 h-4 w-4" />
          )}
          {checked ? "Re-check" : "Check"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {checked && !error && orphans.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No orphaned users found.
        </p>
      )}

      {orphans.length > 0 && (
        <div className="mt-3 space-y-2">
          <Badge variant="destructive">
            {orphans.length} orphan{orphans.length !== 1 ? "s" : ""} found
          </Badge>
          <div className="space-y-1">
            {orphans.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="truncate text-muted-foreground">{o.email}</span>
                  <span className="ml-2 text-xs text-muted-foreground/60">{o.id}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(o.id)}
                  disabled={deleting === o.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
