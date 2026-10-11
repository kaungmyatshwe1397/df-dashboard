// Record dates use local calendar values so timezone offsets cannot move a visit into another month.

/** Formats a local calendar date without converting it to a UTC timestamp. */
export function getLocalDate(date: Date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Returns a user-facing error for missing, invalid, or future record dates. */
export function getRecordDateError(value: string, today: string = getLocalDate()): string | undefined {
  if (!value) return "Record date is required.";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "Enter a valid record date.";

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]) {
    return "Enter a valid record date.";
  }
  if (value > today) return "Record date cannot be in the future.";
  return undefined;
}
