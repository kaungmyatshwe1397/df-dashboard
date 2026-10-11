# Backdated Record Entry Design

## Goal

Let Admins and Assistants add or edit a GP or CASE record with its actual record date, including dates from earlier months. The chosen date determines which monthly record cycle contains the record. Today remains the default for new records.

## Context

- The shared patient record form has separate add and edit flows for GP and CASE records.
- New records currently receive today's date and the current month's cycle in `DataContext.addRecord()`.
- `patient_records` already stores `entry_date`, `cycle_id`, and `month_label`; month views filter by `month_label`.
- Monthly revenue attributes CASE payments to their parent record's month. Each payment also stores its own `payment_date` for history.
- CASE records already have separate Lab Send Date and Delivery Date fields. Those dates describe lab milestones, not the treatment record date.

## Approved Design

### Record date field

- Add a required **Record Date** field to both add and edit modes of the shared record form.
- Use a date-only `YYYY-MM-DD` value and avoid timezone conversion when defaulting or saving the date.
- In add mode, default the field to the local current date. Show it only after the patient has been confirmed in the registry, before the category-specific GP or CASE fields.
- In edit mode, prefill it from the record's existing `entry_date` and place it before the category-specific fields.
- Allow dates in the past through today. Do not allow a future date.
- Keep Lab Send Date and Delivery Date independent; changing Record Date does not change either value.
- Disable the field while saving. If saving fails, keep the selected date and the rest of the form values visible.

### Add behavior

When saving a new record, derive its calendar month from Record Date and use that month to find or create the corresponding `monthly_cycles` row. Store:

- the selected date in `patient_records.entry_date`;
- the selected month cycle ID in `patient_records.cycle_id`;
- the matching display label in `patient_records.month_label`.

After successful creation, switch the active record view to that month so the new record is visible. Do not use the current month unless it is the month selected in Record Date.

For a CASE record with an initial paid amount greater than zero, create the initial `case_payments` row with `payment_date` equal to Record Date. The existing separate installment payment flow continues to use its entered transaction date.

### Edit behavior

When an existing record's Record Date changes, derive or create the destination month cycle, then update `entry_date`, `cycle_id`, and `month_label` together. After the save succeeds, switch the active view to the destination month. Reuse the existing cycle for that month when one is already present.

Do not rewrite existing `case_payments.payment_date` values when a CASE record moves. Payment history keeps the dates on which each installment was recorded; monthly CASE payment totals continue to follow the parent record's cycle, matching the current aggregation model.

### Data and permissions

- No database column or migration is required; use the existing record date and cycle fields.
- The form remains available to the same Admin and Assistant roles as the existing add/edit record actions.
- Patient registry requirements, record categories, and save/delete permissions do not change.
- On a cycle creation or record save failure, keep the dialog open, show a human-readable error, and preserve the selected date and entered values.

## Acceptance Criteria

1. Add mode for both GP and CASE records shows a required Record Date field after patient verification.
2. A new record defaults to today's local date; past dates are selectable and future dates are rejected.
3. A new record is stored in the cycle and month label matching its selected Record Date and becomes visible after save.
4. A CASE record's initial payment is dated with the selected Record Date; later installments retain the date entered in the payment flow.
5. Edit mode shows the stored Record Date. Changing it to another month moves the record to that month and selects that month after save.
6. Moving a CASE record leaves all existing installment `payment_date` values unchanged while monthly totals follow the record's new cycle.
7. Lab Send Date and Delivery Date remain unchanged when Record Date is changed.
8. Failed cycle creation or record save leaves the form open with the selected date and entered values intact.

## Test Coverage To Add During Implementation

- Component coverage for add-mode local-today default, required validation, past-date selection, future-date rejection, and date persistence after a failed save.
- Component coverage for edit-mode date prefill and changing the date to another month.
- DataContext coverage for reusing and creating the month cycle from a selected date, storing matching `entry_date`/`cycle_id`/`month_label`, and selecting the destination month after save.
- CASE coverage for initial payment date matching the selected Record Date, and for preserving existing payment dates when moving a record across months.
- Regression coverage confirming Lab Send Date and Delivery Date remain independent from Record Date.

## Out of Scope

- Editing the transaction dates of existing installment payments.
- Changing the separate Record Payment dialog or the month attribution model for CASE payments.
- Scheduling records in the future.
- Adding a new date column or changing patient registration dates.

## Review Note

Monthly CASE totals are attributed to the parent record's month, while daily chart points use each payment's day-of-month. If a record is moved across months while its existing payments keep their original dates, the daily chart can place those payments on the same day number in the record month. Changing that chart/reporting model is outside this feature and should be reviewed separately.
