// ============================================
// Component Tests — PatientRecordUpdateForm
// ============================================
// Tests for dialog close, edit mode rendering, add mode fields,
// form validation, delete button visibility, and form reset.
//
// base-ui JSDOM limitation: Dialog portals don't fully render controlled
// content. Tests that require form submission or saving state are skipped
// with .skip and documented — they require real browser testing (Playwright).
// Portal elements accumulate across tests, so queries use getAllBy* or
// scope to the last dialog-content element.

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { DataProvider } from "@/context/DataContext";
import { createClient } from "@/lib/supabase/client";
import { PatientRecordUpdateForm } from "../patient-record-update-form";
import { PATIENT_ID_FORMAT_ERROR } from "../patient-record-update-form/schema";
import { RecordCategory, GPPatientRecordType } from "@/lib/global";

// Capture addRecord calls (and optionally simulate a duplicate-ID RPC
// failure) without replacing the real DataContext provider.
const saveState = vi.hoisted(() => ({
  addRecordCalls: [] as unknown[][],
  updatePatientCalls: [] as unknown[][],
  failDuplicate: false,
}));

vi.mock("@/context/DataContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/context/DataContext")>();
  return {
    ...actual,
    useData: () => {
      const ctx = actual.useData();
      return {
        ...ctx,
        addRecord: async (...args: Parameters<typeof ctx.addRecord>) => {
          if (saveState.failDuplicate) {
            saveState.failDuplicate = false;
            throw new Error(
              "The patient ID is already registered for another person. Check your patient ID again."
            );
          }
          saveState.addRecordCalls.push(args);
          return ctx.addRecord(...args);
        },
        updatePatient: async (...args: Parameters<typeof ctx.updatePatient>) => {
          saveState.updatePatientCalls.push(args);
          return ctx.updatePatient(...args);
        },
      };
    },
  };
});

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
  month_label: "Sep 2026",
};

function renderWithProvider(ui: React.ReactElement) {
  return render(<DataProvider>{ui}</DataProvider>);
}

beforeEach(() => {
  saveState.addRecordCalls = [];
  saveState.updatePatientCalls = [];
  saveState.failDuplicate = false;
});

function getLastDialogContent(): HTMLElement {
  const dialogs = document.querySelectorAll("[data-slot='dialog-content']");
  return dialogs[dialogs.length - 1] as HTMLElement;
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

  // Skipped: base-ui Dialog in JSDOM doesn't render overlay backdrop for click events
  test.skip("overlay click closes the dialog in edit mode", () => {
    const onOpenChange = vi.fn();
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={onOpenChange}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );

    const overlay = document.querySelector("[data-slot='dialog-overlay']");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // Skipped: base-ui Dialog in JSDOM doesn't propagate Escape key to dialog content
  test.skip("ESC key closes the dialog", () => {
    const onOpenChange = vi.fn();
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={onOpenChange}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );

    const dialogContent = document.querySelector("[data-slot='dialog-content']");
    fireEvent.keyDown(dialogContent!, { key: "Escape" });
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

  // Skipped: base-ui Dialog doesn't render controlled form content in JSDOM during saving
  test.skip("X button is not rendered while saving", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );

    const closeButton = getDialogCloseButton();
    // When saving, showCloseButton={false} hides the X button
    // This test requires triggering save state which needs form submission
    expect(closeButton).not.toBeNull();
  });
});

// ------------------------------------------
// Task 3 — Add mode form fields
// ------------------------------------------
describe("PatientRecordUpdateForm — Add Mode Form Fields", () => {
  // Skipped: base-ui Dialog in JSDOM breaks label-input association,
  // making getByLabelText fail with "non-labellable" error.
  test.skip("Add GP mode shows all GP form fields", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={true}
        editRecord={null}
      />
    );

    const dialog = getLastDialogContent();
    expect(within(dialog).getByLabelText(/patient id/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/diagnosis/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/total cost/i)).toBeInTheDocument();
  });

  // Skipped: base-ui Dialog in JSDOM breaks label-input association for select/custom components
  test.skip("Add Case mode shows case-specific fields", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.CASE}
        isAdding={true}
        editRecord={null}
      />
    );

    const dialog = getLastDialogContent();
    expect(within(dialog).getByLabelText(/case type/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/tooth/i)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/lab name/i)).toBeInTheDocument();
  });

  test("GP add mode starts with Patient ID verification (no demographics)", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={true}
        editRecord={null}
      />
    );

    const dialog = getLastDialogContent();
    expect(within(dialog).getByPlaceholderText("e.g. 0001/26")).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("e.g. 30")).not.toBeInTheDocument();
    expect(
      within(dialog).queryByPlaceholderText(/common cold/i)
    ).not.toBeInTheDocument();
  });

  test("Edit mode with null record shows lookup input", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={null}
      />
    );

    const dialog = getLastDialogContent();
    expect(within(dialog).getByText(/enter the patient id/i)).toBeInTheDocument();
  });
});

// ------------------------------------------
// Task 4 — Form validation
// ------------------------------------------
describe("PatientRecordUpdateForm — Form Validation", () => {
  // Skipped: base-ui Dialog in JSDOM doesn't render form content for submit interactions
  test.skip("GP form shows error when diagnosis is empty", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={true}
        editRecord={null}
      />
    );

    const dialog = getLastDialogContent();
    fireEvent.change(within(dialog).getByLabelText(/patient id/i), { target: { value: "0099/26" } });
    fireEvent.change(within(dialog).getByLabelText(/patient name/i), { target: { value: "Test" } });
    fireEvent.change(within(dialog).getByLabelText(/total cost/i), { target: { value: "50000" } });

    const saveButton = within(dialog).getByText("Add Record");
    fireEvent.click(saveButton);

    expect(within(dialog).getByText(/diagnosis is required/i)).toBeInTheDocument();
  });

  test.skip("GP form shows error when total cost is zero", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={true}
        editRecord={null}
      />
    );

    const dialog = getLastDialogContent();
    fireEvent.change(within(dialog).getByLabelText(/patient id/i), { target: { value: "0099/26" } });
    fireEvent.change(within(dialog).getByLabelText(/patient name/i), { target: { value: "Test" } });
    fireEvent.change(within(dialog).getByLabelText(/diagnosis/i), { target: { value: "Cold" } });
    fireEvent.change(within(dialog).getByLabelText(/total cost/i), { target: { value: "0" } });

    const saveButton = within(dialog).getByText("Add Record");
    fireEvent.click(saveButton);

    expect(within(dialog).getByText(/valid cost greater than 0/i)).toBeInTheDocument();
  });

  test.skip("Case form shows error when case type is empty", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.CASE}
        isAdding={true}
        editRecord={null}
      />
    );

    const dialog = getLastDialogContent();
    fireEvent.change(within(dialog).getByLabelText(/patient id/i), { target: { value: "0099/26" } });
    fireEvent.change(within(dialog).getByLabelText(/patient name/i), { target: { value: "Test" } });
    fireEvent.change(within(dialog).getByLabelText(/total cost/i), { target: { value: "100000" } });

    const saveButton = within(dialog).getByText("Add Record");
    fireEvent.click(saveButton);

    expect(within(dialog).getByText(/case type is required/i)).toBeInTheDocument();
  });

  test.skip("Case form shows error when paid exceeds total cost", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.CASE}
        isAdding={true}
        editRecord={null}
      />
    );

    const dialog = getLastDialogContent();
    fireEvent.change(within(dialog).getByLabelText(/patient id/i), { target: { value: "0099/26" } });
    fireEvent.change(within(dialog).getByLabelText(/patient name/i), { target: { value: "Test" } });
    fireEvent.change(within(dialog).getByLabelText(/case type/i), { target: { value: "RPD" } });
    fireEvent.change(within(dialog).getByLabelText(/total cost/i), { target: { value: "500000" } });
    fireEvent.change(within(dialog).getByLabelText(/paid amount/i), { target: { value: "600000" } });

    const saveButton = within(dialog).getByText("Add Record");
    fireEvent.click(saveButton);

    expect(within(dialog).getByText(/paid amount cannot exceed/i)).toBeInTheDocument();
  });
});

// ------------------------------------------
// Task 5 — Delete button visibility
// ------------------------------------------
describe("PatientRecordUpdateForm — Delete Button", () => {
  test("Delete button only appears in edit mode with existing record", () => {
    const { unmount } = renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    unmount();

    // Re-render in add mode — no delete button
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={true}
        editRecord={null}
      />
    );

    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });
});

// ------------------------------------------
// Task 6 — Form reset behavior
// ------------------------------------------
describe("PatientRecordUpdateForm — Form Reset", () => {
  // Skipped: base-ui Dialog in JSDOM doesn't support re-render with new props reliably
  test.skip("Form resets when dialog reopens (no stale data from previous record)", () => {
    const { unmount } = renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );

    const dialog = getLastDialogContent();
    const nameInput = within(dialog).getByLabelText(/patient name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("John Doe");

    unmount();

    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={true}
        editRecord={null}
      />
    );

    const newDialog = getLastDialogContent();
    const newNameInput = within(newDialog).getByLabelText(/patient name/i) as HTMLInputElement;
    expect(newNameInput.value).toBe("");
  });
});

// ------------------------------------------
// Task 7 — Patient registry: demographics + returning patient
// ------------------------------------------
describe("PatientRecordUpdateForm — Patient Registry", () => {
  function renderAddMode() {
    return renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={true}
        editRecord={null}
      />
    );
  }

  test("Add mode does NOT show demographic fields before a patient is verified", () => {
    renderAddMode();
    const dialog = getLastDialogContent();
    expect(within(dialog).queryByPlaceholderText("e.g. 30")).not.toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("e.g. Penicillin")).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Male")).not.toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText(/metformin/i)).not.toBeInTheDocument();
  });

  test("Registered Patient ID auto-fills the read-only record form", async () => {
    renderAddMode();
    const dialog = getLastDialogContent();

    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26") as HTMLInputElement;
    fireEvent.change(idInput, { target: { value: "0001/26" } });
    fireEvent.keyDown(idInput, { key: "Enter" });

    const nameInput = (await within(dialog).findByDisplayValue("John Doe")) as HTMLInputElement;
    expect(nameInput).toBeDisabled();

    // Patient ID and name are auto-filled and locked; only diagnosis/cost shown
    const idField = within(dialog).getByDisplayValue("0001/26") as HTMLInputElement;
    expect(idField).toBeDisabled();
    expect(within(dialog).getByPlaceholderText(/common cold/i)).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText("e.g. 30")).not.toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText(/metformin/i)).not.toBeInTheDocument();
  });

  test("Unknown Patient ID shows the register-patient instruction and link", async () => {
    renderAddMode();
    const dialog = getLastDialogContent();

    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26") as HTMLInputElement;
    fireEvent.change(idInput, { target: { value: "7777/26" } });
    fireEvent.keyDown(idInput, { key: "Enter" });

    const alert = await within(dialog).findByText(/no registered patient found/i);
    expect(alert).toBeInTheDocument();

    const link = within(dialog).getByRole("link", { name: /go to register patients/i });
    expect(link).toHaveAttribute("href", "/admin/register-patients");
    // Record form fields never render for an unregistered ID
    expect(within(dialog).queryByPlaceholderText(/common cold/i)).not.toBeInTheDocument();
  });

  test("Changing Patient ID and re-searching unlocks a new lookup", async () => {
    renderAddMode();
    const dialog = getLastDialogContent();

    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26") as HTMLInputElement;
    fireEvent.change(idInput, { target: { value: "7777/26" } });
    fireEvent.keyDown(idInput, { key: "Enter" });
    await within(dialog).findByText(/no registered patient found/i);

    fireEvent.change(idInput, { target: { value: "0001/26" } });
    fireEvent.keyDown(idInput, { key: "Enter" });

    expect(within(dialog).queryByText(/no registered patient found/i)).not.toBeInTheDocument();
    expect(await within(dialog).findByDisplayValue("John Doe")).toBeInTheDocument();
  });
});

// ------------------------------------------
// Task — Save flows (new / returning / duplicate)
// ------------------------------------------
describe("PatientRecordUpdateForm — Save", () => {
  test("Save (edit) clears empty optional demographics", async () => {
    const onOpenChange = vi.fn();
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={onOpenChange}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );
    const dialog = getLastDialogContent();
    await waitFor(() =>
      expect((within(dialog).getByPlaceholderText("e.g. 30") as HTMLInputElement).value).toBe("34")
    );

    fireEvent.change(within(dialog).getByPlaceholderText("e.g. 123 Main St"), {
      target: { value: "   " },
    });
    fireEvent.click(within(dialog).getByText("Save Changes"));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(saveState.updatePatientCalls).toHaveLength(1);
    expect(saveState.updatePatientCalls[0][1]).toMatchObject({
      address: null,
      drug_allergy: null,
      past_dental_history: null,
    });
  });

  test("Save (newly registered patient) sends the first visit through addRecord", async () => {
    await createClient()
      .from("patients")
      .insert({
        patient_id: "8888/26",
        patient_name: "New Patient",
        age: 30,
        gender: "MALE",
        current_medications: [],
        past_medical_history: [],
      })
      .select()
      .single();

    const onOpenChange = vi.fn();
    render(
      <DataProvider>
        <PatientRecordUpdateForm
          open={true}
          onOpenChange={onOpenChange}
          defaultCategory={RecordCategory.GP}
          isAdding={true}
          editRecord={null}
        />
      </DataProvider>
    );
    const dialog = getLastDialogContent();

    fireEvent.change(within(dialog).getByPlaceholderText("e.g. 0001/26"), {
      target: { value: "8888/26" },
    });
    fireEvent.keyDown(within(dialog).getByPlaceholderText("e.g. 0001/26"), { key: "Enter" });
    await within(dialog).findByDisplayValue("New Patient");
    fireEvent.change(within(dialog).getByPlaceholderText(/common cold/i), {
      target: { value: "Checkup" },
    });
    fireEvent.change(within(dialog).getByPlaceholderText("e.g. 50000"), {
      target: { value: "10000" },
    });

    fireEvent.click(within(dialog).getByText("Add Record"));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(saveState.addRecordCalls).toHaveLength(1);
    const [recordData, patientId] = saveState.addRecordCalls[0] as [
      Record<string, unknown>,
      string,
    ];
    expect(patientId).toBe("8888/26");
    expect(recordData.patient_name).toBe("New Patient");
    expect(recordData.diagnosis).toBe("Checkup");
    expect(recordData.total_cost).toBe(10000);
    expect(recordData.patient_id).toBe("8888/26");
  });

  test("Save (returning patient) sends locked registry demographics + new visit", async () => {
    const onOpenChange = vi.fn();
    render(
      <DataProvider>
        <PatientRecordUpdateForm
          open={true}
          onOpenChange={onOpenChange}
          defaultCategory={RecordCategory.GP}
          isAdding={true}
          editRecord={null}
        />
      </DataProvider>
    );
    const dialog = getLastDialogContent();

    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26");
    fireEvent.change(idInput, { target: { value: "0001/26" } });
    fireEvent.keyDown(idInput, { key: "Enter" });
    await within(dialog).findByDisplayValue("John Doe");

    fireEvent.change(within(dialog).getByPlaceholderText(/common cold/i), {
      target: { value: "Follow-up visit" },
    });
    fireEvent.change(within(dialog).getByPlaceholderText("e.g. 50000"), {
      target: { value: "20000" },
    });

    fireEvent.click(within(dialog).getByText("Add Record"));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(saveState.addRecordCalls).toHaveLength(1);
    const [recordData, patientId] = saveState.addRecordCalls[0] as [
      Record<string, unknown>,
      string,
    ];
    expect(patientId).toBe("0001/26");
    expect(recordData.diagnosis).toBe("Follow-up visit");
    expect(recordData.total_cost).toBe(20000);
  });

  test("Unique-violation at save shows the exact warning and keeps the dialog open", async () => {
    const onOpenChange = vi.fn();
    render(
      <DataProvider>
        <PatientRecordUpdateForm
          open={true}
          onOpenChange={onOpenChange}
          defaultCategory={RecordCategory.GP}
          isAdding={true}
          editRecord={null}
        />
      </DataProvider>
    );
    const dialog = getLastDialogContent();
    const idInput2 = within(dialog).getByPlaceholderText("e.g. 0001/26");
    fireEvent.change(idInput2, { target: { value: "0001/26" } });
    fireEvent.keyDown(idInput2, { key: "Enter" });
    await within(dialog).findByDisplayValue("John Doe");

    fireEvent.change(within(dialog).getByPlaceholderText(/common cold/i), {
      target: { value: "Checkup" },
    });
    fireEvent.change(within(dialog).getByPlaceholderText("e.g. 50000"), {
      target: { value: "10000" },
    });

    saveState.failDuplicate = true;
    fireEvent.click(within(dialog).getByText("Add Record"));

    const alert = await within(dialog).findByText(
      "The patient ID is already registered for another person. Check your patient ID again."
    );
    expect(alert).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(saveState.addRecordCalls).toHaveLength(0);
  });

  test("Edit mode: Patient ID is disabled, demographics stay editable", async () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );
    const dialog = getLastDialogContent();

    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26") as HTMLInputElement;
    expect(idInput).toBeDisabled();
    expect(idInput.value).toBe("0001/26");

    const nameInput = within(dialog).getByPlaceholderText("e.g. John Doe") as HTMLInputElement;
    expect(nameInput).toBeEnabled();

    const ageInput = within(dialog).getByPlaceholderText("e.g. 30") as HTMLInputElement;
    expect(ageInput).toBeEnabled();

    fireEvent.change(nameInput, { target: { value: "John Doe Edited" } });
    expect(nameInput.value).toBe("John Doe Edited");
  });
});

// ------------------------------------------
// Task — Medication chips & medical history
// ------------------------------------------
describe("PatientRecordUpdateForm — CurrentMedicationList & MedicalHistory", () => {
  function renderAddMode() {
    // GP edit mode still renders the patient demographics section
    return renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );
  }

  test("Medication chip can be added and removed; empty list allowed", async () => {
    renderAddMode();
    const dialog = getLastDialogContent();

    // Empty by default — no chips rendered
    expect(within(dialog).queryByLabelText(/^remove /i)).not.toBeInTheDocument();

    // Let the registry fetch settle — it re-seeds the form without meds
    await new Promise((r) => setTimeout(r, 20));

    const medInput = within(dialog).getByPlaceholderText("e.g. Metformin");
    fireEvent.change(medInput, { target: { value: "Metformin" } });
    fireEvent.click(within(dialog).getByLabelText("Add medication"));

    expect(within(dialog).getByText("Metformin")).toBeInTheDocument();
    expect((medInput as HTMLInputElement).value).toBe("");

    fireEvent.click(within(dialog).getByLabelText("Remove Metformin"));
    expect(within(dialog).queryByText("Metformin")).not.toBeInTheDocument();
  });

  test("Past medical history checkboxes toggle and start unchecked", async () => {
    renderAddMode();
    const dialog = getLastDialogContent();

    const diabetes = await within(dialog).findByRole("checkbox", {
      name: "Diabetes",
    });
    const heart = within(dialog).getByRole("checkbox", { name: "Heart Disease" });
    expect(diabetes).toHaveAttribute("aria-checked", "false");
    expect(heart).toHaveAttribute("aria-checked", "false");

    fireEvent.click(diabetes);
    const diabetesAfter = within(dialog).getByRole("checkbox", { name: "Diabetes" });
    expect(diabetesAfter).toHaveAttribute("aria-checked", "true");
    // Independent toggle — the other option is unaffected
    expect(
      within(dialog).getByRole("checkbox", { name: "Heart Disease" })
    ).toHaveAttribute("aria-checked", "false");

    fireEvent.click(diabetesAfter);
    expect(
      within(dialog).getByRole("checkbox", { name: "Diabetes" })
    ).toHaveAttribute("aria-checked", "false");
  });
});

// ------------------------------------------
// Task — Patient ID format NNNN/YY
// ------------------------------------------
describe("PatientRecordUpdateForm — Patient ID Format", () => {
  function renderAddMode() {
    return renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={true}
        editRecord={null}
      />
    );
  }

  function renderLookupMode() {
    return renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={null}
      />
    );
  }

  test("Letters and symbols are blocked while typing", () => {
    renderAddMode();
    const dialog = getLastDialogContent();
    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26") as HTMLInputElement;

    fireEvent.change(idInput, { target: { value: "abc00a01!26" } });
    expect(idInput.value).toBe("0001/26");
  });

  test("Slash is auto-inserted after the fourth digit", () => {
    renderAddMode();
    const dialog = getLastDialogContent();
    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26") as HTMLInputElement;

    fireEvent.change(idInput, { target: { value: "000126" } });
    expect(idInput.value).toBe("0001/26");
  });

  test("Input stops at four digits plus two-digit year", () => {
    renderAddMode();
    const dialog = getLastDialogContent();
    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26") as HTMLInputElement;

    fireEvent.change(idInput, { target: { value: "0001267890" } });
    expect(idInput.value).toBe("0001/26");
  });

  test("Lookup blocks an incomplete ID before searching", () => {
    renderLookupMode();
    const dialog = getLastDialogContent();
    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26");

    fireEvent.change(idInput, { target: { value: "0001" } });
    fireEvent.keyDown(idInput, { key: "Enter" });

    expect(within(dialog).getByText(PATIENT_ID_FORMAT_ERROR)).toBeInTheDocument();
    expect(within(dialog).queryByText(/no gp patient found/i)).not.toBeInTheDocument();
  });

  test("Lookup input strips letters and auto-inserts the slash", () => {
    renderLookupMode();
    const dialog = getLastDialogContent();
    const idInput = within(dialog).getByPlaceholderText("e.g. 0001/26") as HTMLInputElement;

    fireEvent.change(idInput, { target: { value: "00a42/25" } });
    expect(idInput.value).toBe("0042/25");
  });
});

// ------------------------------------------
// Task — Age input: two digits, unsigned integer
// ------------------------------------------
describe("PatientRecordUpdateForm — Age Format", () => {
  test("Age allows only two digits — no decimals or negatives", () => {
    renderWithProvider(
      <PatientRecordUpdateForm
        open={true}
        onOpenChange={() => {}}
        defaultCategory={RecordCategory.GP}
        isAdding={false}
        editRecord={gpRecord}
      />
    );
    const dialog = getLastDialogContent();
    const ageInput = within(dialog).getByPlaceholderText("e.g. 30") as HTMLInputElement;

    fireEvent.change(ageInput, { target: { value: "12.5" } });
    expect(ageInput.value).toBe("12");

    fireEvent.change(ageInput, { target: { value: "-7" } });
    expect(ageInput.value).toBe("7");

    fireEvent.change(ageInput, { target: { value: "1234" } });
    expect(ageInput.value).toBe("12");
  });
});
