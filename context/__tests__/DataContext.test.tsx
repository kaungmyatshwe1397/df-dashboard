// ============================================
// Component Tests — DataContext
// ============================================
// Tests for payment logic: addPayment syncs record totals,
// getRecordBalance, getRecordTotalPaid.

import { describe, test, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { DataProvider, useData } from "../DataContext";
import { PaymentStatus } from "@/lib/global";

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

describe("DataContext — Payment Logic", () => {
  describe("addPayment", () => {
    test("adds a payment and updates record paid/remaining", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const caseRecord = result.current.records.find(
        (r) => r.id === "rec-003"
      );
      expect(caseRecord).toBeDefined();

      const previousBalance = result.current.getRecordBalance(caseRecord!);
      expect(previousBalance).toBeGreaterThan(0);

      const payAmount = 50000;

      await act(async () => {
        await result.current.addPayment({
          record_id: caseRecord!.id,
          paid_amount: payAmount,
          payment_note: "Test installment",
          payment_status: PaymentStatus.PAID,
        });
      });

      const newBalance = result.current.getRecordBalance(caseRecord!);
      expect(newBalance).toBe(previousBalance - payAmount);
    });

    test("sets payment status to COMPLETED when fully paid", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const caseRecord = result.current.records.find(
        (r) => r.id === "rec-003"
      );
      expect(caseRecord).toBeDefined();

      const remaining = result.current.getRecordBalance(caseRecord!);
      expect(remaining).toBeGreaterThan(0);

      await act(async () => {
        await result.current.addPayment({
          record_id: caseRecord!.id,
          paid_amount: remaining,
          payment_note: "Final payment",
          payment_status: PaymentStatus.PAID,
        });
      });

      const newBalance = result.current.getRecordBalance(caseRecord!);
      expect(newBalance).toBe(0);
    });

    test("creates payment record with correct fields", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const caseRecord = result.current.records.find(
        (r) => r.id === "rec-003"
      );
      expect(caseRecord).toBeDefined();

      const paymentsBefore = result.current.getPaymentsForRecord(caseRecord!.id).length;

      await act(async () => {
        await result.current.addPayment({
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
    test("returns remaining balance for unpaid record", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const record = result.current.records.find((r) => r.id === "rec-003");
      expect(record).toBeDefined();

      const balance = result.current.getRecordBalance(record!);
      expect(balance).toBe(300000);
    });

    test("returns zero for fully paid record", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const record = result.current.records.find((r) => r.id === "rec-002");
      expect(record).toBeDefined();

      const balance = result.current.getRecordBalance(record!);
      expect(balance).toBe(0);
    });
  });

  describe("getRecordTotalPaid", () => {
    test("returns sum of all payments for a record", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const totalPaid = result.current.getRecordTotalPaid("rec-002");
      expect(totalPaid).toBe(250000);
    });

    test("returns 0 for record with no payments", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const totalPaid = result.current.getRecordTotalPaid("rec-001");
      expect(totalPaid).toBe(0);
    });
  });
});
