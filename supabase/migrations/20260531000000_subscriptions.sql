-- Subscriptions table — tracks Stripe Subscription state for our users.
--
-- Source of truth: Stripe. This table is a read-only-by-app mirror, kept in
-- sync by the `stripe-webhook` edge function (service-role writes). Users
-- read their own rows, admins read all. Nobody writes from app code — only
-- the webhook handler does.
--
-- Lifecycle: one row per Stripe Subscription (unique on stripe_subscription_id).
-- A user may accumulate multiple rows over time (canceled → re-subscribed);
-- "current" is the most recent row with status in ('active','trialing','past_due').

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  -- Our internal tier slug (matches the lookup_key mapping in the edge
  -- function). 'plus' today; 'pro' / future tiers later.
  tier text not null,
  -- Mirrors Stripe Subscription.status: incomplete, incomplete_expired,
  -- trialing, active, past_due, canceled, unpaid, paused.
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);

-- Keep updated_at fresh on every row mutation.
create or replace function public.subscriptions_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.subscriptions_set_updated_at();

-- RLS: reads only. All writes go through the service role (webhook handler).
alter table public.subscriptions enable row level security;

create policy "users read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "admins read all subscriptions"
  on public.subscriptions for select
  using (private.is_admin());

-- No insert/update/delete policies for normal users — service-role bypasses
-- RLS entirely, which is what the webhook function uses. App code only ever
-- reads.
