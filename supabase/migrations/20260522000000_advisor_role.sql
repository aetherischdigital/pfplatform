-- Advisor role rename + professional_type
--
-- A realtor and a loan officer do the same thing in the product (advise a
-- roster of homeowner clients), so they share one underlying role. Rename the
-- user_role enum value 'realtor' -> 'advisor' to reflect that, and add
-- professional_type to distinguish the two for labels, the license field
-- (real-estate license vs NMLS #), and feature gating (e.g. the CMA tool is
-- realtor-only).
--
-- Safe to apply: at apply time only admin users exist (0 realtor users), and
-- no live function / policy / constraint references the 'realtor' literal, so
-- the rename touches no live data or dependent objects. NOTE: production
-- (main branch) still references 'realtor' in client code until the advisor
-- code ships — coordinate the deploy. With no realtor/advisor users yet, the
-- only interim effect is the admin "set role -> Realtor" option erroring.

-- 1. Rename the role value.
alter type public.user_role rename value 'realtor' to 'advisor';

-- 2. Professional type — only meaningful for advisor-role users.
create type public.professional_type as enum ('realtor', 'loan_officer');

alter table public.profiles
  add column if not exists professional_type public.professional_type;

comment on column public.profiles.professional_type is
  'For advisor-role users: realtor vs loan officer. Drives UI label, license field (RE license vs NMLS #), and feature gating (e.g. CMA is realtor-only). Null for non-advisors.';

-- 3. Admin-only setter (mirrors admin_update_user_role; gated via private.is_admin()).
create or replace function public.admin_update_user_professional_type(
  target_id uuid,
  new_type  public.professional_type
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.profiles set professional_type = new_type where id = target_id;
end;
$$;

comment on function public.admin_update_user_professional_type(uuid, public.professional_type) is
  'Admin-only: set a user''s professional_type (realtor / loan_officer / null). Caller checked via private.is_admin().';

grant execute on function public.admin_update_user_professional_type(uuid, public.professional_type) to authenticated;
