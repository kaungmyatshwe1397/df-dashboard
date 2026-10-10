// Mobile record interactions must preserve the existing identity, payment, and permission behavior.

import { afterEach, describe, test, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MobileRecordCard } from "@/components/records/record-table/mobileRecordCard";
import { RecordCategory, PaymentStatus, type CasePatientRecordType } from "@/lib/global";

const record: CasePatientRecordType = {
  id: "case-1", cycle_id: "cycle-1", patient_id: "0001/26",
  entry_date: "2026-10-01", patient_name: "Patient One",
  category: RecordCategory.CASE, diagnosis: "Crown treatment",
  total_cost: 200000, month_label: "Oct 2026", lab_name: "Lab One",
  lab_fee: 999999, is_carried_forward: true,
};

afterEach(cleanup);

describe("MobileRecordCard", () => {
  test("shows case identity and payment context without exposing lab fees", () => {
    render(<MobileRecordCard record={record} totalPaid={50000} remaining={150000} />);
    expect(screen.getByText("Patient One")).toBeInTheDocument();
    expect(screen.getByText("0001/26")).toBeInTheDocument();
    expect(screen.getByText("Crown treatment")).toBeInTheDocument();
    expect(screen.getByText("150,000")).toBeInTheDocument();
    expect(screen.getByText("Carried forward")).toBeInTheDocument();
    expect(screen.queryByText("999,999")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit|record payment/i })).not.toBeInTheDocument();
  });

  test("routes edit and payment actions to the selected record", () => {
    const onEdit = vi.fn();
    const onPay = vi.fn();
    render(<MobileRecordCard record={record} remaining={150000} onEdit={onEdit} onPay={onPay} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit record" }));
    fireEvent.click(screen.getByRole("button", { name: "Record payment" }));
    expect(onEdit).toHaveBeenCalledWith(record);
    expect(onPay).toHaveBeenCalledWith(record);
  });

  test("shows controlled payment history and supports expansion", () => {
    const onToggleHistory = vi.fn();
    const props = { record, remaining: 150000, onToggleHistory, payments: [{
      id: "pay-1", record_id: record.id, payment_date: "2026-10-02",
      paid_amount: 50000, payment_note: "First installment", payment_status: PaymentStatus.PAID,
    }] };
    const { rerender } = render(<MobileRecordCard {...props} />);
    expect(screen.queryByText("First installment")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Payment history" }));
    expect(onToggleHistory).toHaveBeenCalledWith(record.id);
    rerender(<MobileRecordCard {...props} expanded />);
    expect(screen.getByText("First installment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Payment history" })).toHaveAttribute("aria-expanded", "true");
  });

  test("settled cases hide payment creation", () => {
    render(<MobileRecordCard record={record} remaining={0} onPay={vi.fn()} />);
    expect(screen.getByText("Payment Complete")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record payment" })).not.toBeInTheDocument();
  });

  test("GP cards show cost and omit case-specific payment details", () => {
    render(<MobileRecordCard record={{ ...record, category: RecordCategory.GP }} />);
    expect(screen.getByText("200,000")).toBeInTheDocument();
    expect(screen.queryByText("Remaining")).not.toBeInTheDocument();
    expect(screen.queryByText("Lab One")).not.toBeInTheDocument();
  });
});
