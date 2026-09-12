// E2E test: verify that newly added records appear in the table immediately.
// Tests the fix for the bug where records don't show up after creation
// because the month filter doesn't auto-select.

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("Add Record — Month Visibility", () => {
  test("newly added GP record appears in table immediately", async ({ page }) => {
    const admin = getAdminClient();
    const uniqueEmail = `pw-month-${Date.now()}@gmail.com`;
    const username = `pw_month_${Date.now()}`;
    const password = "Test1234!";
    const patientId = `MONTH-${Date.now()}`;

    // ── Sign Up + Login ────────────────────────────────────────
    await page.goto("/signup");
    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    await page.locator("#confirmPassword").fill(password);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(
      page.getByText("Account created successfully! Redirecting to login...")
    ).toBeVisible();
    await page.waitForURL("**/login");

    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/assistant");

    // ── Add Record ─────────────────────────────────────────────
    await expect(page.getByRole("heading", { name: "Patient Records" })).toBeVisible();
    await page.getByRole("button", { name: "Add Record" }).click();
    await expect(page.getByText("Add GP Record")).toBeVisible();

    await page.locator("#patientId").fill(patientId);
    await page.locator("#patientName").fill("Month Visibility Test");
    await page.locator("#diagnosis").fill("Test diagnosis");
    await page.locator("#totalCost").fill("15000");

    await page.getByRole("dialog").getByRole("button", { name: "Add Record" }).click();

    // ── Verify record appears immediately ──────────────────────
    // The dialog should close
    await expect(page.getByText("Add GP Record")).not.toBeVisible();

    // The record should be visible in the table without manually switching months
    await expect(page.getByText(patientId)).toBeVisible();
    await expect(page.getByText("Month Visibility Test")).toBeVisible();

    // ── Logout ─────────────────────────────────────────────────
    await page.getByTitle("Log out").click();
    await page.waitForURL("**/login");

    // ── Cleanup ────────────────────────────────────────────────
    const { data: records } = await admin
      .from("patient_records")
      .select("id")
      .eq("patient_id", patientId);
    if (records && records.length > 0) {
      await admin.from("patient_records").delete().eq("id", records[0].id);
    }

    const { data: users } = await admin.auth.admin.listUsers();
    const createdUser = users?.users?.find((u) => u.email === uniqueEmail);
    if (createdUser) {
      await admin.auth.admin.deleteUser(createdUser.id);
    }
  });

  test("newly added Case record appears in table immediately", async ({ page }) => {
    const admin = getAdminClient();
    const uniqueEmail = `pw-month-case-${Date.now()}@gmail.com`;
    const username = `pw_month_case_${Date.now()}`;
    const password = "Test1234!";
    const patientId = `MCASE-${Date.now()}`;

    // ── Sign Up + Login ────────────────────────────────────────
    await page.goto("/signup");
    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    await page.locator("#confirmPassword").fill(password);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(
      page.getByText("Account created successfully! Redirecting to login...")
    ).toBeVisible();
    await page.waitForURL("**/login");

    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/assistant");

    // ── Add Case Record ────────────────────────────────────────
    await expect(page.getByRole("heading", { name: "Patient Records" })).toBeVisible();
    await page.getByRole("tab", { name: "Case Records" }).click();
    await page.getByRole("button", { name: "Add Record" }).click();
    await expect(page.getByText("Add Case Record")).toBeVisible();

    await page.locator("#patientId").fill(patientId);
    await page.locator("#patientName").fill("Case Month Test");

    // Select case type
    await page.getByRole("combobox", { name: /case type/i }).click();
    await page.getByRole("option", { name: "Crown" }).click();

    // Select a tooth
    await page.getByText("16", { exact: true }).click();

    // Select lab
    await page.getByRole("combobox", { name: /lab/i }).click();
    await page.getByRole("option", { name: "Central Lab" }).click();

    await page.locator("#totalCost").fill("200000");
    await page.locator("#paid").fill("50000");

    await page.getByRole("dialog").getByRole("button", { name: "Add Record" }).click();

    // ── Verify record appears immediately ──────────────────────
    await expect(page.getByText("Add Case Record")).not.toBeVisible();
    await expect(page.getByText(patientId)).toBeVisible();
    await expect(page.getByText("Case Month Test")).toBeVisible();

    // ── Logout ─────────────────────────────────────────────────
    await page.getByTitle("Log out").click();
    await page.waitForURL("**/login");

    // ── Cleanup ────────────────────────────────────────────────
    const { data: records } = await admin
      .from("patient_records")
      .select("id")
      .eq("patient_id", patientId);
    if (records && records.length > 0) {
      await admin.from("case_payments").delete().eq("record_id", records[0].id);
      await admin.from("patient_records").delete().eq("id", records[0].id);
    }

    const { data: users } = await admin.auth.admin.listUsers();
    const createdUser = users?.users?.find((u) => u.email === uniqueEmail);
    if (createdUser) {
      await admin.auth.admin.deleteUser(createdUser.id);
    }
  });
});
