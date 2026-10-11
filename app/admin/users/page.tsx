// Admin user management page — table of all users with role, plus
// create / edit (role change, delete) actions. Admin-only route.

"use client";

import { useCallback, useEffect, useState } from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { UserEditDialog } from "@/components/users/UserEditDialog";
import { UserList } from "@/components/users/userList";
import type { UserRowType } from "@/components/users/userList/types";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRowType | null>(null);

  const fetchUsers = useCallback(async () => {
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("id, username, email, role")
      .order("created_at", { ascending: true });

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setError(null);
    setUsers(data ?? []);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <PortalLayout>
      <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              View, create, and manage user accounts and roles.
            </p>
          </div>
          <Button size="sm" className="self-start" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create User
          </Button>
        </div>

        {error && (
          <Alert
            variant="destructive"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchUsers();
              }}
            >
              Retry
            </Button>
          </Alert>
        )}

        <UserList users={users} loading={loading} onEdit={setEditTarget} />
      </div>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchUsers}
      />

      <UserEditDialog
        user={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onChanged={fetchUsers}
      />
    </PortalLayout>
  );
}
