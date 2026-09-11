// Integration test: signup → login → create patient → logout.
// Tests the full assistant flow end-to-end using a fresh account.

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("Create GP Patient Record", () => {
  test("signup → login → add GP record → verify in table → logout", async ({ page }) => {
    const admin = getAdminClient();
    const uniqueEmail = `pw-gp-${Date.now()}@gmail.com`;
    const username = `pw_gp_${Date.now()}`;
    const password = "Test1234!";
    const patientId = `GP-${Date.now()}`;

    // ── Sign Up ────────────────────────────────────────────────
    await page.goto("/signup");
    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    await page.locator("#confirmPassword").fill(password);
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Wait for success message and redirect to login.
    await expect(
      page.getByText("Account created successfully! Redirecting to login...")
    ).toBeVisible();
    await page.waitForURL("**/login");

    // ── Login ──────────────────────────────────────────────────
    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/assistant");

    // ── Create GP Patient ──────────────────────────────────────
    await expect(page.getByRole("heading", { name: "Patient Records" })).toBeVisible();
    await page.getByRole("button", { name: "Add GP Record" }).click();
    await expect(page.getByText("Add GP Record")).toBeVisible();

    await page.locator("#patientId").fill(patientId);
    await page.locator("#patientName").fill("Test GP Patient");
    await page.locator("#diagnosis").fill("Routine checkup");
    await page.locator("#totalCost").fill("25000");

    await page.getByRole("button", { name: "Add Record" }).click();
    await expect(page.getByText("Add GP Record")).not.toBeVisible();

    // Verify the record appears in the table.
    await expect(page.getByText(patientId)).toBeVisible();
    await expect(page.getByText("Test GP Patient")).toBeVisible();

    // ── Logout ─────────────────────────────────────────────────
    await page.getByTitle("Log out").click();
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login/);

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
});

test.describe("Create Case Patient Record", () => {
  test("signup → login → add Case record → verify in table → logout", async ({ page }) => {
    const admin = getAdminClient();
    const uniqueEmail = `pw-case-${Date.now()}@gmail.com`;
    const username = `pw_case_${Date.now()}`;
    const password = "Test1234!";
    const patientId = `CASE-${Date.now()}`;

    // ── Sign Up ────────────────────────────────────────────────
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

    // ── Login ──────────────────────────────────────────────────
    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/assistant");

    // ── Create Case Patient ────────────────────────────────────
    await expect(page.getByRole("heading", { name: "Patient Records" })).toBeVisible();
    await page.getByRole("tab", { name: "Case Records" }).click();
    await page.getByRole("button", { name: "Add New Case" }).click();
    await expect(page.getByText("Add Case Record")).toBeVisible();

    await page.locator("#patientId").fill(patientId);
    await page.locator("#patientName").fill("Test Case Patient");

    // Select case type.
    await page.getByRole("combobox", { name: /case type/i }).click();
    await page.getByRole("option", { name: "Crown" }).click();

    // Select a tooth.
    await page.getByText("16", { exact: true }).click();

    // Select lab.
    await page.getByRole("combobox", { name: /lab/i }).click();
    await page.getByRole("option", { name: "Central Lab" }).click();

    // Fill cost and paid.
    await page.locator("#totalCost").fill("200000");
    await page.locator("#paid").fill("50000");

    await page.getByRole("button", { name: "Add Record" }).click();
    await expect(page.getByText("Add Case Record")).not.toBeVisible();

    // Verify the record appears in the Case table.
    await expect(page.getByText(patientId)).toBeVisible();
    await expect(page.getByText("Test Case Patient")).toBeVisible();

    // ── Logout ─────────────────────────────────────────────────
    await page.getByTitle("Log out").click();
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login/);

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

test.describe("Form Validation", () => {
  test("GP form shows errors when submitting empty", async ({ page }) => {
    const admin = getAdminClient();
    const uniqueEmail = `pw-val-${Date.now()}@gmail.com`;
    const username = `pw_val_${Date.now()}`;
    const password = "Test1234!";

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

    // ── Validation ─────────────────────────────────────────────
    await expect(page.getByRole("heading", { name: "Patient Records" })).toBeVisible();
    await page.getByRole("button", { name: "Add GP Record" }).click();
    await expect(page.getByText("Add GP Record")).toBeVisible();

    await page.getByRole("button", { name: "Add Record" }).click();

    await expect(page.getByText("Patient ID is required.")).toBeVisible();
    await expect(page.getByText("Patient name is required.")).toBeVisible();
    await expect(page.getByText("Diagnosis is required.")).toBeVisible();
    await expect(page.getByText("Enter a valid cost greater than 0.")).toBeVisible();

    // ── Logout ─────────────────────────────────────────────────
    await page.getByTitle("Log out").click();
    await page.waitForURL("**/login");

    // ── Cleanup ────────────────────────────────────────────────
    const { data: users } = await admin.auth.admin.listUsers();
    const createdUser = users?.users?.find((u) => u.email === uniqueEmail);
    if (createdUser) {
      await admin.auth.admin.deleteUser(createdUser.id);
    }
  });
});
