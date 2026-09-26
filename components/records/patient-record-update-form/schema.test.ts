// ============================================
// Unit Tests — Patient ID Format Schema
// ============================================
// Tests for the NNNN/YY input filter and validators used by
// PatientRecordUpdateForm (add form enforces current year,
// lookup accepts any year).

import { describe, test, expect } from "vitest";
import {
  filterPatientIdInput,
  isPatientIdShapeValid,
  isCurrentYearPatientIdValid,
  currentYearSuffix,
  filterAgeInput,
} from "./schema";

const currentYear = String(new Date().getFullYear()).slice(-2);

describe("filterPatientIdInput", () => {
  test("keeps digits up to four", () => {
    expect(filterPatientIdInput("")).toBe("");
    expect(filterPatientIdInput("1")).toBe("1");
    expect(filterPatientIdInput("0001")).toBe("0001");
  });

  test("strips letters and symbols", () => {
    expect(filterPatientIdInput("abc")).toBe("");
    expect(filterPatientIdInput("00a0b1!")).toBe("0001");
    expect(filterPatientIdInput("0001-26")).toBe("0001/26");
  });

  test("inserts slash after the fourth digit", () => {
    expect(filterPatientIdInput("00012")).toBe("0001/2");
    expect(filterPatientIdInput("0001/26")).toBe("0001/26");
  });

  test("caps at four digits plus two-digit year", () => {
    expect(filterPatientIdInput("000126789")).toBe("0001/26");
    expect(filterPatientIdInput("1234567890")).toBe("1234/56");
  });

  test("removes slash when user backspaces over it", () => {
    expect(filterPatientIdInput("0001/")).toBe("0001");
  });
});

describe("isPatientIdShapeValid", () => {
  test("accepts any two-digit year", () => {
    expect(isPatientIdShapeValid("0001/26")).toBe(true);
    expect(isPatientIdShapeValid("0042/25")).toBe(true);
    expect(isPatientIdShapeValid("9999/99")).toBe(true);
  });

  test("rejects 0000 sequence", () => {
    expect(isPatientIdShapeValid("0000/26")).toBe(false);
  });

  test("rejects malformed values", () => {
    expect(isPatientIdShapeValid("")).toBe(false);
    expect(isPatientIdShapeValid("1/26")).toBe(false);
    expect(isPatientIdShapeValid("0001")).toBe(false);
    expect(isPatientIdShapeValid("0001/2")).toBe(false);
    expect(isPatientIdShapeValid("10000/26")).toBe(false);
    expect(isPatientIdShapeValid("0001-26")).toBe(false);
    expect(isPatientIdShapeValid("abcd/26")).toBe(false);
  });
});

describe("isCurrentYearPatientIdValid", () => {
  test("accepts current-year IDs", () => {
    expect(isCurrentYearPatientIdValid(`0001/${currentYear}`)).toBe(true);
    expect(isCurrentYearPatientIdValid(`9999/${currentYear}`)).toBe(true);
  });

  test("rejects other years", () => {
    const lastYear = String(Number(currentYear) - 1).padStart(2, "0");
    expect(isCurrentYearPatientIdValid(`0001/${lastYear}`)).toBe(false);
  });

  test("rejects invalid shape", () => {
    expect(isCurrentYearPatientIdValid(`0000/${currentYear}`)).toBe(false);
    expect(isCurrentYearPatientIdValid("0001")).toBe(false);
  });
});

describe("currentYearSuffix", () => {
  test("matches system clock", () => {
    expect(currentYearSuffix()).toBe(
      String(new Date().getFullYear()).slice(-2)
    );
  });
});

describe("filterAgeInput", () => {
  test("keeps digits up to two characters", () => {
    expect(filterAgeInput("")).toBe("");
    expect(filterAgeInput("3")).toBe("3");
    expect(filterAgeInput("30")).toBe("30");
    expect(filterAgeInput("1234")).toBe("12");
  });

  test("blocks negative signs, decimals, and letters", () => {
    expect(filterAgeInput("-5")).toBe("5");
    expect(filterAgeInput("12.5")).toBe("12");
    expect(filterAgeInput("1e5")).toBe("15");
    expect(filterAgeInput("abc")).toBe("");
  });
});
