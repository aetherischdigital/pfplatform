-- Phase 1 polish: fix two data-layer bugs found in validation pass.
--
-- 1. handle_new_user trigger reads `display_name` from raw_user_meta_data, but
--    the signup form sends `full_name` (Supabase convention). Result: every
--    new signup has profiles.display_name = NULL until they manually save
--    it from Account. UI fallbacks work, but greetings end up showing
--    "john.smith" instead of "John". Fix: read full_name first, fall back
--    to display_name for any older clients.
--
-- 2. mortgages table has no unique constraint on user_id, but the data layer
--    + UI assume one mortgage per user (fetch uses .limit(1).maybeSingle()).
--    A double-submit, two-tab insert, or retry-after-network-blip can create
--    a second row that gets silently dropped on read. Fix: add a unique
--    constraint. Defense-in-depth: the form also disables submit during save.

-- ---------------------------------------------------------------------------
-- 1. handle_new_user — read full_name (or display_name as fallback)
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
  resolved_name text;
begin
  meta_waitlist := new.raw_user_meta_data ->> 'waitlist_interest';
  if meta_waitlist in ('plus', 'pro') then
    resolved := meta_waitlist::public.waitlist_interest;
  else
    resolved := 'none';
  end if;

  resolved_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'display_name'
  );

  insert into public.profiles (id, email, display_name, waitlist_interest)
  values (
    new.id,
    new.email,
    resolved_name,
    resolved
  );
  return new;
end;
$$;

-- Backfill: any profile created before this fix where display_name is NULL
-- but the user_metadata has a full_name. Safe to run multiple times.
update public.profiles p
   set display_name = u.raw_user_meta_data ->> 'full_name'
  from auth.users u
 where p.id = u.id
   and p.display_name is null
   and u.raw_user_meta_data ->> 'full_name' is not null
   and length(trim(u.raw_user_meta_data ->> 'full_name')) > 0;

-- ---------------------------------------------------------------------------
-- 2. mortgages — unique constraint on user_id
-- ---------------------------------------------------------------------------
-- Preflight: collapse any pre-existing duplicates down to the oldest row
-- per user. The dashboard only ever showed the oldest one anyway (fetch
-- orders by created_at asc + limit 1), so the newer rows were already
-- invisible to the user.
delete from public.mortgages
 where id in (
   select id
     from (
       select id,
              row_number() over (partition by user_id order by created_at asc) as rn
         from public.mortgages
     ) ranked
    where rn > 1
 );

alter table public.mortgages
  add constraint mortgages_user_id_unique unique (user_id);

comment on constraint mortgages_user_id_unique on public.mortgages is
  'One mortgage per user in Phase 1. Phase 2 will support multiple properties — relax this then.';
