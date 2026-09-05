// ============================================
// Component Tests — RecordTable (Tabbed)
// ============================================
// RecordTable now has GP and Case tabs.
// By default, the GP tab is active.

import { describe, test, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DataProvider } from "@/context/DataContext";
import { RecordTable } from "../records/record-table";

function renderWithProvider(ui: React.ReactElement) {
  return render(<DataProvider>{ui}</DataProvider>);
}

describe("RecordTable", () => {
  test("renders the table heading", async () => {
    renderWithProvider(<RecordTable onAdd={() => {}} onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Patient Records")).toBeInTheDocument();
    });
  });

  test("shows GP and Case tabs", async () => {
    renderWithProvider(<RecordTable onAdd={() => {}} onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Patient Records")).toBeInTheDocument();
    });
    const gpTabs = screen.getAllByRole("tab", { name: "GP Records" });
    const caseTabs = screen.getAllByRole("tab", { name: "Case Records" });
    expect(gpTabs.length).toBeGreaterThanOrEqual(1);
    expect(caseTabs.length).toBeGreaterThanOrEqual(1);
  });

  test("GP tab shows GP records by default", async () => {
    renderWithProvider(<RecordTable onAdd={() => {}} onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getAllByText("John Doe").length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ------------------------------------------
// TODO: Add these tests later
// ------------------------------------------
// - Test: switching to Case tab shows case records
// - Test: each tab has its own "Add Record" button
// - Test: hides add buttons when cycle is locked
// - Test: shows loading skeleton
// - Test: shows error state with retry button
// - Test: shows empty state per tab
// - Test: pagination works independently per tab
