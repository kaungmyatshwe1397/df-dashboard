// E2E test: signup retry after password mismatch.
// Verifies the fix for the bug where users get "Email is already registered"
// when retrying signup after a password mismatch error.

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("Signup Retry After Password Mismatch", () => {
  test("user can signup after fixing password mismatch", async ({ page }) => {
    const admin = getAdminClient();
    const uniqueEmail = `pw-retry-${Date.now()}@gmail.com`;
    const username = `pw_retry_${Date.now()}`;
    const password = "Test1234!";

    // ── Step 1: Fill form with mismatched passwords ───────────
    await page.goto("/signup");
    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    await page.locator("#confirmPassword").fill("Different123!");

    // Submit — should fail with password mismatch
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page.getByText("Passwords do not match.")).toBeVisible();

    // ── Step 2: Fix the confirm password ──────────────────────
    await page.locator("#confirmPassword").clear();
    await page.locator("#confirmPassword").fill(password);

    // Submit again — should succeed (not "Email already registered")
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Should see success, NOT "Email is already registered"
    await expect(
      page.getByText("Account created successfully! Redirecting to login...")
    ).toBeVisible();

    // ── Step 3: Verify redirect to login ──────────────────────
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login/);

    // ── Cleanup ───────────────────────────────────────────────
    const { data: users } = await admin.auth.admin.listUsers();
    const createdUser = users?.users?.find((u) => u.email === uniqueEmail);
    if (createdUser) {
      await admin.auth.admin.deleteUser(createdUser.id);
    }
  });
});
