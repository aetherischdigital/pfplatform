import { supabase } from './supabase'

// Mirror of public.subscriptions. Written exclusively by the stripe-webhook
// edge function (service role bypasses RLS); the app only reads.

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

export type Subscription = {
  id: string
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  tier: string
  status: SubscriptionStatus
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  createdAt: string
  updatedAt: string
}

type Row = {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  tier: string
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}

const toSubscription = (r: Row): Subscription => ({
  id: r.id,
  userId: r.user_id,
  stripeCustomerId: r.stripe_customer_id,
  stripeSubscriptionId: r.stripe_subscription_id,
  stripePriceId: r.stripe_price_id,
  tier: r.tier,
  status: r.status,
  currentPeriodStart: r.current_period_start,
  currentPeriodEnd: r.current_period_end,
  cancelAtPeriodEnd: r.cancel_at_period_end,
  canceledAt: r.canceled_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

/** A subscription that's still entitling the user — anything except hard
 *  terminal states. Past-due is included because grace-period dunning still
 *  counts as paid in Stripe's model. */
const ENTITLING_STATUSES = new Set<SubscriptionStatus>([
  'trialing',
  'active',
  'past_due',
])

export function isEntitling(s: Subscription | null): boolean {
  return !!s && ENTITLING_STATUSES.has(s.status)
}

/** Most recent subscription row for the current user. Could be active,
 *  canceled, etc. — callers decide what to do with it via isEntitling(). */
export async function fetchOwnSubscription(): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      'id,user_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,tier,status,current_period_start,current_period_end,cancel_at_period_end,canceled_at,created_at,updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Row>()
  if (error) throw error
  return data ? toSubscription(data) : null
}
