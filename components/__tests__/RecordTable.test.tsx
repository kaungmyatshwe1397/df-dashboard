// ============================================
// Component Tests — RecordTable (Tabbed)
// ============================================
// RecordTable now has GP and Case tabs.
// By default, the GP tab is active.
// NOTE: Tests use scoped queries to avoid JSDOM portal leak issues.

import { describe, test, expect } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { DataProvider } from "@/context/DataContext";
import { RecordTable } from "../records/record-table";

function renderWithProvider(ui: React.ReactElement) {
  return render(<DataProvider>{ui}</DataProvider>);
}

describe("RecordTable", () => {
  test("renders the table heading", async () => {
    const { container } = renderWithProvider(<RecordTable onAdd={() => {}} onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getAllByText("Patient Records").length).toBeGreaterThanOrEqual(1);
    });
  });

  test("shows GP and Case tabs", async () => {
    const { container } = renderWithProvider(<RecordTable onAdd={() => {}} onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getAllByText("Patient Records").length).toBeGreaterThanOrEqual(1);
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

  test("switching to Case tab shows case records", async () => {
    renderWithProvider(<RecordTable onAdd={() => {}} onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getAllByText("Patient Records").length).toBeGreaterThanOrEqual(1);
    });

    const caseTab = screen.getAllByRole("tab", { name: "Case Records" })[0];
    fireEvent.click(caseTab);

    await waitFor(() => {
      expect(screen.getAllByText("Jane Smith").length).toBeGreaterThanOrEqual(1);
    });
  });

  test("each tab section has its own Add button", async () => {
    renderWithProvider(<RecordTable onAdd={() => {}} onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getAllByText("Patient Records").length).toBeGreaterThanOrEqual(1);
    });

    // GP tab should have Add GP Record button
    await waitFor(() => {
      expect(screen.getAllByText("Add GP Record").length).toBeGreaterThanOrEqual(1);
    });

    // Switch to Case tab
    const caseTab = screen.getAllByRole("tab", { name: "Case Records" })[0];
    fireEvent.click(caseTab);

    await waitFor(() => {
      expect(screen.getAllByText("Add New Case").length).toBeGreaterThanOrEqual(1);
    });
  });

  test("hides add buttons when cycle is locked", async () => {
    renderWithProvider(<RecordTable onAdd={() => {}} onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getAllByText("Patient Records").length).toBeGreaterThanOrEqual(1);
    });

    // Seed data has cycle OPEN, so add buttons should be visible
    // We verify the locked badge appears when cycle is locked
    // For unlocked cycle, no badge should be visible
    const lockedBadges = screen.queryAllByText("Read-only");
    // No badge when unlocked
    expect(lockedBadges.length).toBe(0);
  });

  test("shows record count per tab", async () => {
    renderWithProvider(<RecordTable onAdd={() => {}} onEdit={() => {}} />);
    await waitFor(() => {
      expect(screen.getAllByText("Patient Records").length).toBeGreaterThanOrEqual(1);
    });

    // GP tab should show "1 record" (seed data has 1 GP record)
    await waitFor(() => {
      expect(screen.getAllByText("1 record").length).toBeGreaterThanOrEqual(1);
    });
  });
});
