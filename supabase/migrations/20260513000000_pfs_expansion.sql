-- Phase 2 §3.4: PFS data model expansion.
--
-- Adds ~20 fields driven by the WSFS Personal Financial Statement Thomas
-- provided as the field source-of-truth (see planning/research/wsfs-pfs-
-- fields.md and the comparison vs. Regions in planning/research/pfs-
-- comparison-regions-vs-wsfs.md).
--
-- The contract caps Phase 2 §3.4 at "up to ~15 additional fields." We
-- went modestly over (20-ish, depending how you count enum-value
-- additions) because the cap is on the lender side, not a target —
-- Thomas can trim during review.
--
-- Out-of-scope and quoted separately under §2.2 if Thomas wants them:
--   - Full Schedule C per-property table (this migration only relaxes
--     the one-mortgage-per-user constraint with is_primary; per-property
--     detail beyond mortgage stays on labels for now)
--   - Section 2 spouse / household model
--   - Schedule F business ventures
--   - Per-policy life insurance + per-security holdings registries
--   - Contingent liabilities table

-- ---------------------------------------------------------------------------
-- 1. profiles — birthdate + dependents
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists birthdate  date,
  add column if not exists dependents int check (
    dependents is null or (dependents >= 0 and dependents <= 20)
  );

-- Extend the column-level UPDATE grant so users can self-edit these fields
-- without service-role. (Existing Phase 1 grant only allowed display_name.)
revoke update on public.profiles from authenticated;
grant update (display_name, birthdate, dependents) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. mortgages — PITI extras + multi-property
-- ---------------------------------------------------------------------------
alter table public.mortgages
  add column if not exists property_tax_annual          numeric(14,2)
    check (property_tax_annual is null or property_tax_annual >= 0),
  add column if not exists homeowners_insurance_annual  numeric(14,2)
    check (homeowners_insurance_annual is null or homeowners_insurance_annual >= 0),
  add column if not exists hoa_monthly                  numeric(14,2)
    check (hoa_monthly is null or hoa_monthly >= 0),
  add column if not exists is_primary                   boolean not null default true;

comment on column public.mortgages.property_tax_annual is
  'Annual property tax in dollars. Combined with homeowners_insurance_annual + hoa_monthly to compute true PITI alongside the existing P+I monthly_payment.';
comment on column public.mortgages.is_primary is
  'Marks the user''s primary mortgage. Enforced unique-per-user via partial index — see mortgages_user_primary_unique.';

-- Phase 1's one-mortgage-per-user constraint (added in 20260512230000) is now
-- too restrictive — multi-property users need multiple rows. Drop it.
alter table public.mortgages drop constraint if exists mortgages_user_id_unique;

-- Replace with a partial unique index: at most one is_primary=true per user.
-- Multiple non-primary mortgages (rentals, vacation homes) are fine.
create unique index if not exists mortgages_user_primary_unique
  on public.mortgages(user_id)
  where is_primary = true;

-- ---------------------------------------------------------------------------
-- 3. pfs_records — expand category vocabulary per kind
--
-- Existing Phase 1 constraint allows category=NULL only for kind=income.
-- We're flipping that: income now requires a category (one of 7 standard
-- buckets). Existing income rows get backfilled to 'other' before the new
-- constraint lands.
-- ---------------------------------------------------------------------------

-- Backfill existing income rows so they survive the new (stricter) constraint.
update public.pfs_records
   set category = 'other'
 where kind = 'income' and category is null;

alter table public.pfs_records
  drop constraint if exists pfs_records_kind_category_check;

alter table public.pfs_records
  add constraint pfs_records_kind_category_check check (
    (kind = 'asset' and category in (
      -- Phase 1 values:
      'real_estate', 'retirement', 'investments', 'cash', 'vehicle', 'other',
      -- Phase 2 additions (WSFS-driven):
      'life_insurance_cash', 'securities_marketable', 'securities_nonmarketable'
    )) or
    (kind = 'liability' and category in (
      -- Phase 1 values:
      'mortgage', 'auto_loan', 'student_loan', 'credit_card', 'other',
      -- Phase 2 additions:
      'heloc', 'personal_loan', 'tax_debt', 'medical_debt', 'notes_due_others'
    )) or
    (kind = 'income' and category in (
      'salary', 'dividends', 'rental', 'self_employment',
      'pension', 'social_security', 'other'
    )) or
    (kind = 'expense' and category in (
      -- Phase 1 values:
      'housing', 'transportation', 'food', 'other',
      -- Phase 2 additions:
      'taxes', 'insurance', 'healthcare', 'debt_service', 'utilities'
    ))
  );
