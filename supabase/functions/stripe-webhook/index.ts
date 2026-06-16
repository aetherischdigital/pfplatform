// Stripe webhook handler — keeps `public.subscriptions` in sync with Stripe.
//
// Required env (set via `supabase secrets set` or `supabase/functions/.env`):
//   STRIPE_SECRET_KEY              sk_test_… / sk_live_…
//   STRIPE_WEBHOOK_SECRET          whsec_…  (the signing secret of the
//                                            specific webhook endpoint
//                                            this function backs)
//
// Auto-injected by the Supabase runtime:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Why service role: webhook events don't carry a user JWT, but they need
// to write subscription rows owned by arbitrary users. Service role bypasses
// RLS so the handler can upsert against any user_id. The user_id is taken
// from the Stripe Subscription's `metadata.user_id`, which our checkout
// session creator sets at subscription creation time (see
// supabase/functions/create-checkout-session/index.ts).

import Stripe from 'https://esm.sh/stripe@17.5.0?target=denonext'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
  console.error('Missing required env: STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
}

const stripe = new Stripe(stripeKey ?? '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(supabaseUrl ?? '', serviceRoleKey ?? '')

// Unix epoch (seconds, nullable) → ISO timestamp string (nullable).
const tsFrom = (epoch: number | null | undefined): string | null =>
  epoch == null ? null : new Date(epoch * 1000).toISOString()

// Upsert a row for a Stripe Subscription. Used by every
// customer.subscription.* event — Stripe sends the full object each time,
// so the handler doesn't need to read prior state.
async function upsertSubscription(sub: Stripe.Subscription): Promise<void> {
  const userId = (sub.metadata?.user_id ?? '').trim()
  if (!userId) {
    console.warn(`stripe-webhook: subscription ${sub.id} has no metadata.user_id; skipping`)
    return
  }
  const tier = (sub.metadata?.tier ?? '').trim() || 'unknown'
  const priceId = sub.items.data[0]?.price.id ?? ''
  if (!priceId) {
    console.warn(`stripe-webhook: subscription ${sub.id} has no price id; skipping`)
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id:
          typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        tier,
        status: sub.status,
        current_period_start: tsFrom(sub.current_period_start),
        current_period_end: tsFrom(sub.current_period_end),
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: tsFrom(sub.canceled_at),
      },
      { onConflict: 'stripe_subscription_id' },
    )
  if (error) throw error
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405 })
  }

  const signature = req.headers.get('Stripe-Signature')
  if (!signature) {
    return new Response('Missing Stripe-Signature header', { status: 400 })
  }

  // constructEventAsync needs the raw body text (NOT JSON.parse'd) to
  // recompute the HMAC signature.
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret ?? '',
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'bad signature'
    console.warn(`stripe-webhook: signature verification failed: ${message}`)
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertSubscription(event.data.object as Stripe.Subscription)
        break
      }
      default:
        // Ignore everything else. Stripe sends a lot of events we don't
        // care about (charge.*, invoice.*, payment_intent.*) — they'd all
        // become noise. If we need invoice-level granularity later
        // (failed payment, dunning, etc.) we can add cases here.
        break
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    // Return 5xx so Stripe retries — better than dropping the event silently.
    const message = err instanceof Error ? err.message : 'handler error'
    console.error(`stripe-webhook: handler error on ${event.type}:`, message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
})
