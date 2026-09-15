"use client";

import { PortalLayout } from "@/components/layout/PortalLayout";

export default function AdminUsersPage() {
  return (
    <PortalLayout requiredRole="ADMIN">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            User management coming soon.
          </p>
        </div>
      </div>
    </PortalLayout>
  );
}
