// Missing local configuration should name the setting without printing any configured values.
import { afterEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createBrowserClient: vi.fn(() => ({ configured: true })) }));
vi.mock("@supabase/ssr", () => ({ createBrowserClient: mocks.createBrowserClient }));
const { createClient } = await vi.importActual<typeof import("@/lib/supabase/client")>("@/lib/supabase/client");
afterEach(() => { vi.unstubAllEnvs(); mocks.createBrowserClient.mockClear(); });

describe("browser Supabase configuration", () => {
  test("names both absent variables and tells the developer to restart", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
    expect(createClient).toThrow(/NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    expect(createClient).toThrow(/restart Next.js/);
    expect(mocks.createBrowserClient).not.toHaveBeenCalled();
  });
  test("names only the missing setting and does not include configured values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
    expect(createClient).toThrow("Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    try { createClient(); } catch (error) { expect(String(error)).not.toContain("https://example.supabase.co"); }
  });
  test("passes configured public settings to the browser client", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_fixture");
    createClient();
    expect(mocks.createBrowserClient).toHaveBeenCalledWith("https://example.supabase.co", "sb_publishable_test_fixture");
  });
});
