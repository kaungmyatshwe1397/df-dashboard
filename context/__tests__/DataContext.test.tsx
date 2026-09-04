// ============================================
// Component Tests — DataContext
// ============================================
// Tests for payment logic: addPayment syncs record totals,
// getRecordBalance, getRecordTotalPaid.

import { describe, test, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { DataProvider, useData } from "../DataContext";
import { PaymentStatus } from "@/lib/global";

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

describe("DataContext — Payment Logic", () => {
  describe("addPayment", () => {
    test("adds a payment and updates record paid/remaining", () => {
      const { result } = renderHook(() => useData(), { wrapper });

      // Use rec-003 (Robert Johnson) — partial payment, remaining > 0
      const caseRecord = result.current.records.find(
        (r) => r.id === "rec-003"
      );
      expect(caseRecord).toBeDefined();

      const previousBalance = result.current.getRecordBalance(caseRecord!);
      expect(previousBalance).toBeGreaterThan(0);

      const payAmount = 50000;

      act(() => {
        result.current.addPayment({
          record_id: caseRecord!.id,
          paid_amount: payAmount,
          payment_note: "Test installment",
          payment_status: PaymentStatus.PAID,
        });
      });

      // Balance should decrease
      const newBalance = result.current.getRecordBalance(caseRecord!);
      expect(newBalance).toBe(previousBalance - payAmount);
    });

    test("sets payment status to COMPLETED when fully paid", () => {
      const { result } = renderHook(() => useData(), { wrapper });

      // Find rec-003 (Robert Johnson) — partial payment (200000 of 500000)
      const caseRecord = result.current.records.find(
        (r) => r.id === "rec-003"
      );
      expect(caseRecord).toBeDefined();

      const remaining = result.current.getRecordBalance(caseRecord!);
      expect(remaining).toBeGreaterThan(0);

      act(() => {
        result.current.addPayment({
          record_id: caseRecord!.id,
          paid_amount: remaining,
          payment_note: "Final payment",
          payment_status: PaymentStatus.PAID,
        });
      });

      const newBalance = result.current.getRecordBalance(caseRecord!);
      expect(newBalance).toBe(0);
    });

    test("creates payment record with correct fields", () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const caseRecord = result.current.records.find(
        (r) => r.id === "rec-003"
      );
      expect(caseRecord).toBeDefined();

      const paymentsBefore = result.current.getPaymentsForRecord(caseRecord!.id).length;

      act(() => {
        result.current.addPayment({
          record_id: caseRecord!.id,
          paid_amount: 25000,
          payment_note: "Note test",
          payment_status: PaymentStatus.UNPAID,
        });
      });

      const paymentsAfter = result.current.getPaymentsForRecord(caseRecord!.id);
      expect(paymentsAfter.length).toBe(paymentsBefore + 1);

      const newPayment = paymentsAfter[paymentsAfter.length - 1];
      expect(newPayment.paid_amount).toBe(25000);
      expect(newPayment.payment_note).toBe("Note test");
      expect(newPayment.record_id).toBe(caseRecord!.id);
    });
  });

  describe("getRecordBalance", () => {
    test("returns remaining balance for unpaid record", () => {
      const { result } = renderHook(() => useData(), { wrapper });
      const record = result.current.records.find((r) => r.id === "rec-003");
      expect(record).toBeDefined();

      const balance = result.current.getRecordBalance(record!);
      // rec-003: total_cost=500000, paid=200000 → balance=300000
      expect(balance).toBe(300000);
    });

    test("returns zero for fully paid record", () => {
      const { result } = renderHook(() => useData(), { wrapper });
      const record = result.current.records.find((r) => r.id === "rec-002");
      expect(record).toBeDefined();

      const balance = result.current.getRecordBalance(record!);
      // rec-002: total_cost=250000, paid=150000+100000=250000 → balance=0
      expect(balance).toBe(0);
    });
  });

  describe("getRecordTotalPaid", () => {
    test("returns sum of all payments for a record", () => {
      const { result } = renderHook(() => useData(), { wrapper });
      // rec-002 has 2 payments: 150000 + 100000 = 250000
      const totalPaid = result.current.getRecordTotalPaid("rec-002");
      expect(totalPaid).toBe(250000);
    });

    test("returns 0 for record with no payments", () => {
      const { result } = renderHook(() => useData(), { wrapper });
      // rec-001 is a GP record with no payments
      const totalPaid = result.current.getRecordTotalPaid("rec-001");
      expect(totalPaid).toBe(0);
    });
  });
});
