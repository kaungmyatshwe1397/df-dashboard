// UserTable — displays all user accounts with delete action.
// Admin-only. Delete is blocked for admin role rows and the current user.

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { User, UserRole } from "@/lib/global";
import { UserDeleteDialog } from "./userDeleteDialog";

export function UserTable() {
  const { users } = useData();
  const { user: currentUser } = useAuth();
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isCurrentUser = u.id === currentUser?.id;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="max-w-[200px] truncate" title={u.username}>
                        {u.username}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-caption shrink-0">
                          You
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === UserRole.ADMIN ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {u.role !== UserRole.ADMIN && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteUserTarget(u)}
                          title="Delete user"
                          disabled={isCurrentUser}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <UserDeleteDialog
        open={!!deleteUserTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteUserTarget(null);
        }}
        user={deleteUserTarget}
      />
    </>
  );
}
