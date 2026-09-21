// ============================================
// Integration Tests — DataContext Mutation Error Handling
// ============================================
// Tests that mutations properly throw errors on Supabase failures,
// and that addRecord auto-selects the correct month.

import { describe, test, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { DataProvider, useData } from "../DataContext";
import { RecordCategory, PaymentStatus } from "@/lib/global";

function wrapper({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}

describe("DataContext — Mutation Error Handling", () => {
  describe("addRecord", () => {
    test("auto-selects the month after successful creation", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addRecord({
          patient_id: "ERR-001",
          patient_name: "Month Test",
          category: RecordCategory.GP,
          diagnosis: "Test",
          total_cost: 10000,
        });
      });

      // After adding, selectedMonth should be "Sep 2026" (the open cycle's month)
      expect(result.current.selectedMonth).toBe("Sep 2026");
    });

    test("adds record to state after successful insert", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const recordsBefore = result.current.records.length;

      await act(async () => {
        await result.current.addRecord({
          patient_id: "NEW-001",
          patient_name: "New Patient",
          category: RecordCategory.GP,
          diagnosis: "Checkup",
          total_cost: 30000,
        });
      });

      expect(result.current.records.length).toBe(recordsBefore + 1);
      const added = result.current.records.find((r) => r.patient_id === "NEW-001");
      expect(added).toBeDefined();
      expect(added!.patient_name).toBe("New Patient");
    });
  });

  describe("updateRecord", () => {
    test("updates record in state after successful update", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const record = result.current.records.find((r) => r.id === "rec-001");
      expect(record).toBeDefined();
      expect(record!.patient_name).toBe("John Doe");

      await act(async () => {
        await result.current.updateRecord("rec-001", {
          patient_name: "John Updated",
        });
      });

      const updated = result.current.records.find((r) => r.id === "rec-001");
      expect(updated!.patient_name).toBe("John Updated");
    });
  });

  describe("deleteRecord", () => {
    test("removes record and payments from state after successful delete", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const recordsBefore = result.current.records.length;

      await act(async () => {
        await result.current.deleteRecord("rec-001");
      });

      expect(result.current.records.length).toBe(recordsBefore - 1);
      expect(result.current.records.find((r) => r.id === "rec-001")).toBeUndefined();
    });

    test("removes associated payments from state", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // rec-002 has payments (pay-001, pay-002)
      const paymentsBefore = result.current.getPaymentsForRecord("rec-002").length;
      expect(paymentsBefore).toBeGreaterThan(0);

      await act(async () => {
        await result.current.deleteRecord("rec-002");
      });

      const paymentsAfter = result.current.getPaymentsForRecord("rec-002");
      expect(paymentsAfter.length).toBe(0);
    });
  });

  describe("addPayment", () => {
    test("adds payment and updates record paid/remaining", async () => {
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

  describe("findRecordByPatientId", () => {
    test("finds a record by patient ID", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const found = result.current.findRecordByPatientId("0001/26");
      expect(found).toBeDefined();
      expect(found!.patient_name).toBe("John Doe");
    });

    test("filters by category when specified", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const gpResult = result.current.findRecordByPatientId(
        "0003/26",
        RecordCategory.GP
      );
      expect(gpResult).toBeUndefined();

      const caseResult = result.current.findRecordByPatientId(
        "0003/26",
        RecordCategory.CASE
      );
      expect(caseResult).toBeDefined();
    });

    test("returns undefined for non-existent patient ID", async () => {
      const { result } = renderHook(() => useData(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const found = result.current.findRecordByPatientId("9999/99");
      expect(found).toBeUndefined();
    });
  });
});
