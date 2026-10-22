// Calendar-only dates keep record months stable across timezone boundaries.

import { describe, expect, test } from "vitest";
import { getLocalDate, getRecordDateError } from "@/lib/record-date";

describe("record dates", () => {
  test("formats local calendar parts without converting to UTC", () => {
    const localDate = {
      getFullYear: () => 2026,
      getMonth: () => 8,
      getDate: () => 1,
      toISOString: () => { throw new Error("UTC conversion is forbidden"); },
    } as unknown as Date;
    expect(getLocalDate(localDate)).toBe("2026-09-01");
  });

  test.each(["2026-08-31", "2026-09-15", "2024-02-29", "2000-02-29"])(
    "accepts past or present calendar date %s",
    (date) => expect(getRecordDateError(date, "2026-09-15")).toBeUndefined()
  );

  test("requires a date", () => {
    expect(getRecordDateError("", "2026-09-15")).toBe("Record date is required.");
  });

  test.each(["2026-09-16", "2027-01-01"])("rejects future date %s", (date) => {
    expect(getRecordDateError(date, "2026-09-15")).toBe("Record date cannot be in the future.");
  });

  test.each(["2026-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-09-00", "0000-01-01", "26-09-01", "2026-09-01T00:00:00Z"])(
    "rejects invalid calendar date %s",
    (date) => expect(getRecordDateError(date, "2026-09-15")).toBe("Enter a valid record date.")
  );
});
