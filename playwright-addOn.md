# Signup Flow End-to-End Test Plan (Playwright)

## Overview
This test plan covers functional validation, client-side input validation, error handling, security constraints, and backend edge cases for the Assistant Public Signup flow (`/signup`).

---

## 1. Test Matrix & Scenarios

| Test ID | Category | Scenario / Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-SIGNUP-01** | Happy Path | Register a brand new valid user | Account created; redirect to `/login` with success feedback |
| **TC-SIGNUP-02** | Duplicate Check | Register using an existing email | Prevent registration; show "Email is already registered" alert |
| **TC-SIGNUP-03** | Case-Insensitivity | Register with an existing email in different casing (e.g. `User@Clinic.com` vs `user@clinic.com`) | Prevent registration; treat email as case-insensitive duplicate |
| **TC-SIGNUP-04** | Input Validation | Submit form with empty fields | Show inline required errors for Email, Username, Password, Confirm Password |
| **TC-SIGNUP-05** | Input Validation | Invalid email formats (e.g., `plainaddress`, `missing@domain`, `@no-user.com`) | Show "Please enter a valid email address." |
| **TC-SIGNUP-06** | Input Validation | Username too short (< 3 characters) | Show "Username must be at least 3 characters." |
| **TC-SIGNUP-07** | Input Validation | Username with special characters/spaces (e.g., `user@name`, `user name!`) | Show "Username can only contain letters, numbers, and underscores." |
| **TC-SIGNUP-08** | Input Validation | Password too short (< 6 characters) | Show "Password must be at least 6 characters." |
| **TC-SIGNUP-09** | Input Validation | Password and Confirm Password do not match | Show "Passwords do not match." error under confirm password |
| **TC-SIGNUP-10** | Database Integrity | Verify Supabase trigger execution | User exists in `auth.users` AND corresponding record exists in `public.profiles` with `role = 'ASSISTANT'` |
| **TC-SIGNUP-11** | UI State | Submit button behavior during request | Button shows "Creating account..." and is disabled to prevent duplicate submissions |
| **TC-SIGNUP-12** | Navigation | Click "Already have an account? Log in" link | Redirects directly to `/login` |

---

## 2. Playwright Implementation Spec (`tests/signup.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Assistant Signup Page E2E Tests', () => {
  const uniqueId = Date.now();
  const existingEmail = `existing_${uniqueId}@clinic.com`;
  const validPassword = 'SecurePassword123!';

  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create Assistant Account' })).toBeVisible();
  });

  test('TC-SIGNUP-01: Successful signup with new credentials', async ({ page }) => {
    const newEmail = `assistant_${uniqueId}@clinic.com`;

    await page.getByLabel(/Email/i).fill(newEmail);
    await page.getByLabel(/Username/i).fill(`assistant_${uniqueId}`);
    await page.getByLabel(/^Password/i).fill(validPassword);
    await page.getByLabel(/Confirm Password/i).fill(validPassword);

    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Verify feedback alert and redirect
    await expect(page.getByText('Account created successfully!')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/, { timeout: 7000 });
  });

  test('TC-SIGNUP-02: Prevent duplicate signup with same email', async ({ page }) => {
    // 1. Seed existing user first or use an account created previously
    await page.getByLabel(/Email/i).fill(existingEmail);
    await page.getByLabel(/Username/i).fill(`dup_user_${uniqueId}`);
    await page.getByLabel(/^Password/i).fill(validPassword);
    await page.getByLabel(/Confirm Password/i).fill(validPassword);
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/\/login/);

    // 2. Try registering with the exact same email again
    await page.goto('/signup');
    await page.getByLabel(/Email/i).fill(existingEmail);
    await page.getByLabel(/Username/i).fill(`another_user_${uniqueId}`);
    await page.getByLabel(/^Password/i).fill(validPassword);
    await page.getByLabel(/Confirm Password/i).fill(validPassword);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Verify submission error alert
    await expect(
      page.getByText('Email is already registered. Please use another email.')
    ).toBeVisible();
  });

  test('TC-SIGNUP-03: Validation errors on empty submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Username is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
  });

  test('TC-SIGNUP-04: Validation errors on invalid email and short username', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('invalid-email-format');
    await page.getByLabel(/Username/i).fill('ab'); // < 3 characters
    await page.getByLabel(/^Password/i).fill('123'); // < 6 characters
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    await expect(page.getByText('Username must be at least 3 characters.')).toBeVisible();
    await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible();
  });

  test('TC-SIGNUP-05: Mismatched password and confirm password', async ({ page }) => {
    await page.getByLabel(/Email/i).fill(`mismatch_${uniqueId}@clinic.com`);
    await page.getByLabel(/Username/i).fill('valid_username');
    await page.getByLabel(/^Password/i).fill('Password123!');
    await page.getByLabel(/Confirm Password/i).fill('DifferentPassword123!');

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Passwords do not match.')).toBeVisible();
  });

  test('TC-SIGNUP-06: Button state transitions to disabled during submit', async ({ page }) => {
    await page.getByLabel(/Email/i).fill(`state_${uniqueId}@clinic.com`);
    await page.getByLabel(/Username/i).fill(`user_${uniqueId}`);
    await page.getByLabel(/^Password/i).fill(validPassword);
    await page.getByLabel(/Confirm Password/i).fill(validPassword);

    const submitBtn = page.getByRole('button', { name: 'Sign Up' });
    await submitBtn.click();

    // Verify loading state
    await expect(page.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
  });
});