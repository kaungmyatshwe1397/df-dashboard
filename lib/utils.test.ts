// ============================================
// Unit Tests — cn utility
// ============================================
// Tests for the Tailwind class name merger.

import { describe, test, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  test("merges Tailwind classes, last conflict wins", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  test("handles undefined and null gracefully", () => {
    const result = cn(undefined, null, "px-2");
    expect(result).toBe("px-2");
  });

  test("combines non-conflicting classes", () => {
    const result = cn("text-red-500", "font-bold");
    expect(result).toContain("text-red-500");
    expect(result).toContain("font-bold");
  });
});
