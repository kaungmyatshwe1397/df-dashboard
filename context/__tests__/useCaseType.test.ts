// ============================================
// Unit Tests — useCaseType Hook
// ============================================
// Tests for case type CRUD operations: add, update, delete.
// Verifies duplicate checking, empty input handling, and state updates.

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCaseType } from "../hooks/useCaseType";
import { CaseType } from "@/lib/global";

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

const INITIAL_CASE_TYPES: CaseType[] = [
  { id: "ct-001", name: "RPD" },
  { id: "ct-002", name: "Crown" },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockInsertResult.data = null;
  mockInsertResult.error = null;
  mockUpdateError.error = null;
  mockDeleteError.error = null;
});

describe("useCaseType", () => {
  describe("addCaseType", () => {
    test("adds case type to state on success", async () => {
      mockInsertResult.data = { id: "ct-003", name: "Bridge" };

      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = false;
      await act(async () => {
        success = await result.current.addCaseType("Bridge");
      });

      expect(success).toBe(true);
      expect(result.current.caseTypes).toHaveLength(3);
      expect(result.current.caseTypes[2].name).toBe("Bridge");
    });

    test("returns false for duplicate name", async () => {
      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = true;
      await act(async () => {
        success = await result.current.addCaseType("RPD");
      });

      expect(success).toBe(false);
      expect(result.current.caseTypes).toHaveLength(2);
    });

    test("returns false for empty string", async () => {
      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = true;
      await act(async () => {
        success = await result.current.addCaseType("");
      });

      expect(success).toBe(false);
      expect(result.current.caseTypes).toHaveLength(2);
    });

    test("returns false for whitespace-only string", async () => {
      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = true;
      await act(async () => {
        success = await result.current.addCaseType("   ");
      });

      expect(success).toBe(false);
    });

    test("is case-insensitive for duplicates", async () => {
      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = true;
      await act(async () => {
        success = await result.current.addCaseType("rpd");
      });

      expect(success).toBe(false);
    });
  });

  describe("updateCaseType", () => {
    test("updates name in state on success", async () => {
      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = false;
      await act(async () => {
        success = await result.current.updateCaseType("ct-001", "Full Denture");
      });

      expect(success).toBe(true);
      expect(result.current.caseTypes.find((ct) => ct.id === "ct-001")?.name).toBe("Full Denture");
    });

    test("returns false for duplicate name", async () => {
      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = true;
      await act(async () => {
        success = await result.current.updateCaseType("ct-001", "Crown");
      });

      expect(success).toBe(false);
      expect(result.current.caseTypes[0].name).toBe("RPD");
    });

    test("returns false for empty string", async () => {
      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = true;
      await act(async () => {
        success = await result.current.updateCaseType("ct-001", "");
      });

      expect(success).toBe(false);
    });

    test("allows keeping the same name", async () => {
      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = false;
      await act(async () => {
        success = await result.current.updateCaseType("ct-001", "RPD");
      });

      expect(success).toBe(true);
    });
  });

  describe("deleteCaseType", () => {
    test("removes case type from state on success", async () => {
      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = false;
      await act(async () => {
        success = await result.current.deleteCaseType("ct-002");
      });

      expect(success).toBe(true);
      expect(result.current.caseTypes).toHaveLength(1);
      expect(result.current.caseTypes.find((ct) => ct.id === "ct-002")).toBeUndefined();
    });

    test("returns false on error", async () => {
      mockDeleteError.error = new Error("Delete failed");

      const { result } = renderHook(() => useCaseType(INITIAL_CASE_TYPES));

      let success = true;
      await act(async () => {
        success = await result.current.deleteCaseType("ct-001");
      });

      expect(success).toBe(false);
      expect(result.current.caseTypes).toHaveLength(2);
    });
  });
});
