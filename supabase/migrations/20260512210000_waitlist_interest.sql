-- Phase 1 polish: capture paid-tier interest at signup.
--
-- Plus and Pro pricing is TBD — the Pricing page shows "Coming soon" — but
-- we still want a demand signal. New signups can optionally indicate whether
-- they're interested in Plus or Pro; admins can view the breakdown.

-- ---------------------------------------------------------------------------
-- waitlist_interest enum + column
-- ---------------------------------------------------------------------------
create type public.waitlist_interest as enum ('none', 'plus', 'pro');

alter table public.profiles
  add column waitlist_interest public.waitlist_interest not null default 'none';

create index profiles_waitlist_interest_idx
  on public.profiles(waitlist_interest)
  where waitlist_interest <> 'none';

comment on column public.profiles.waitlist_interest is
  'Optional self-reported interest in paid tiers. Set at signup, editable from Account.';

-- ---------------------------------------------------------------------------
-- Self-update grant — users can update their own waitlist_interest column
-- via the Data API (column-level UPDATE, matches the display_name pattern).
-- ---------------------------------------------------------------------------
grant update (waitlist_interest) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- handle_new_user trigger update — pick up waitlist_interest from signup
-- metadata when present. Falls back to 'none' (column default) when absent.
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
security definer
set search_path = ''
language plpgsql
as $$
declare
  meta_waitlist text;
  resolved      public.waitlist_interest;
begin
  meta_waitlist := new.raw_user_meta_data ->> 'waitlist_interest';
  if meta_waitlist in ('plus', 'pro') then
    resolved := meta_waitlist::public.waitlist_interest;
  else
    resolved := 'none';
  end if;

  insert into public.profiles (id, email, display_name, waitlist_interest)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'display_name',
    resolved
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_list_users — add waitlist_interest to the returned columns.
-- Postgres requires DROP before CREATE when the OUT/return row shape changes
-- (CREATE OR REPLACE can't widen the return type).
-- ---------------------------------------------------------------------------
drop function if exists public.admin_list_users();

create or replace function public.admin_list_users()
returns table (
  id                uuid,
  email             text,
  role              public.user_role,
  display_name      text,
  is_active         boolean,
  waitlist_interest public.waitlist_interest,
  created_at        timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select p.id, p.email, p.role, p.display_name, p.is_active,
           p.waitlist_interest, p.created_at
    from public.profiles p
    order by p.created_at desc;
end;
$$;

comment on function public.admin_list_users() is
  'Admin-only: returns every profile row, including waitlist_interest. Caller checked via private.is_admin() inside the function.';

grant execute on function public.admin_list_users() to authenticated;
