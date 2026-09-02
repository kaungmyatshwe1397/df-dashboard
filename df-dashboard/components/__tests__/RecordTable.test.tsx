// ============================================
// Component Tests — RecordTable
// ============================================
// RecordTable uses useData() which needs DataProvider.
// We wrap the component in DataProvider for tests.

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataProvider } from "@/context/DataContext";
import { RecordTable } from "../RecordTable";

// Helper: wraps component in DataProvider
function renderWithProvider(ui: React.ReactElement) {
  return render(<DataProvider>{ui}</DataProvider>);
}

describe("RecordTable", () => {
  test("renders the table heading", () => {
    renderWithProvider(<RecordTable onAdd={() => {}} />);
    expect(screen.getByText("Patient Records")).toBeInTheDocument();
  });

  test("renders patient names from mock data", () => {
    renderWithProvider(<RecordTable onAdd={() => {}} />);
    // Names appear in table cells (may have duplicates from title attribute)
    expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Jane Smith").length).toBeGreaterThanOrEqual(1);
  });

  test("shows GP and Case category badges", () => {
    renderWithProvider(<RecordTable onAdd={() => {}} />);
    const gpBadges = screen.getAllByText("GP");
    const caseBadges = screen.getAllByText("CASE");
    expect(gpBadges.length).toBeGreaterThanOrEqual(1);
    expect(caseBadges.length).toBeGreaterThanOrEqual(1);
  });
});

// ------------------------------------------
// TODO: Add these tests later
// ------------------------------------------
// - Test: shows "Carried forward" badge
// - Test: shows "Payment Complete" badge when balance = 0
// - Test: hides add button when cycle is locked
// - Test: shows loading skeleton
// - Test: shows error state with retry button
// - Test: shows empty state when no records
// - Test: pagination works with many records
