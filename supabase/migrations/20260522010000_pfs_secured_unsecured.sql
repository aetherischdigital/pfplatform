-- PFS recategorization: secured vs unsecured (Thomas's model, Phase 1 refinement)
--
-- Reorganizes the PFS so it mirrors how the methodology gives advice:
--   * Liabilities  = SECURED debt only (backed by an asset the lender can take):
--                    auto loans, HELOCs, other-secured. The mortgage continues
--                    to live in the dedicated `mortgages` table.
--   * Expenses     = UNSECURED debt / obligations (no collateral): credit cards,
--                    student loans, alimony, child support, medical, personal,
--                    tax debt, etc. These keep a balance (`amount`) + rate so
--                    they still count against net worth, and gain a
--                    `monthly_payment` for the cash-flow view.
--   * Household / living spend (groceries, utilities, phone, cable, ...) leaves
--                    the PFS entirely and moves to the new `living_expenses`
--                    table, which feeds the discretionary-income / cash-flow tool.
--
-- Net worth = assets - (secured balances + mortgage + unsecured balances):
-- every debt still counts; only its placement/framing changes.
--
-- Data note: at apply time there are no expense rows and no unsecured-category
-- liability rows (the only liabilities are category 'other'), so the data moves
-- below affect ~0 rows — they're written generically for correctness.

-- ---------------------------------------------------------------------------
-- 1. monthly_payment on pfs_records (recurring debt payment; null = unknown)
-- ---------------------------------------------------------------------------
alter table public.pfs_records
  add column if not exists monthly_payment numeric(14,2)
    check (monthly_payment is null or monthly_payment >= 0);

comment on column public.pfs_records.monthly_payment is
  'Recurring monthly payment for a debt (mainly unsecured/expense-kind rows). amount stays the balance; this is the payment that feeds the cash-flow view. Null when unknown / not applicable.';

-- ---------------------------------------------------------------------------
-- 2. living_expenses — household / living spend (NOT part of the PFS)
-- ---------------------------------------------------------------------------
create table if not exists public.living_expenses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  label          text not null check (length(label) between 1 and 120),
  category       text not null check (category in (
    'housing', 'utilities', 'transportation', 'food', 'insurance',
    'phone', 'internet_cable', 'healthcare', 'subscriptions', 'other'
  )),
  monthly_amount numeric(14,2) not null check (monthly_amount >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists living_expenses_user_idx on public.living_expenses(user_id);

comment on table public.living_expenses is
  'Recurring household / living spend (groceries, utilities, phone, cable, insurance, ...). Deliberately separate from the PFS — feeds the discretionary-income / cash-flow tool, not net worth.';

create trigger living_expenses_set_updated_at
  before update on public.living_expenses
  for each row execute function public.set_updated_at();

alter table public.living_expenses enable row level security;

create policy "owner reads own living_expenses"
  on public.living_expenses for select to authenticated
  using (auth.uid() = user_id);
create policy "owner inserts own living_expenses"
  on public.living_expenses for insert to authenticated
  with check (auth.uid() = user_id);
create policy "owner updates own living_expenses"
  on public.living_expenses for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner deletes own living_expenses"
  on public.living_expenses for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.living_expenses to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Recategorize. Drop the old check first so the data moves below don't
--    transiently violate it, then re-add the new vocabulary.
-- ---------------------------------------------------------------------------
alter table public.pfs_records
  drop constraint if exists pfs_records_kind_category_check;

-- 3a. Move household/living expense rows out of the PFS into living_expenses.
insert into public.living_expenses (user_id, label, category, monthly_amount, created_at)
select user_id, label,
       case category
         when 'food' then 'food'
         when 'transportation' then 'transportation'
         when 'utilities' then 'utilities'
         when 'insurance' then 'insurance'
         when 'healthcare' then 'healthcare'
         when 'housing' then 'housing'
         else 'other'
       end,
       amount, created_at
from public.pfs_records
where kind = 'expense'
  and category in ('housing','transportation','food','taxes','insurance','healthcare','debt_service','utilities');

delete from public.pfs_records
where kind = 'expense'
  and category in ('housing','transportation','food','taxes','insurance','healthcare','debt_service','utilities');

-- 3b. Move unsecured-category liabilities to the expense (unsecured) kind.
--     Their balance stays in `amount`; monthly_payment is left null for the
--     user to fill in. Secured liabilities (auto_loan, heloc, other) stay put.
update public.pfs_records
   set kind = 'expense'
 where kind = 'liability'
   and category in ('student_loan','credit_card','personal_loan','tax_debt','medical_debt','notes_due_others');

-- 3c. Tidy any null income categories (CHECK passes null, but normalize).
update public.pfs_records
   set category = 'other'
 where kind = 'income' and category is null;

-- 3d. New vocabulary: liabilities = secured, expenses = unsecured.
alter table public.pfs_records
  add constraint pfs_records_kind_category_check check (
    (kind = 'asset' and category in (
      'real_estate', 'retirement', 'investments', 'cash', 'vehicle', 'other',
      'life_insurance_cash', 'securities_marketable', 'securities_nonmarketable'
    )) or
    (kind = 'liability' and category in (
      -- SECURED debt only (mortgage lives in the mortgages table):
      'auto_loan', 'heloc', 'other'
    )) or
    (kind = 'income' and category in (
      'salary', 'dividends', 'rental', 'self_employment',
      'pension', 'social_security', 'other'
    )) or
    (kind = 'expense' and category in (
      -- UNSECURED debt / obligations:
      'credit_card', 'student_loan', 'alimony', 'child_support',
      'medical_debt', 'personal_loan', 'tax_debt', 'notes_due_others', 'other'
    ))
  );
