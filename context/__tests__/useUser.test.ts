// ============================================
// Unit Tests — useUser Hook
// ============================================
// Tests for user CRUD operations: add, update, delete.
// Verifies server action integration and local state management.

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUser } from "../hooks/useUser";
import { User, UserRole } from "@/lib/global";

// Mock server actions
vi.mock("@/app/admin/actions", () => ({
  createUserAction: vi.fn(),
  updateUserAction: vi.fn(),
  deleteUserAction: vi.fn(),
}));

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })),
  })),
}));

import { createUserAction, updateUserAction, deleteUserAction } from "@/app/admin/actions";

const mockCreateUser = vi.mocked(createUserAction);
const mockUpdateUser = vi.mocked(updateUserAction);
const mockDeleteUser = vi.mocked(deleteUserAction);

const INITIAL_USERS: User[] = [
  { id: "user-001", email: "admin@test.com", username: "admin", password_hash: "", role: UserRole.ADMIN },
  { id: "user-002", email: "assistant@test.com", username: "assistant", password_hash: "", role: UserRole.ASSISTANT },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useUser", () => {
  describe("addUser", () => {
    test("adds user to state on success", async () => {
      mockCreateUser.mockResolvedValue({
        error: null,
        user: { id: "user-003", email: "new@test.com", username: "newuser", password_hash: "", role: UserRole.ASSISTANT },
      });

      const { result } = renderHook(() => useUser(INITIAL_USERS));

      let error: string | null = null;
      await act(async () => {
        error = await result.current.addUser({
          email: "new@test.com",
          username: "newuser",
          password: "pass123",
          role: UserRole.ASSISTANT,
        });
      });

      expect(error).toBeNull();
      expect(result.current.users).toHaveLength(3);
      expect(result.current.users[2].username).toBe("newuser");
    });

    test("returns error message on failure", async () => {
      mockCreateUser.mockResolvedValue({
        error: "Email is already registered.",
        user: null,
      });

      const { result } = renderHook(() => useUser(INITIAL_USERS));

      let error: string | null = null;
      await act(async () => {
        error = await result.current.addUser({
          email: "existing@test.com",
          username: "existing",
          password: "pass123",
          role: UserRole.ASSISTANT,
        });
      });

      expect(error).toBe("Email is already registered.");
      expect(result.current.users).toHaveLength(2);
    });

    test("does not add user to state on failure", async () => {
      mockCreateUser.mockResolvedValue({
        error: "Failed to create user.",
        user: null,
      });

      const { result } = renderHook(() => useUser(INITIAL_USERS));

      await act(async () => {
        await result.current.addUser({
          email: "fail@test.com",
          username: "fail",
          password: "pass123",
          role: UserRole.ASSISTANT,
        });
      });

      expect(result.current.users).toHaveLength(2);
    });
  });

  describe("updateUser", () => {
    test("updates username in state on success", async () => {
      const { result } = renderHook(() => useUser(INITIAL_USERS));

      let success = false;
      await act(async () => {
        success = await result.current.updateUser("user-002", { username: "new_name" });
      });

      expect(success).toBe(true);
      expect(result.current.users.find((u) => u.id === "user-002")?.username).toBe("new_name");
    });

    test("returns false for duplicate username", async () => {
      const { result } = renderHook(() => useUser(INITIAL_USERS));

      let success = true;
      await act(async () => {
        success = await result.current.updateUser("user-002", { username: "admin" });
      });

      expect(success).toBe(false);
      expect(result.current.users[1].username).toBe("assistant");
    });

    test("updates password via server action", async () => {
      mockUpdateUser.mockResolvedValue(true);

      const { result } = renderHook(() => useUser(INITIAL_USERS));

      let success = false;
      await act(async () => {
        success = await result.current.updateUser("user-001", { password: "newpass" });
      });

      expect(success).toBe(true);
      expect(mockUpdateUser).toHaveBeenCalledWith("user-001", { password: "newpass" });
    });

    test("returns false when password update fails", async () => {
      mockUpdateUser.mockResolvedValue(false);

      const { result } = renderHook(() => useUser(INITIAL_USERS));

      let success = true;
      await act(async () => {
        success = await result.current.updateUser("user-001", { password: "badpass" });
      });

      expect(success).toBe(false);
    });
  });

  describe("deleteUser", () => {
    test("removes user from state on success", async () => {
      mockDeleteUser.mockResolvedValue(true);

      const { result } = renderHook(() => useUser(INITIAL_USERS));

      let success = false;
      await act(async () => {
        success = await result.current.deleteUser("user-002");
      });

      expect(success).toBe(true);
      expect(result.current.users).toHaveLength(1);
      expect(result.current.users.find((u) => u.id === "user-002")).toBeUndefined();
    });

    test("returns false and keeps user on failure", async () => {
      mockDeleteUser.mockResolvedValue(false);

      const { result } = renderHook(() => useUser(INITIAL_USERS));

      let success = true;
      await act(async () => {
        success = await result.current.deleteUser("user-002");
      });

      expect(success).toBe(false);
      expect(result.current.users).toHaveLength(2);
    });
  });
});
