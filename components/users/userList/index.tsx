// User management uses readable cards on narrow screens and the existing table on desktop.

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { TableSkeleton } from "@/components/records/record-table/RecordTableHelpers";
import type { UserListPropsType } from "./types";

export function UserList({ users, loading, onEdit }: UserListPropsType) {
  if (loading) return <TableSkeleton columns={4} />;
  if (!users.length) return <p className="text-sm text-muted-foreground">No users found.</p>;
  return (
    <>
      <div className="space-y-3 lg:hidden">
        {users.map((user) => (
          <Card key={user.id} size="sm">
            <CardHeader><CardTitle className="[overflow-wrap:anywhere]">{user.username}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="[overflow-wrap:anywhere] text-muted-foreground">{user.email}</p>
              <Badge variant="secondary">{user.role}</Badge>
              <Button variant="outline" className="w-full" aria-label={`Edit ${user.username}`} onClick={() => onEdit(user)}>Edit user</Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="hidden rounded-md border lg:block">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>{users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
              <TableCell className="text-right"><Button variant="ghost" size="icon-xs" onClick={() => onEdit(user)} title="Edit user" aria-label={`Edit ${user.username}`}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </>
  );
}
