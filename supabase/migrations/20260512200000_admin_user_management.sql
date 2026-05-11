-- Phase 1 admin user-management surface: list / update role / activate.
-- All operations gated to admin callers via private.is_admin() inside the
-- function body (not RLS), since the functions run security-definer to
-- bypass row-level access to other users' profile rows.

-- ---------------------------------------------------------------------------
-- is_active column on profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column is_active boolean not null default true;

create index profiles_is_active_idx on public.profiles(is_active);

comment on column public.profiles.is_active is
  'Soft activation flag. Admin-flippable; future login flow may check this. Auth-level bans live separately on auth.users.';

-- ---------------------------------------------------------------------------
-- private.is_admin() — caller-check helper, used inside the RPCs below
-- ---------------------------------------------------------------------------
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;

-- ---------------------------------------------------------------------------
-- public.admin_list_users() — full user list for the admin dashboard
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  id           uuid,
  email        text,
  role         public.user_role,
  display_name text,
  is_active    boolean,
  created_at   timestamptz
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
    select p.id, p.email, p.role, p.display_name, p.is_active, p.created_at
    from public.profiles p
    order by p.created_at desc;
end;
$$;

comment on function public.admin_list_users() is
  'Admin-only: returns every profile row. Caller checked via private.is_admin() inside the function.';

-- ---------------------------------------------------------------------------
-- public.admin_update_user_role(target_id, new_role)
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_user_role(
  target_id uuid,
  new_role  public.user_role
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  -- Safety: an admin cannot demote themselves (would lock them out).
  if target_id = auth.uid() and new_role <> 'admin' then
    raise exception 'cannot change your own role' using errcode = '22023';
  end if;
  update public.profiles set role = new_role where id = target_id;
end;
$$;

comment on function public.admin_update_user_role(uuid, public.user_role) is
  'Admin-only: change a user role. Self-demotion blocked to prevent lock-out.';

-- ---------------------------------------------------------------------------
-- public.admin_set_user_active(target_id, active)
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_user_active(
  target_id uuid,
  active    boolean
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if target_id = auth.uid() and not active then
    raise exception 'cannot deactivate your own account' using errcode = '22023';
  end if;
  update public.profiles set is_active = active where id = target_id;
end;
$$;

comment on function public.admin_set_user_active(uuid, boolean) is
  'Admin-only: toggle a user is_active flag. Cannot deactivate own account.';

-- ---------------------------------------------------------------------------
-- Grants — the RPCs are callable by any authenticated session, but the
-- function bodies reject non-admins.
-- ---------------------------------------------------------------------------
grant execute on function public.admin_list_users()                          to authenticated;
grant execute on function public.admin_update_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_set_user_active(uuid, boolean)        to authenticated;
