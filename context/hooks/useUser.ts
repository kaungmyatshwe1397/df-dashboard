// ============================================
// useUser — User Management Hook
// ============================================
// Handles user CRUD via server actions and local state.
// Extracted from DataContext to follow Single Responsibility Principle.

import { useState, useCallback, useRef } from "react";
import { createUserAction, updateUserAction, deleteUserAction } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import { User, UserRole } from "@/lib/global";

export function useUser(initialUsers: User[] = []) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const supabaseRef = useRef(createClient());

  const addUser = useCallback(
    async (userData: { email: string; username: string; password: string; role: UserRole }): Promise<string | null> => {
      const result = await createUserAction({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        role: userData.role,
      });

      if (result.error) {
        return result.error;
      }

      if (result.user) {
        setUsers((prev) => [...prev, result.user!]);
      }

      return null;
    },
    []
  );

  const updateUser = useCallback(
    async (userId: string, updates: { username?: string; password?: string }): Promise<boolean> => {
      if (updates.username) {
        const duplicate = users.find(
          (u) => u.id !== userId && u.username.toLowerCase() === updates.username!.toLowerCase()
        );
        if (duplicate) return false;

        const { error: profileError } = await supabaseRef.current
          .from("profiles")
          .update({ username: updates.username })
          .eq("id", userId);

        if (profileError) {
          console.error("Failed to update profile:", profileError);
          return false;
        }

        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, username: updates.username! } : u))
        );
      }

      if (updates.password) {
        const success = await updateUserAction(userId, { password: updates.password });
        if (!success) return false;
      }

      return true;
    },
    [users]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<boolean> => {
      const success = await deleteUserAction(userId);
      if (!success) return false;

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      return true;
    },
    []
  );

  return { users, setUsers, addUser, updateUser, deleteUser };
}
