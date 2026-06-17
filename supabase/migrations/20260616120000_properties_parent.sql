-- Phase 2 (continued): Properties as a first-class parent entity.
--
-- Until now the mortgages table doubled as the per-property record (see the
-- note in 20260513120000_pfs_overdelivery.sql) — addressless, loan-shaped,
-- and unable to represent a paid-off home (no loan meant no row at all).
--
-- This migration promotes "Property" to its own table that owns the place:
-- address, type (primary / vacation / rental / other), market value, the
-- carrying costs (property tax, homeowners + flood insurance, HOA), rental
-- income, and the Schedule C acquisition fields. Mortgages become an optional
-- *child* loan linked by property_id — a paid-off home is a property with no
-- mortgage row.
--
-- Field ownership after this migration:
--   property-level (move to properties): property_label -> label,
--     starting_home_value -> market_value, property_tax_annual,
--     homeowners_insurance_annual, flood_insurance_annual, hoa_monthly,
--     is_primary -> property_type, date_acquired, original_cost, pct_ownership
--   loan-level (stay on mortgages): balance, rate_pct, term_months_remaining,
--     monthly_payment (P+I), extra_principal, first_payment_date,
--     pmi_mip_monthly (mortgage insurance is a loan attribute, not the home's)
--
-- Existing mortgage rows are migrated 1:1 into a property each, preserving all
-- data and the loan link.

-- ---------------------------------------------------------------------------
-- 1. property_type enum + properties table
-- ---------------------------------------------------------------------------
create type public.property_type as enum ('primary', 'vacation', 'rental', 'other');

create table public.properties (
  id                            uuid primary key default gen_random_uuid(),
  user_id                       uuid not null references auth.users(id) on delete cascade,
  label                         text not null check (length(label) between 1 and 120),
  property_type                 public.property_type not null default 'primary',
  address                       text check (address is null or length(address) <= 240),
  market_value                  numeric(14,2) not null default 0 check (market_value >= 0),
  -- Carrying costs (belong to the home, not the loan).
  property_tax_annual           numeric(14,2) check (property_tax_annual is null or property_tax_annual >= 0),
  homeowners_insurance_annual   numeric(14,2) check (homeowners_insurance_annual is null or homeowners_insurance_annual >= 0),
  flood_insurance_annual        numeric(14,2) check (flood_insurance_annual is null or flood_insurance_annual >= 0),
  hoa_monthly                   numeric(14,2) check (hoa_monthly is null or hoa_monthly >= 0),
  -- Rental income — meaningful when property_type = 'rental'.
  monthly_rent                  numeric(14,2) check (monthly_rent is null or monthly_rent >= 0),
  -- Schedule C acquisition extras.
  date_acquired                 date,
  original_cost                 numeric(14,2) check (original_cost is null or original_cost >= 0),
  pct_ownership                 numeric(5,2) not null default 100 check (pct_ownership > 0 and pct_ownership <= 100),
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create index properties_user_idx on public.properties(user_id);

-- At most one primary residence per user (mirrors the retired is_primary rule).
-- Multiple vacation / rental / other properties are fine.
create unique index properties_user_primary_unique
  on public.properties(user_id)
  where property_type = 'primary';

comment on table public.properties is
  'Per-user real-estate holdings. Owns address, type, market value, and carrying costs (taxes, insurance, HOA, rent). A linked mortgages row (optional) holds loan terms; a paid-off home has a property row and no mortgage.';
comment on column public.properties.property_type is
  'primary | vacation | rental | other. At most one primary per user (partial unique index properties_user_primary_unique).';
comment on column public.properties.monthly_rent is
  'Gross monthly rent collected. Only meaningful for property_type = rental; powers the property-at-a-glance net cash-flow line.';

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. mortgages — add the property link
-- ---------------------------------------------------------------------------
alter table public.mortgages
  add column if not exists property_id uuid references public.properties(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 3. Backfill: one property per existing mortgage, then wire the link.
--    A loop keeps the mortgage<->property pairing exact (created_at is not a
--    safe join key — two mortgages can share a timestamp).
-- ---------------------------------------------------------------------------
do $$
declare
  m       record;
  new_id  uuid;
begin
  for m in select * from public.mortgages where property_id is null loop
    insert into public.properties (
      user_id, label, property_type, market_value,
      property_tax_annual, homeowners_insurance_annual, flood_insurance_annual,
      hoa_monthly, date_acquired, original_cost, pct_ownership, created_at
    ) values (
      m.user_id,
      m.property_label,
      case when m.is_primary then 'primary'::public.property_type
           else 'other'::public.property_type end,
      m.starting_home_value,
      m.property_tax_annual, m.homeowners_insurance_annual, m.flood_insurance_annual,
      m.hoa_monthly, m.date_acquired, m.original_cost, m.pct_ownership, m.created_at
    )
    returning id into new_id;

    update public.mortgages set property_id = new_id where id = m.id;
  end loop;
end $$;

-- Every mortgage now belongs to a property.
alter table public.mortgages alter column property_id set not null;

-- One mortgage per property for now (first mortgage). HELOCs / second liens
-- live as pfs_records liabilities (category 'heloc'), not here.
create unique index mortgages_property_unique on public.mortgages(property_id);

-- ---------------------------------------------------------------------------
-- 4. Drop the property-level columns that moved to properties.
-- ---------------------------------------------------------------------------
drop index if exists public.mortgages_user_primary_unique;

alter table public.mortgages
  drop column if exists property_label,
  drop column if exists starting_home_value,
  drop column if exists property_tax_annual,
  drop column if exists homeowners_insurance_annual,
  drop column if exists flood_insurance_annual,
  drop column if exists hoa_monthly,
  drop column if exists is_primary,
  drop column if exists date_acquired,
  drop column if exists original_cost,
  drop column if exists pct_ownership;

comment on table public.mortgages is
  'Per-property mortgage loan (optional child of properties). Holds loan terms only — balance, rate_pct (annual nominal), term, P+I monthly_payment, extra_principal, first_payment_date, and pmi_mip_monthly. Carrying costs and home value live on properties.';

-- ---------------------------------------------------------------------------
-- 5. RLS — owner full access (same shape as mortgages/pfs_records).
-- ---------------------------------------------------------------------------
alter table public.properties enable row level security;

create policy "owner reads own properties"
  on public.properties for select
  to authenticated
  using (auth.uid() = user_id);

create policy "owner inserts own properties"
  on public.properties for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "owner updates own properties"
  on public.properties for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner deletes own properties"
  on public.properties for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.properties to authenticated;

-- ---------------------------------------------------------------------------
-- 6. admin_user_summary — include properties; drop the is_primary ordering
--    (that column now lives on properties as property_type).
-- ---------------------------------------------------------------------------
create or replace function public.admin_user_summary(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile  jsonb;
  v_props    jsonb;
  v_morts    jsonb;
  v_records  jsonb;
  v_biz      jsonb;
  v_conts    jsonb;
  v_snaps    jsonb;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select to_jsonb(p) - 'id' || jsonb_build_object('id', p.id)
    into v_profile
    from public.profiles p
   where p.id = p_user_id;

  if v_profile is null then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(to_jsonb(pr) order by (pr.property_type = 'primary') desc, pr.created_at), '[]'::jsonb)
    into v_props
    from public.properties pr
   where pr.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at), '[]'::jsonb)
    into v_morts
    from public.mortgages m
   where m.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.kind, r.created_at), '[]'::jsonb)
    into v_records
    from public.pfs_records r
   where r.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(b) order by b.created_at), '[]'::jsonb)
    into v_biz
    from public.business_ventures b
   where b.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]'::jsonb)
    into v_conts
    from public.contingent_liabilities c
   where c.user_id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.snapshot_date), '[]'::jsonb)
    into v_snaps
    from public.net_worth_snapshots s
   where s.user_id = p_user_id;

  return jsonb_build_object(
    'profile',                v_profile,
    'properties',             v_props,
    'mortgages',              v_morts,
    'pfs_records',            v_records,
    'business_ventures',      v_biz,
    'contingent_liabilities', v_conts,
    'net_worth_snapshots',    v_snaps
  );
end;
$$;

comment on function public.admin_user_summary(uuid) is
  'Admin-only: return a single user''s full PFS bundle (profile, properties, mortgages, records, ventures, contingent liabilities, snapshots) as one JSONB blob.';

revoke all on function public.admin_user_summary(uuid) from public;
grant execute on function public.admin_user_summary(uuid) to authenticated;
