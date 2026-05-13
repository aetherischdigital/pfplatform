-- Phase 1 PFS schema: the contract-minimum "enter financial data + see dashboard"
-- bar from signed Exhibit A. Mirrors the four mockData shapes (Asset, Liability,
-- IncomeSource, Expense) as one polymorphic table, plus a dedicated mortgages
-- table for the loan-specific fields the Note generates.
--
-- Realtor read-through (per realtor_clients permission) defers to Phase 2 when
-- that table lands — see planning/PHASE1.md §6. Admin read-all flows through
-- service-role on the server side; no client RLS policy needed.

-- ---------------------------------------------------------------------------
-- pfs_records — assets, liabilities, income, expenses (one row per line item)
-- ---------------------------------------------------------------------------
create type public.pfs_record_kind as enum ('asset', 'liability', 'income', 'expense');

create table public.pfs_records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        public.pfs_record_kind not null,
  label       text not null check (length(label) between 1 and 120),
  category    text,
  amount      numeric(14,2) not null check (amount >= 0),
  rate        numeric(6,3) check (rate is null or rate >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint pfs_records_kind_category_check check (
    (kind = 'asset'     and category in ('real_estate','retirement','investments','cash','vehicle','other')) or
    (kind = 'liability' and category in ('mortgage','auto_loan','student_loan','credit_card','other')) or
    (kind = 'income'    and category is null) or
    (kind = 'expense'   and category in ('housing','transportation','food','other'))
  )
);

create index pfs_records_user_kind_idx on public.pfs_records(user_id, kind);

comment on table public.pfs_records is
  'Polymorphic PFS line items. amount is value (asset), balance (liability), or monthly (income/expense). rate applies to liabilities.';

create trigger pfs_records_set_updated_at
  before update on public.pfs_records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- mortgages — loan-specific fields used by payoff projections + equity math
-- ---------------------------------------------------------------------------
create table public.mortgages (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  property_label          text not null check (length(property_label) between 1 and 120),
  starting_home_value     numeric(14,2) not null check (starting_home_value >= 0),
  balance                 numeric(14,2) not null check (balance >= 0),
  rate_pct                numeric(6,3) not null check (rate_pct >= 0 and rate_pct <= 100),
  term_months_remaining   int not null check (term_months_remaining > 0 and term_months_remaining <= 600),
  monthly_payment         numeric(14,2) not null check (monthly_payment >= 0),
  extra_principal         numeric(14,2) not null default 0 check (extra_principal >= 0),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index mortgages_user_idx on public.mortgages(user_id);

comment on table public.mortgages is
  'Per-user mortgage records. rate_pct is annual nominal rate (e.g. 6.500 = 6.5%).';

create trigger mortgages_set_updated_at
  before update on public.mortgages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — owner full access; admin/realtor access via service-role or Phase 2
-- ---------------------------------------------------------------------------
alter table public.pfs_records enable row level security;
alter table public.mortgages   enable row level security;

create policy "owner reads own pfs_records"
  on public.pfs_records for select
  to authenticated
  using (auth.uid() = user_id);

create policy "owner inserts own pfs_records"
  on public.pfs_records for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "owner updates own pfs_records"
  on public.pfs_records for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner deletes own pfs_records"
  on public.pfs_records for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "owner reads own mortgages"
  on public.mortgages for select
  to authenticated
  using (auth.uid() = user_id);

create policy "owner inserts own mortgages"
  on public.mortgages for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "owner updates own mortgages"
  on public.mortgages for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner deletes own mortgages"
  on public.mortgages for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.pfs_records to authenticated;
grant select, insert, update, delete on public.mortgages   to authenticated;
-- No anon access.
