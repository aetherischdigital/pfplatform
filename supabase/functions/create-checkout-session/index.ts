// Create a Stripe Checkout Session for the authenticated user.
//
// Called from the client via supabase.functions.invoke('create-checkout-session', ...)
// Returns { url } for the browser to redirect into Stripe-hosted checkout.
//
// Required env (set via `supabase secrets set` or `supabase/functions/.env`):
//   STRIPE_SECRET_KEY              sk_test_…
//
// Prices are identified by Stripe `lookup_key`, set on each Price in the
// Stripe Dashboard. No Price IDs in env / source — lookup_keys survive
// Price rotations and stay consistent across test/live environments.
//
// Auto-injected by Supabase runtime:
//   SUPABASE_URL, SUPABASE_ANON_KEY

import Stripe from 'https://esm.sh/stripe@17.5.0?target=denonext'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  })

type Body = {
  tier?: string
  returnUrl?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  // Verify the caller against Supabase auth. Passing the user's JWT through
  // means RLS would apply if we touched any tables here (we don't yet).
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return json({ error: 'Not authenticated' }, 401)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { tier, returnUrl } = body
  if (!returnUrl) return json({ error: 'returnUrl is required' }, 400)

  // Tier → Stripe Price `lookup_key`. The lookup_key is set on the Price
  // itself in the Stripe Dashboard (Products → Plus → Price → Edit price
  // → API ID / lookup key). Stripe's recommendation for stable identification.
  const lookupKey = (() => {
    switch (tier) {
      case 'plus':
        return 'plus_monthly'
      default:
        return undefined
    }
  })()
  if (!lookupKey) return json({ error: `Unknown tier: ${tier}` }, 400)

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) return json({ error: 'Stripe is not configured' }, 500)

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  })

  // Resolve lookup_key → Price ID. Stripe-recommended pattern: prices can be
  // renumbered without breaking deploys; only the lookup_key has to stay stable.
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    expand: ['data.product'],
  })
  const price = prices.data[0]
  if (!price) {
    return json(
      { error: `No active Price with lookup_key=${lookupKey}. Set it in the Stripe Dashboard.` },
      500,
    )
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price.id, quantity: 1 }],
      // CHECKOUT_SESSION_ID is substituted by Stripe on redirect — we can
      // later look it up via stripe.checkout.sessions.retrieve() to confirm.
      success_url: `${returnUrl}?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?stripe=cancel`,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      // Echo onto the resulting Subscription too so a future webhook handler
      // can map the Stripe customer/subscription back to our user.
      metadata: { user_id: user.id, tier },
      subscription_data: {
        metadata: { user_id: user.id, tier },
      },
    })
    return json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stripe error'
    return json({ error: message }, 502)
  }
})
