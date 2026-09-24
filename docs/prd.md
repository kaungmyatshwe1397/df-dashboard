# Product Requirements Document (PRD)

## Dental Clinic Financial Management System (DC-FMS)

**Document Version:** 1.2 (Cycle lock/close removed — carry-forward only)
**Target Platform:** Fullstack Next.js (Vercel + Supabase)
**Date:** September 2026
**Status:** Final Approved for MVP Development

> **v1.2 change:** Month-end lock/close/purge has been removed from the product.
> Monthly cycles are passive buckets that never lock; the only month-boundary
> action is manually carrying forward unsettled case balances.

---

## 1. Executive Summary & Goals

### 1.1 Problem Statement

Currently, the dental clinic records patient treatments, diagnoses, and monetary receipts manually in a physical paper logbook. The clinic assistant photographs the book daily and transmits it via a Viber messaging group. At month-end, the clinic owner (admin) manually transcribes figures from photos to calculate doctor commissions, lab fees, overhead expenses, and net profit. This workflow is labor-intensive, error-prone, and exposes sensitive operational financials to clinic staff.

### 1.2 Technical Vision & Architecture

The system is architected as a modern Full-Stack Next.js application deployed seamlessly on Vercel Serverless infrastructure, backed by Supabase Managed PostgreSQL. It eliminates standalone backend servers by utilizing Next.js Server Actions and Route Handlers for business logic, and Supabase Row-Level Security (RLS) for ironclad permission boundaries between Staff and Admin tiers.

### 1.3 Core Objectives

- Eliminate physical logbook re-entry and fragmented chat communications.
- Enforce strict separation of operational data entry from clinic financial intelligence.
- **Multi-Session Case Lifecycle:** Carry forward active, unpaid case balances across monthly boundaries without manual data duplication.

---

## 2. User Roles & Permissions

The system enforces a dual-role access control architecture to ensure operational security and complete financial privacy.

| System Module / Feature | Assistant Role | Admin Role (Owner) |
|---|---|---|
| Daily Patient Data Entry | Create & View current active month entries | Full Access (Create, Read, Update, Delete) |
| Data Modification / Editing | Editable while the month is active | Unrestricted edit/override capabilities |
| Installment & Balance Tracking | Input paid amounts; view real-time remaining balance | Full visibility across current and rolled-over cases |
| Financial Dashboard & Totals | Strictly Hidden (No Access) | Full visibility (Gross Income, Profit/Loss) |
| Lab Fee Input & Assignment | Strictly Hidden (No Access) | Filter active cases; assign specific lab costs |
| Monthly Overhead & Expenses | Input single general expense (if granted) | Manage salaries, bonuses, rent, and utilities |
| Carry Forward | Strictly Hidden (No Access) | Move unsettled case balances into the next month |

---

## 3. Core Business Logic & Financial Formulas

### 3.1 Revenue Streams & Payment Splitting

1. **General Practice (GP):** Single-session procedures (scaling, simple extractions). Full treatment cost is collected and recognized as income on the service date.
2. **Dental Cases (Case):** Multi-stage treatments (crowns, root canals, prosthetics, orthodontics) requiring laboratory fabrication. Patients pay across multiple installments (deposit and completion payments).
   - **Cash Flow Accounting:** Only the cash collected on that calendar day is recognized in daily gross revenue.
   - **Balance Calculation:** `Remaining Balance = Total Case Cost - Sum of All Paid Amounts to Date`. When Remaining Balance = 0, the system automatically appends "Payment Complete" in the remark field.

### 3.2 Doctor Commission Formula

```
Total Gross Income = Total GP Revenue + Total Case Revenue
Commission Base = Total Gross Income - Total Lab Fees
Doctor Commission Fee = Commission Base × 40% (0.40)
```

### 3.3 Clinic Net Profit / Loss Formula

```
1. Remaining Clinic Income = Total Gross Income - Total Lab Fees - Doctor Commission
2. Total Operating Expenses = Monthly General Expenses + Assistant Salary + Assistant Bonus + Clinic Rent + Utility Bills
3. Net Profit / Loss = Remaining Clinic Income - Total Operating Expenses
```

- Net Profit / Loss > 0 indicates Net Profit; Net Profit / Loss < 0 indicates Net Loss.

### 3.4 Cross-Month Case Carry-Forward Logic

1. **Manual trigger:** Admin opens the Carry Forward screen and runs the action for the current month.
2. **Selection Logic:** Cases where Remaining Balance > 0 are moved into the next month's bucket; fully settled records stay in the current month (nothing is purged).
3. **Carried-Forward Record State:** Preserves original Total Cost, historical accumulated payments, and outstanding balance, allowing staff to log subsequent installments until final completion.

---

## 4. Functional Requirements

### 4.1 Assistant Portal (Daily Data Entry View)

- **Patient Record Entry Form:** Fields include Patient Name, Address (Optional), Category Selector (GP / Case), Diagnosis & Treatment Description, Total Treatment Cost, and Amount Paid Today.
- **Active Cycle Record Table:** Displays active and carried-forward patient visits for the current month. Aggregated totals, profit margins, and doctor commission numbers are strictly suppressed.
- **Inline Editing:** Assistant can edit records at any time — months never lock.

### 4.2 Admin Portal (Financial Reconciliation & Analytics)

- **Case & Lab Fee Reconciliation Engine:** Automated table isolating all active "Case" treatments. Admin inputs specific laboratory fees incurred for each case. Total lab fees auto-aggregate instantly.
- **Monthly Overhead Input Module:** Single-input form for General Monthly Expense, Assistant Salary, Performance Bonus, Property Rent, and Utility Bills.
- **Live Financial Dashboard:** Displays real-time KPIs: Total GP Revenue, Total Case Revenue, Total Lab Deductions, Doctor Commission (40%), Operating Overhead, and Net Profit/Loss.
- **Carry Forward Action:** Moves unsettled case balances into the next month's bucket; the next bucket is auto-created on demand.

---

## 5. Technical Architecture & Hosting Specifications

### 5.1 Technology Stack Matrix

| Layer | Technology |
|---|---|
| Frontend & Application Layer | Next.js (App Router, Server Components & Server Actions) |
| Styling & UI Components | Tailwind CSS + Lucide React Icons (Optimized for Desktop/PC workflow) |
| Backend Logic | Next.js Built-in Server Actions & API Routes (No external Node.js/Express server required) |
| Database & Authentication | Supabase (PostgreSQL with PgBouncer Connection Pooling & Row-Level Security) |
| Hosting & Deployment | Vercel (Free Tier, Serverless Edge Infrastructure) |

### 5.2 Database Entity Schema

| Table Name | Key Attributes | Functional Purpose |
|---|---|---|
| users | id, email, username, password_hash, role (ADMIN/ASSISTANT) | User credentials and RBAC enforcement. Email used for auth, username is display name. |
| monthly_cycles | id, month_year (unique) | Passive month bucket; no lock/close state |
| patient_records | id, cycle_id, entry_date, patient_name, category, total_cost, lab_fee, payment_status, is_carried_forward | Patient treatments and lab fee assignments |
| case_payments | id, record_id, payment_date, paid_amount, payment_note | Timestamped installment payment tracking |
| monthly_financials | id, cycle_id, total_gp, total_case, gross_income, lab_fee, doc_comm, expenses, net_profit | Persistent monthly financial performance records |

---

## 6. Implementation Roadmap & Release Phases

### Phase 1: MVP Core Launch

Fullstack Next.js + Supabase setup, RBAC Auth, Assistant Daily Entry Form, Split Installment tracking, Admin Dynamic Financial Engine, and Carry Forward for incomplete cases.

### Phase 2: Client-Side PDF Generation & Advanced Filters

Implement client-side PDF invoice/statement export (using `@react-pdf/renderer` or `jsPDF`), custom date-range queries, and automated lab fee category presets.
