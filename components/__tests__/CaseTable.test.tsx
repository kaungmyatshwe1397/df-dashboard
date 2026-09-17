// ============================================
// Component Tests — CaseTable
// ============================================
// Tests for empty state and rendering.

import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataProvider } from "@/context/DataContext";
import { CaseTable } from "../records/record-table/CaseTable";

function renderWithProvider(ui: React.ReactElement) {
  return render(<DataProvider>{ui}</DataProvider>);
}

describe("CaseTable", () => {
  test("shows empty state when no records", () => {
    renderWithProvider(
      <CaseTable
        records={[]}
        onAdd={() => {}}
        onEdit={() => {}}
      />
    );
    expect(screen.getByText("No case records yet this cycle.")).toBeInTheDocument();
  });

  test("shows add button in empty state", () => {
    const { container } = renderWithProvider(
      <CaseTable
        records={[]}
        onAdd={() => {}}
        onEdit={() => {}}
      />
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  test("renders without crashing with provider", () => {
    const { container } = renderWithProvider(
      <CaseTable
        records={[]}
        onAdd={() => {}}
        onEdit={() => {}}
      />
    );
    expect(container).toBeTruthy();
  });
});
