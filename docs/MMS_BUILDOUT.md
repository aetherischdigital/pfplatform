# Mortgage Management System (MMS) — Buildout Plan

**Status:** Planned — not yet started.
**Scope:** The authenticated mortgage-management product layered on top of the
existing PFS, auth, and dashboard foundation.

This is the engineering plan for building the MMS feature set. It is delivered
in independently shippable stages (Builds A–I); each builds on the previous and
can be demoed on its own.

---

## 1. What the MMS is

A user-controlled mortgage ledger with tools to accelerate payoff and detect
servicer errors. Three principles drive the whole design:

1. **The amortization schedule is the source of truth.** Every loan resolves to
   a fixed sequence of N numbered payments, each with a precise
   principal/interest split fixed at origination.
2. **Prepayments are made in *exact principal-portion* amounts, never rounded.**
   Exact amounts keep the platform's math and the servicer's math reconcilable
   to the penny — which is what makes errors detectable.
3. **The user owns the ledger and audits the servicer.** The platform tracks
   what *should* have happened; the user records what the statement *says*
   happened; mismatches are surfaced with a dollar impact.

PMI tracking, "hidden money" budgeting, advisor consultations, and reports all
orbit this core. v1 is deliberately **manual** (no Plaid/MX auto-sync) — the
manual ledger is the methodology and keeps the audit trustworthy.

---

## 2. Roles

| Role | Description |
|---|---|
| **homeowner** | Primary user. Owns one or more loans, runs the ledger, makes prepayments, reconciles, tracks PMI. |
| **advisor** | A homeowner's consultant. Has a personal homeowner-style dashboard *plus* a roster of homeowner clients they advise. `professional_type` distinguishes a **realtor** (runs CMAs, property values) from a **loan officer** (origination/MMS focus). |
| **admin** | Platform operator. User/role management, content, oversight. |

(`user_role` enum = `homeowner | advisor | admin`; `professional_type` enum =
`realtor | loan_officer`, set on advisor profiles. Both already in the schema.)

---

## 3. Data model

The MMS extends the existing `mortgages` table into the loan entity rather than
introducing a parallel `loans` table, so one record per property feeds both the
PFS net-worth view and the MMS ledger (no duplicate data entry). New child
tables hang off it. All tables get owner-scoped RLS; advisor read/write access
is gated by the relationship + permission level (Build G). All money columns are
Postgres `numeric`, never float.

- **`mortgages`** (extended) — the loan: amount, rate, term (months), first
  payment date, monthly P&I, loan program, PMI fields, origination value, status.
- **`amortization_schedule`** — materialized 1..N rows on loan setup: payment #,
  scheduled date, P&I, principal portion, interest portion, remaining balance,
  cumulative interest.
- **`servicers`** — per-loan servicer history: company, mailing address, contact,
  account number (can change across transfers), payment-number range serviced.
- **`payments`** — ledger entries (regular + prepayment): kind, payment-number
  range, amount, check #, date sent, date cleared, servicer, status.
- **`property_values`** — value history: date, value, source, who submitted it.
- **`reconciliations`** — audit events: statement date, reported vs. expected
  balance, delta, cost-of-error estimate, status, dispute-letter flag.
- **`cmas`** — comparative market analyses: subject snapshot, comps, computed
  range, final value, PDF reference.
- **`advisor_clients`** / **`client_invites`** — the advisor↔client pairing +
  permission level (view / comment / edit) + invitation flow.
- **`reminders`** / **`reminder_templates`** — advisor → client outreach.
- **`notifications`** / **`notification_preferences`** — in-app + email feed.

---

## 4. Build sequence

Each build is independently shippable. Front-loaded so the prepayment workflow
(the product's signature outcome) lands early.

| | Build | Core deliverable |
|---|---|---|
| **A** | Loan + amortization foundation | Extend `mortgages`; generate + persist the amortization schedule; loan setup form; read-only amortization ledger. |
| **B** | Servicers + regular payment logging | Servicer history; "mark payment paid" with check #/date; next-unpaid tracking; payoff projection from history. |
| **C** | Prepayment workflow ⭐ | Single + multi (contiguous) prepayments in exact principal-portion amounts; printable prepayment notice; payoff/interest-saved updates. |
| **D** | PMI tracker | LTV engine; property-value history; 80% threshold worksheet; eligibility timelines; loan-program nuance (conventional vs FHA/VA/USDA). |
| **E** | Reconciliation + dispute letters | Expected-vs-reported comparison; cost-of-error; dispute-letter PDF. First server-side PDF pipeline (reused by C and H). |
| **F** | Hidden Money tools | Pay-cycle analyzer + tax-refund redirector; reuses the payoff-simulation math. |
| **G** | Advisor ↔ client layer | Pairing/permission model + RLS; client roster (replaces `/app/clients` placeholder); view-as-client; advisory notes; value submissions; invite flow. |
| **H** | CMA tool | Per-sqft comparable analysis; PDF report; flows a value into the client's PMI tracker. |
| **I** | Reminders + notifications | Templated advisor reminders; in-app notification feed + preferences. |

---

## 5. Calculation engines

Centralized as pure functions in `src/lib/` with unit tests; no business math in
components.

- **Amortization generator** — standard formula; per-payment rounded to the cent
  (banker's rounding); last payment balances the cents. Validation: sum of
  principal portions must equal the loan amount.
- **Payoff projection** — next-unpaid payment + forward projection at the user's
  cadence; outputs payoff date, interest from today, interest saved vs. baseline.
- **LTV / PMI threshold** — current balance ÷ current value; removal threshold
  (default 80%); per-program overrides.
- **CMA valuation** — per-sqft method with recency weighting; range (low/median/
  high) + the advisor's professional final value.

The existing `src/lib/mortgage.ts` (amortization schedule, payoff simulation,
scenario comparison) is the foundation for A–C and F.

---

## 6. Cross-cutting

- **Money:** Postgres `numeric`; one rounding utility client-side; no ad-hoc math.
- **Dates:** UTC in storage, user-local for display.
- **Server-only secrets:** all email (Resend) and all PDF generation run in
  Supabase Edge Functions — API keys never reach the client bundle.
- **PDF generation:** server-side headless Chromium (Edge Function), shared by
  prepayment notices (C), dispute letters (E), and CMA reports (H). A full
  personalized prepayment-schedule PDF can slot in after C.
- **Audit log:** mutations on loans/payments/reconciliations/property_values/cmas
  write to a generic audit-log table.

---

## 7. Open technical decisions (resolve before/while building)

- **Amortization precision (gates A, and the audit in C/E):** validate the
  generator against a real Note (loan amount, rate, term, first-payment date +
  its first ~12 amortization rows) to confirm penny-exact agreement with a real
  lender schedule. The whole audit feature depends on this.
- **Loan editability:** no silent edits after a schedule + payments exist — only
  refinance (new loan, old preserved read-only) or an admin-assisted correction.
- **PMI program depth:** conventional gets full logic in v1; FHA/VA/USDA get a
  caveat banner. Full FHA MIP modeling is a separate effort if needed.
- **Advisor pairing model:** optional, invite-driven, one advisor per homeowner
  at a time (revoke before re-pair).
- **Dispute-letter delivery:** generate PDF for print and/or send via Resend;
  default to print, track which channel was used.

---

## 8. Out of scope for v1

Bank auto-sync (Plaid/MX), MLS integration, ARM/balloon/interest-only loans,
multi-borrower accounts, in-app messaging, document storage, AI insights.
