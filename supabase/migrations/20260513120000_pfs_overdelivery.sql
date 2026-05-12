-- Phase 2 overdelivery — §2.2-territory items the user opted to build now
-- rather than queue behind a contract amendment. See
-- planning/research/wsfs-pfs-fields.md for the WSFS form mappings.
--
-- Covers:
--   1. profiles: spouse fields (WSFS Section 2 lite — name/birthdate/occupation
--      only; not a full parallel PFS, which would be a household model rework)
--   2. mortgages: Schedule C extras (date_acquired, original_cost,
--      pct_ownership) so the existing mortgages table doubles as the per-
--      property detail surface
--   3. business_ventures table — WSFS Schedule F (realtors-as-business-owners
--      especially benefit)
--   4. contingent_liabilities table — WSFS contingent liabilities section
--      (endorser/co-maker, leases/contracts, lawsuits, tax liens, other)
--   5. net_worth_snapshots table — backing for §3.5's net-worth-over-time
--      visualization (no historical infra existed)

-- ---------------------------------------------------------------------------
-- 1. profiles — spouse fields (WSFS Section 2 lite)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists spouse_name       text,
  add column if not exists spouse_birthdate  date,
  add column if not exists spouse_occupation text;

-- Extend the column-level UPDATE grant to include the new self-editable fields.
revoke update on public.profiles from authenticated;
grant update (
  display_name, birthdate, dependents,
  spouse_name, spouse_birthdate, spouse_occupation
) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. mortgages — Schedule C extras (per-property detail)
-- ---------------------------------------------------------------------------
alter table public.mortgages
  add column if not exists date_acquired   date,
  add column if not exists original_cost   numeric(14,2)
    check (original_cost is null or original_cost >= 0),
  add column if not exists pct_ownership   numeric(5,2) not null default 100
    check (pct_ownership > 0 and pct_ownership <= 100);

comment on column public.mortgages.pct_ownership is
  'Percent ownership of the property. Defaults to 100. Schedule C field.';
comment on column public.mortgages.original_cost is
  'Original purchase price, before any appreciation. Schedule C field.';

-- ---------------------------------------------------------------------------
-- 3. business_ventures — WSFS Schedule F
-- ---------------------------------------------------------------------------
create table public.business_ventures (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null check (length(name) between 1 and 200),
  address           text,
  pct_ownership     numeric(5,2)
    check (pct_ownership is null or (pct_ownership > 0 and pct_ownership <= 100)),
  position_title    text,
  business_assets   numeric(14,2)
    check (business_assets is null or business_assets >= 0),
  line_of_business  text,
  years_in_business int
    check (years_in_business is null or (years_in_business >= 0 and years_in_business <= 200)),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index business_ventures_user_idx on public.business_ventures(user_id);

comment on table public.business_ventures is
  'WSFS Schedule F — business ventures the user holds a principal or partner interest in. Mostly relevant for the realtor / self-employed audience.';

create trigger business_ventures_set_updated_at
  before update on public.business_ventures
  for each row execute function public.set_updated_at();

alter table public.business_ventures enable row level security;

create policy "owner reads own business_ventures"
  on public.business_ventures for select
  to authenticated
  using (auth.uid() = user_id);

create policy "owner inserts own business_ventures"
  on public.business_ventures for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "owner updates own business_ventures"
  on public.business_ventures for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner deletes own business_ventures"
  on public.business_ventures for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.business_ventures to authenticated;

-- ---------------------------------------------------------------------------
-- 4. contingent_liabilities — WSFS contingent liabilities section
-- ---------------------------------------------------------------------------
create type public.contingent_liability_type as enum (
  'endorser_guarantor',
  'lease_contract',
  'lawsuit',
  'tax_lien',
  'other'
);

create table public.contingent_liabilities (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  type              public.contingent_liability_type not null,
  description       text not null check (length(description) between 1 and 500),
  estimated_amount  numeric(14,2)
    check (estimated_amount is null or estimated_amount >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index contingent_liabilities_user_idx on public.contingent_liabilities(user_id);

comment on table public.contingent_liabilities is
  'WSFS contingent liabilities — debts/obligations not yet on the balance sheet but that may become due (endorser/guarantor obligations, leases, lawsuits, contested tax liens).';

create trigger contingent_liabilities_set_updated_at
  before update on public.contingent_liabilities
  for each row execute function public.set_updated_at();

alter table public.contingent_liabilities enable row level security;

create policy "owner reads own contingent_liabilities"
  on public.contingent_liabilities for select
  to authenticated
  using (auth.uid() = user_id);

create policy "owner inserts own contingent_liabilities"
  on public.contingent_liabilities for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "owner updates own contingent_liabilities"
  on public.contingent_liabilities for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner deletes own contingent_liabilities"
  on public.contingent_liabilities for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.contingent_liabilities to authenticated;

-- ---------------------------------------------------------------------------
-- 5. net_worth_snapshots — backing for the §3.5 net-worth-over-time chart
-- ---------------------------------------------------------------------------
create table public.net_worth_snapshots (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  snapshot_date     date not null default current_date,
  total_assets      numeric(14,2) not null check (total_assets >= 0),
  total_liabilities numeric(14,2) not null check (total_liabilities >= 0),
  net_worth         numeric(14,2) not null,
  created_at        timestamptz not null default now(),
  -- One snapshot per user per day. New snapshot on same date overwrites
  -- via upsert in the data layer.
  constraint net_worth_snapshots_user_date_unique unique (user_id, snapshot_date)
);

create index net_worth_snapshots_user_date_idx
  on public.net_worth_snapshots(user_id, snapshot_date);

comment on table public.net_worth_snapshots is
  'Manual point-in-time snapshots of total assets/liabilities/net worth. Drives the dashboard net-worth-over-time sparkline. No cron — user explicitly saves snapshots via the dashboard.';

alter table public.net_worth_snapshots enable row level security;

create policy "owner reads own net_worth_snapshots"
  on public.net_worth_snapshots for select
  to authenticated
  using (auth.uid() = user_id);

create policy "owner inserts own net_worth_snapshots"
  on public.net_worth_snapshots for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "owner updates own net_worth_snapshots"
  on public.net_worth_snapshots for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner deletes own net_worth_snapshots"
  on public.net_worth_snapshots for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.net_worth_snapshots to authenticated;
