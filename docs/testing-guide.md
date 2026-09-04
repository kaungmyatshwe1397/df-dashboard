# Testing Guide — Practical Reference

> **Purpose:** When to test, what to test, what type to use, and how to write good tests.
> **For:** Developers new to testing. Read this when confused.

---

## 1. What Is a Test?

A test is a function that **checks if your code behaves correctly**. You write the check manually. A framework runs it and reports pass/fail.

```typescript
// You write this:
test("adds two numbers", () => {
  expect(add(2, 3)).toBe(5);
});

// Framework runs it → PASS ✓ or FAIL ✗
```

Tests do NOT write themselves. Frameworks (Vitest, Jest, Playwright) only **run** what you wrote.

---

## 2. Test Types (3 Levels)

| Level | What it tests | Speed | Cost | Tool |
|-------|--------------|-------|------|------|
| **Unit** | Single function, pure logic | Fastest | Low | Vitest |
| **Component** | UI renders, clicks, state changes | Medium | Medium | Vitest + React Testing Library |
| **E2E** | Full user flow in real browser | Slowest | High | Playwright / Cypress |

### When to Use Each

| Situation | Use |
|-----------|-----|
| Pure calculation (no DOM) | Unit |
| Form validation, button clicks, conditional rendering | Component |
| Login → navigate → submit → verify page | E2E |
| API integration (fetch, database) | Component (mocked) or E2E |
| Styling, layout, spacing | None (skip) |

---

## 3. Decision Framework: What to Test

### The 3 Questions Filter

For every function or component, ask:

```
1. Does it CALCULATE or TRANSFORM data?  → TEST IT
2. Does it CHANGE state or handle USER INPUT? → TEST IT
3. Is it only LAYOUT or STYLING? → SKIP IT
```

### Quick Reference

| Category | Test? | Type |
|----------|-------|------|
| Utility functions (math, formatting, sorting) | Yes | Unit |
| Business logic (balances, commissions, validation) | Yes | Unit |
| React hooks (useState, custom hooks) | Yes | Component |
| Forms (submit, validate, error display) | Yes | Component |
| Conditional rendering (if/else, loading, empty) | Yes | Component |
| Components that fetch data | Yes | Component (mock fetch) |
| API routes / server actions | Yes | Unit or E2E |
| Pure layout / styling | No | — |
| Skeleton / loading appearance | No | — |
| CSS animations | No | — |
| Third-party library internals | No | — |

### The Money Rule

> **Test the math and the money. Skip the pixels.**

For financial systems specifically:
- Balance calculations → must test
- Payment totals → must test
- Commission formulas → must test
- Currency formatting → must test
- UI colors, spacing, shadows → skip

---

## 4. Test Structure (AAA Pattern)

Every test follows 3 steps:

```typescript
test("description of what is being tested", () => {
  // 1. ARRANGE — set up data and conditions
  const record = { total_cost: 250000, paid_amount: 150000 };

  // 2. ACT — call the function or interact with component
  const balance = getRecordBalance(record);

  // 3. ASSERT — check the result
  expect(balance).toBe(100000);
});
```

Keep this pattern. It makes tests readable.

---

## 5. Unit Tests

### What
Test a single function in isolation. No DOM, no browser, no React.

### When
- Pure calculations
- Data transformations
- Validation logic
- Formatting functions

### Example

```typescript
import { describe, test, expect } from "vitest";
import { getRecordBalance } from "./helpers";

describe("getRecordBalance", () => {
  test("returns unpaid amount when partially paid", () => {
    const record = { total_cost: 500000, paid_amount: 200000 };
    expect(getRecordBalance(record)).toBe(300000);
  });

  test("returns zero when fully paid", () => {
    const record = { total_cost: 500000, paid_amount: 500000 };
    expect(getRecordBalance(record)).toBe(0);
  });

  test("handles zero cost", () => {
    const record = { total_cost: 0, paid_amount: 0 };
    expect(getRecordBalance(record)).toBe(0);
  });
});
```

### Tips
- Test the happy path AND edge cases (zero, negative, very large numbers)
- One assertion per test is ideal, but related assertions are fine
- Name tests to describe expected behavior, not implementation

---

## 6. Component Tests (React Testing Library)

### What
Render a React component and verify it behaves correctly: renders data, handles clicks, shows error states.

### When
- Component renders correct output
- User interactions (click, type, submit)
- Conditional rendering (show/hide based on state)
- Loading, error, empty states

### Example

```typescript
import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecordTable } from "./RecordTable";

describe("RecordTable", () => {
  test("shows empty state when no records", () => {
    render(<RecordTable records={[]} />);
    expect(screen.getByText("No entries yet this cycle")).toBeInTheDocument();
  });

  test("renders patient names in table", () => {
    const records = [{ id: "1", patient_name: "John Doe", total_cost: 50000 }];
    render(<RecordTable records={records} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test("hides add button when cycle is locked", () => {
    render(<RecordTable records={[]} cycleLocked={true} />);
    expect(screen.queryByText("Add Record")).not.toBeInTheDocument();
  });
});
```

### Key APIs

| API | What it does |
|-----|-------------|
| `render(<Component />)` | Puts component in fake DOM |
| `screen.getByText("...")` | Finds element by visible text |
| `screen.queryByText("...")` | Returns null if not found (no crash) |
| `screen.getByRole("button")` | Finds by ARIA role |
| `fireEvent.click(element)` | Simulates a click |
| `await screen.findByText("...")` | Waits for async rendering |

### Tips
- Test what the USER sees, not internal state
- Use `getByText` for visible text, `queryByText` for "should NOT exist"
- Use `getByRole` over `getByTestId` when possible (tests accessibility too)
- Don't test implementation details (state variables, internal methods)

---

## 7. E2E Tests (Playwright)

### What
Opens a real browser and runs through a full user flow.

### When
- Critical user journeys (login, checkout, data entry)
- Cross-page navigation
- Authentication flows
- Forms that submit to real (or mocked) backends

### Example

```typescript
import { test, expect } from "@playwright/test";

test("assistant can log in and see records", async ({ page }) => {
  // 1. Go to login page
  await page.goto("/login");

  // 2. Fill in credentials
  await page.fill('input[name="username"]', "assistant");
  await page.fill('input[name="password"]', "assist123");

  // 3. Click login
  await page.click('button[type="submit"]');

  // 4. Verify redirect to assistant portal
  await expect(page).toHaveURL("/assistant");
  await expect(page.getByText("Record Table")).toBeVisible();
});
```

### Tips
- Write E2E only for critical paths (login, main data flow)
- Keep E2E tests few — they are slow and brittle
- Use unit/component tests for everything else
- Test the FULL flow, not individual steps

---

## 8. What NOT to Test

| Skip | Reason |
|------|--------|
| Pure CSS / styling | Not logic, visual regression tools handle this |
| Third-party library internals | Trust the library, test YOUR integration with it |
| Implementation details | Test behavior, not how it's built |
| Skeleton/loading appearance | Visual, not functional |
| Trivial getters/setters | No logic to verify |
| Auto-generated code | Nothing to verify |

---

## 9. Test File Organization

```
src/
  components/
    RecordTable.tsx          → component being tested
    RecordTable.test.tsx     → tests live next to source (colocated)
  lib/
    helpers.ts               → utility functions
    helpers.test.ts          → unit tests colocated
  e2e/
    assistant-flow.spec.ts   → E2E tests separate folder
```

### Naming Convention

- Unit/Component: `filename.test.ts` or `filename.test.tsx`
- E2E: `filename.spec.ts`

---

## 10. Common Patterns

### Mocking (Isolate What You Test)

```typescript
// Mock a function
vi.mock("./api", () => ({
  fetchRecords: vi.fn().mockResolvedValue([]),
}));

// Mock a module
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
```

### Testing Async (Loading States)

```typescript
test("shows loading then data", async () => {
  render(<DataComponent />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(await screen.findByText("Loaded data")).toBeInTheDocument();
});
```

### Testing User Events

```typescript
test("form submits correctly", async () => {
  const user = userEvent.setup();
  render(<MyForm />);
  await user.type(screen.getByLabelText("Name"), "John");
  await user.click(screen.getByRole("button", { name: "Submit" }));
  expect(screen.getByText("Success")).toBeInTheDocument();
});
```

### Testing Error States

```typescript
test("shows error when fetch fails", async () => {
  vi.mock("./api", () => ({
    fetchData: vi.fn().mockRejectedValue(new Error("Network error")),
  }));
  render(<DataComponent />);
  expect(await screen.findByText("Failed to load")).toBeInTheDocument();
});
```

---

## 11. Anti-Patterns (What NOT to Do)

| Bad | Good |
|-----|------|
| Testing implementation details | Test user-visible behavior |
| `expect(component.state).toBe(...)` | `expect(screen.getByText(...)).toBeInTheDocument()` |
| 50 assertions in one test | Split into focused tests |
| Testing library internals | Test your code's contract |
| `test("works")` | `test("calculates balance when partially paid")` |
| Snapshot tests everywhere | Use for API shape, not UI |
| Mocking everything | Mock only external dependencies |

---

## 12. Checklist Before Writing Tests

- [ ] What am I testing? (function, component, flow)
- [ ] What type? (unit, component, E2E)
- [ ] What are the edge cases? (zero, empty, error, large)
- [ ] What should NOT happen? (use `not.toBeInTheDocument`)
- [ ] Is this worth testing? (calculate/change = yes, layout = no)

---

## 13. Running Tests

```bash
# Unit + Component tests (Vitest)
npx vitest run              # run once
npx vitest                  # watch mode (re-runs on save)

# E2E tests (Playwright)
npx playwright test         # run all
npx playwright test --ui    # interactive UI mode
```

---

## 14. Reference

- Vitest docs: https://vitest.dev
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Playwright: https://playwright.dev
- Kent C. Dodds (testing philosophy): https://kentcdodds.com/blog/write-tests
