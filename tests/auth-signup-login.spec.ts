// Integration test: sign up via Supabase auth, then log in with the new account.
// Tests the real user flow end-to-end. If signup is broken, this test should fail.

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("Sign Up Form Validation", () => {
  // Expect validation errors when submitting an empty form.
  test("shows validation errors for empty fields", async ({ page }) => {
    await page.goto("/signup");

    // Click submit without filling any fields.
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Expects page to show required field errors for email, username, and password.
    await expect(page.getByText("Email is required.")).toBeVisible();
    await expect(page.getByText("Username is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();
  });

  // Expect validation error for an invalid email format.
  test("shows validation error for invalid email", async ({ page }) => {
    await page.goto("/signup");

    // Fill with invalid email, then remove type attr to bypass HTML5 native validation.
    await page.locator("#email").fill("not-an-email");
    await page.locator("#email").evaluate((el: HTMLInputElement) => {
      el.removeAttribute("type");
    });
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Expects page to have a validation message for invalid email.
    await expect(
      page.getByText("Please enter a valid email address.")
    ).toBeVisible();
  });

  // Expect validation error when password is shorter than 6 characters.
  test("shows validation error for short password", async ({ page }) => {
    await page.goto("/signup");

    // Fill password with only 3 characters.
    await page.locator("#password").fill("123");
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Expects page to have a validation message for short password.
    await expect(
      page.getByText("Password must be at least 6 characters.")
    ).toBeVisible();
  });

  // Expect validation error when confirm password doesn't match.
  test("shows validation error for mismatched passwords", async ({ page }) => {
    await page.goto("/signup");

    // Fill password and confirm password with different values.
    await page.locator("#password").fill("Test1234!");
    await page.locator("#confirmPassword").fill("Different123!");
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Expects page to have a validation message for password mismatch.
    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });
});

test.describe("Sign Up and Login", () => {
  // Expect a new user to sign up successfully and then log in.
  test("new user can sign up and then log in with the new account", async ({
    page,
  }) => {
    const admin = getAdminClient();
    const uniqueEmail = `pw-test-${Date.now()}@gmail.com`;
    const username = `pw_user_${Date.now()}`;
    const password = "Test1234!";

    // ── Sign Up ────────────────────────────────────────────────
    await page.goto("/signup");

    // Fill the signup form with valid data.
    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    await page.locator("#confirmPassword").fill(password);

    // Submit the signup form.
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Expects success message after signup.
    await expect(
      page.getByText("Account created successfully!")
    ).toBeVisible();

    // Expects redirect to /login after signup.
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login/);

    // ── Login ──────────────────────────────────────────────────
    // Fill login form with the same credentials used during signup.
    await page.locator("#email").fill(uniqueEmail);
    await page.locator("#password").fill(password);

    // Submit the login form.
    await page.getByRole("button", { name: "Sign In" }).click();

    // Expects redirect to /assistant for assistant role.
    await page.waitForURL("**/assistant");
    await expect(page).toHaveURL(/\/assistant/);

    // ── Cleanup: delete the auth user created during signup ────
    const { data: users } = await admin.auth.admin.listUsers();
    const createdUser = users?.users?.find((u) => u.email === uniqueEmail);
    if (createdUser) {
      await admin.auth.admin.deleteUser(createdUser.id);
    }
  });

  // Expect error message when login credentials are wrong.
  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill with non-existent email and wrong password.
    await page.locator("#email").fill("nonexistent@gmail.com");
    await page.locator("#password").fill("WrongPassword123!");

    // Click the sign in button.
    await page.getByRole("button", { name: "Sign In" }).click();

    // Expects page to show invalid credentials error.
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });
});
