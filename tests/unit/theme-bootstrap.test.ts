// The pre-hydration script treats browser storage as data and preserves the theme default.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, test, vi } from "vitest";

const source = readFileSync(resolve(process.cwd(), "public/theme-init.js"), "utf8");

function bootstrap(getItem: () => string | null) {
  const root = { dataset: {} as { theme?: string }, classList: { toggle: vi.fn() } };
  runInNewContext(source, { localStorage: { getItem }, document: { documentElement: root } });
  return root;
}

describe("theme bootstrap", () => {
  test("restores the saved light theme before hydration", () => {
    const root = bootstrap(() => "light");
    expect(root.dataset.theme).toBe("light");
    expect(root.classList.toggle).toHaveBeenCalledWith("dark", false);
  });
  test.each([null, "dark", "invalid", '<script>alert("x")</script>'])("defaults to dark for %s", (value) => {
    const root = bootstrap(() => value);
    expect(root.dataset.theme).toBe("dark");
    expect(root.classList.toggle).toHaveBeenCalledWith("dark", true);
  });
  test("still initializes the theme when storage is blocked", () => {
    const root = bootstrap(() => { throw new Error("Storage unavailable"); });
    expect(root.dataset.theme).toBe("dark");
  });
});
