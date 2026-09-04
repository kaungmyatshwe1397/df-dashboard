// ============================================
// Component Tests — PatientRecordUpdateForm
// ============================================
// Tests for dialog close and edit mode rendering.
//
// base-ui JSDOM limitation: Dialog portals don't fully render controlled
// content. Only lookup-mode tests pass reliably. Form validation, add-mode,
// and save tests require real browser testing (Playwright).

import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataProvider } from "@/context/DataContext";
import { PatientRecordUpdateForm } from "../PatientRecordUpdateForm";
import { RecordCategory, GPPatientRecordType } from "@/lib/global";

const gpRecord: GPPatientRecordType = {
  id: "rec-001",
  cycle_id: "cycle-001",
  patient_id: "0001/26",
  entry_date: "2026-09-01",
  patient_name: "John Doe",
  address: "123 Main St",
  category: RecordCategory.GP,
  diagnosis: "Common cold",
  total_cost: 50000,
};

function renderWithProvider(ui: React.ReactElement) {
  return render(<DataProvider>{ui}</DataProvider>);
}

function getDialogTitle(): string {
  const el = document.querySelector("[data-slot='dialog-title']");
  return el?.textContent ?? "";
}

function getDialogCloseButton(): HTMLElement | null {
  const btns = document.querySelectorAll("[data-slot='dialog-content'] button");
  for (const btn of btns) {
    if (btn.querySelector(".sr-only")?.textContent === "Close") {
      return btn as HTMLElement;
    }
  }
  return null;
}

// ------------------------------------------
// Task 1 — X button closes dialog (lookup mode)
// ------------------------------------------
describe("PatientRecordUpdateForm — Dialog Close", () => {
  test("X button calls onOpenChange(false) in lookup mode", () => {
    const onOpenChange = vi.fn();
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={onOpenChange}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={null}
      />
    );

    const closeButton = getDialogCloseButton();
    expect(closeButton).not.toBeNull();
    fireEvent.click(closeButton!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

// ------------------------------------------
// Task 2 — Edit mode rendering
// ------------------------------------------
describe("PatientRecordUpdateForm — Edit Mode", () => {
  test("Edit mode with null record shows lookup title", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={null}
      />
    );
    expect(getDialogTitle()).toBe("Update GP Record");
  });

  test("Edit mode shows Delete button for existing record", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );
    const deleteButtons = screen.getAllByText("Delete");
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });
});

// TODO: Write these tests yourself. Use docs/testing-guide.md as reference.
// Practice: render the component, find the button by role/text, fireEvent.click, assert onOpenChange was called.
//
// describe("Dialog Close — Additional", () => {
//   test("overlay click closes the dialog in edit mode", () => {
//     // Arrange: render PatientRecordUpdateForm with open=true, isAdding=false, editRecord=someRecord
//     // Act: click the overlay backdrop
//     // Assert: expect(onOpenChange).toHaveBeenCalledWith(false)
//   });
//
//   test("ESC key closes the dialog", () => {
//     // Arrange: render PatientRecordUpdateForm with open=true
//     // Act: fireEvent.keyDown(dialogContent, { key: 'Escape' })
//     // Assert: expect(onOpenChange).toHaveBeenCalledWith(false)
//   });
//
//   test("X button is not rendered while saving", () => {
//     // Arrange: render PatientRecordUpdateForm, trigger save (fill form + click Save)
//     // Act: wait for saving state
//     // Assert: expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
//   });
// });
//
// describe("Add Mode Form Fields", () => {
//   test("Add GP mode shows all GP form fields", () => {
//     // Arrange: render with isAdding=true, defaultCategory=RecordCategory.GP
//     // Assert: expect(screen.getByLabelText(/patient id/i)).toBeInTheDocument()
//     //         expect(screen.getByLabelText(/diagnosis/i)).toBeInTheDocument()
//     //         expect(screen.getByLabelText(/total cost/i)).toBeInTheDocument()
//   });
//
//   test("Add Case mode shows case-specific fields", () => {
//     // Arrange: render with isAdding=true, defaultCategory=RecordCategory.CASE
//     // Assert: expect(screen.getByLabelText(/case type/i)).toBeInTheDocument()
//     //         expect(screen.getByLabelText(/tooth/i)).toBeInTheDocument()
//     //         expect(screen.getByLabelText(/lab name/i)).toBeInTheDocument()
//   });
//
//   test("Add mode does NOT show lookup search input", () => {
//     // Arrange: render with isAdding=true
//     // Assert: expect(screen.queryByPlaceholderText(/0001\/26/i)).not.toBeInTheDocument()
//   });
//
//   test("Edit mode with null record shows lookup input", () => {
//     // Arrange: render with isAdding=false, editRecord=null
//     // Assert: expect(screen.getByPlaceholderText(/0001\/26/i)).toBeInTheDocument()
//     //         expect(screen.getByText(/enter the patient id/i)).toBeInTheDocument()
//   });
// });
//
// describe("Form Validation", () => {
//   test("GP form shows error when diagnosis is empty", () => {
//     // Arrange: render in add mode (isAdding=true, category=GP)
//     // Act: leave diagnosis empty, click "Add Record" button
//     // Assert: expect(screen.getByText(/diagnosis is required/i)).toBeInTheDocument()
//   });
//
//   test("GP form shows error when total cost is zero", () => {
//     // Arrange: render in add mode
//     // Act: fill totalCost with "0", click "Add Record"
//     // Assert: expect(screen.getByText(/valid cost greater than 0/i)).toBeInTheDocument()
//   });
//
//   test("Case form shows error when case type is empty", () => {
//     // Arrange: render in add mode (isAdding=true, category=CASE)
//     // Act: leave case type empty, click "Add Record"
//     // Assert: expect(screen.getByText(/case type is required/i)).toBeInTheDocument()
//   });
//
//   test("Case form shows error when paid exceeds total cost", () => {
//     // Arrange: render in add mode (CASE)
//     // Act: fill totalCost="500000", paid="600000", click "Add Record"
//     // Assert: expect(screen.getByText(/paid amount cannot exceed/i)).toBeInTheDocument()
//   });
//
//   test("Delete button only appears in edit mode with existing record", () => {
//     // Arrange: render with editRecord=someRecord (not null)
//     // Assert: expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument()
//     // Then: render with isAdding=true
//     // Assert: expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument()
//   });
//
//   test("Form resets when dialog reopens (no stale data from previous record)", () => {
//     // Arrange: render, open in edit mode with record A, close dialog
//     // Act: reopen dialog in add mode
//     // Assert: expect(nameInput).toHaveValue("")  // no leftover from record A
//   });
// });
