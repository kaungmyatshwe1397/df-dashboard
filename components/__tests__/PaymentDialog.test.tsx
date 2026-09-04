// ============================================
// Component Tests — PaymentDialog
// ============================================
// Tests for form validation logic.
// Note: base-ui Dialog doesn't render in JSDOM, so rendering tests are skipped.

import { describe, test, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DataProvider } from "@/context/DataContext";
import { PaymentDialog } from "../records/PaymentDialog";
import { CasePatientRecordType, RecordCategory } from "@/lib/global";

const mockRecord: CasePatientRecordType = {
  id: "rec-test-1",
  cycle_id: "cycle-001",
  patient_id: "0099/26",
  entry_date: "2026-09-01",
  patient_name: "Test Patient",
  category: RecordCategory.CASE,
  diagnosis: "Test diagnosis",
  total_cost: 200000,
  lab_name: "Test Lab",
  paid: 0,
  remaining: 200000,
  is_carried_forward: false,
  month_label: "Sep 2026",
};

function renderWithProvider(ui: React.ReactElement) {
  return render(<DataProvider>{ui}</DataProvider>);
}

describe("PaymentDialog", () => {
  test("shows validation error for empty paid amount", async () => {
    renderWithProvider(
      <PaymentDialog open={true} onOpenChange={() => {}} record={mockRecord} />
    );

    const saveButtons = screen.getAllByText("Save Payment");
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Enter a valid amount/)).toBeInTheDocument();
    });
  });

  test("shows validation error when amount exceeds remaining", async () => {
    renderWithProvider(
      <PaymentDialog open={true} onOpenChange={() => {}} record={mockRecord} />
    );

    fireEvent.change(screen.getByLabelText(/Paid Amount/i), {
      target: { value: "250000" },
    });
    const saveButtons = screen.getAllByText("Save Payment");
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/cannot exceed remaining balance/)).toBeInTheDocument();
    });
  });
});
