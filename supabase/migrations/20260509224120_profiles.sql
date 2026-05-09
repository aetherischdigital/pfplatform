-- Phase 1 foundation: profiles table + auto-create-on-signup trigger + RLS.
-- Anchor table for the whole authenticated product. Every auth.users row
-- gets exactly one profiles row, created automatically by trigger.

-- ---------------------------------------------------------------------------
-- Private schema for security-definer helpers
-- (Per Supabase security checklist: never put security-definer functions
-- in an exposed schema like public.)
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke usage on schema private from public;
revoke usage on schema private from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Role enum
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('homeowner', 'realtor', 'admin');

-- ---------------------------------------------------------------------------
-- profiles table
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         public.user_role not null default 'homeowner',
  display_name text,
  email        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

comment on table public.profiles is
  'Application-level user profile. One row per auth.users row, created automatically on signup.';
comment on column public.profiles.role is
  'Role gate for the app. New signups default to homeowner; admin promotes to realtor/admin.';

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profiles row when a new auth.users row is inserted.
-- Lives in the private schema (security definer + not callable as RPC).
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
security definer
set search_path = ''
language plpgsql
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'display_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Read: a user can read their own row.
-- Admin reads happen via service-role on the server side (no RLS policy needed).
create policy "users read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Update: a user can update their own row, but column grants below restrict
-- which columns are actually writable (display_name only).
create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Grants
-- Column-level UPDATE prevents users from changing their own role or email
-- via the Data API. Role/email changes require service-role (admin flow).
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
-- No anon access. Profiles are never readable without a session.
