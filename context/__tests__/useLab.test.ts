// ============================================
// Unit Tests — useLab Hook
// ============================================
// Tests for lab CRUD operations: add, update, delete.
// Verifies duplicate checking, empty input handling, and state updates.

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLab } from "../hooks/useLab";
import { Lab } from "@/lib/global";

// Configurable mock — tests override behavior per-test
const mockInsertResult = { data: null as Record<string, unknown> | null, error: null as Error | null };
const mockUpdateError = { error: null as Error | null };
const mockDeleteError = { error: null as Error | null };

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => Promise.resolve(mockInsertResult)),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(() => Promise.resolve(mockUpdateError)),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(() => Promise.resolve(mockDeleteError)),
      }),
    })),
  })),
}));

const INITIAL_LABS: Lab[] = [
  { id: "lab-001", lab_name: "Central Lab" },
  { id: "lab-002", lab_name: "City Diagnostics" },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockInsertResult.data = null;
  mockInsertResult.error = null;
  mockUpdateError.error = null;
  mockDeleteError.error = null;
});

describe("useLab", () => {
  describe("addLab", () => {
    test("adds lab to state on success", async () => {
      mockInsertResult.data = { id: "lab-003", lab_name: "New Lab" };

      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = false;
      await act(async () => {
        success = await result.current.addLab("New Lab");
      });

      expect(success).toBe(true);
      expect(result.current.labs).toHaveLength(3);
      expect(result.current.labs[2].lab_name).toBe("New Lab");
    });

    test("returns false for duplicate lab name", async () => {
      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = true;
      await act(async () => {
        success = await result.current.addLab("Central Lab");
      });

      expect(success).toBe(false);
      expect(result.current.labs).toHaveLength(2);
    });

    test("returns false for empty string", async () => {
      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = true;
      await act(async () => {
        success = await result.current.addLab("");
      });

      expect(success).toBe(false);
      expect(result.current.labs).toHaveLength(2);
    });

    test("returns false for whitespace-only string", async () => {
      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = true;
      await act(async () => {
        success = await result.current.addLab("   ");
      });

      expect(success).toBe(false);
    });

    test("is case-insensitive for duplicates", async () => {
      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = true;
      await act(async () => {
        success = await result.current.addLab("central lab");
      });

      expect(success).toBe(false);
    });
  });

  describe("updateLab", () => {
    test("updates lab name in state on success", async () => {
      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = false;
      await act(async () => {
        success = await result.current.updateLab("lab-001", "Updated Lab");
      });

      expect(success).toBe(true);
      expect(result.current.labs.find((l) => l.id === "lab-001")?.lab_name).toBe("Updated Lab");
    });

    test("returns false for duplicate name", async () => {
      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = true;
      await act(async () => {
        success = await result.current.updateLab("lab-001", "City Diagnostics");
      });

      expect(success).toBe(false);
      expect(result.current.labs[0].lab_name).toBe("Central Lab");
    });

    test("returns false for empty string", async () => {
      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = true;
      await act(async () => {
        success = await result.current.updateLab("lab-001", "");
      });

      expect(success).toBe(false);
    });

    test("allows keeping the same name", async () => {
      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = false;
      await act(async () => {
        success = await result.current.updateLab("lab-001", "Central Lab");
      });

      expect(success).toBe(true);
    });
  });

  describe("deleteLab", () => {
    test("removes lab from state on success", async () => {
      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = false;
      await act(async () => {
        success = await result.current.deleteLab("lab-002");
      });

      expect(success).toBe(true);
      expect(result.current.labs).toHaveLength(1);
      expect(result.current.labs.find((l) => l.id === "lab-002")).toBeUndefined();
    });

    test("returns false on error", async () => {
      mockDeleteError.error = new Error("Delete failed");

      const { result } = renderHook(() => useLab(INITIAL_LABS));

      let success = true;
      await act(async () => {
        success = await result.current.deleteLab("lab-001");
      });

      expect(success).toBe(false);
      expect(result.current.labs).toHaveLength(2);
    });
  });
});
