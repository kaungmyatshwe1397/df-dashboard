"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";
import { UserTable } from "@/components/users-table";

export default function AdminUsersPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts. Edit usernames, change passwords, or remove assistant access.
          </p>
        </div>
        <UserTable />
      </div>
    </PortalLayout>
  );
}
