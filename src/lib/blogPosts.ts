/**
 * Sample blog posts. Replace with CMS-backed query in Phase 3.
 * The shape is intentionally close to what a Supabase `posts` table will
 * return so the migration is a data-source swap, not a UI change.
 */

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  body: string
  tag: string
  publishedAt: string
  readingMinutes: number
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'biweekly-vs-extra-principal',
    title: 'When biweekly payments actually beat extra principal',
    excerpt:
      "They're often pitched as the same thing. They aren't. Here's when each one wins, and how to pick the right lever for your situation.",
    tag: 'Strategy',
    publishedAt: '2026-04-22',
    readingMinutes: 6,
    body: `If you've talked to a lender about paying off your house faster, you've probably heard about
two strategies: paying extra principal each month, or switching to **biweekly payments**. They're
often pitched as identical. They're not.

## What "biweekly" actually does

When you pay biweekly, you make a payment every two weeks instead of once a month. That's 26
half-payments per year — equivalent to **13 full monthly payments** instead of 12. The math is
simple: one extra full payment per year, applied entirely to principal.

That extra payment shaves several years off a typical 30-year mortgage. But here's the catch:
**you're not actually paying biweekly to the bank** in most cases. The servicer holds your half-payment
in escrow and applies a full payment monthly. The "biweekly" framing is mostly a savings discipline
trick to make the extra payment feel automatic.

## Extra principal — the same idea, less ceremony

You can replicate the biweekly outcome by adding 1/12 of a payment (~8.3% extra) to each monthly
payment. Same principal reduction, no service fees, no setup.

So when does biweekly actually win?

- **You get paid biweekly.** The cadence matches your cash flow. Setting aside a half-payment from
each paycheck is easier than budgeting an extra 8% from a monthly check.
- **You struggle with willpower.** Auto-debiting half a payment every two weeks removes the decision.
The "extra" is invisible.
- **Your servicer applies payments biweekly** (rare — most don't).

## When extra principal wins

- **You can pay more than 8% extra.** Biweekly only gets you 8.3%. If you can afford $200, $400,
or $1,000 a month, just pay it directly to principal.
- **You want flexibility.** Some months are tight; some have surplus. Manual extra payments adapt.
- **You want the savings up front.** Front-loading extra principal in years 1–5 saves dramatically
more interest than spreading it across 30 years.

## The rule of thumb

If you're not yet paying extra at all, biweekly is a great forcing function. If you're already in
the habit of paying extra, just pay extra — every dollar you control directly is a dollar working
harder than 1/12 spread across a year.

Run both scenarios in our [calculator](/calculator) and compare side by side.`,
  },
  {
    slug: 'recast-vs-refinance',
    title: 'What a recast is, and when to use one',
    excerpt:
      "A lump sum doesn't lower your monthly payment unless you ask. The thirty-second version, then the deep one.",
    tag: 'Explainer',
    publishedAt: '2026-04-08',
    readingMinutes: 5,
    body: `If you make a large lump-sum payment toward your mortgage, what happens to your monthly payment?

**Nothing.** Your monthly stays the same. Your loan just pays off earlier.

Most people don't realize this. Here's what to do about it.

## What "recasting" means

A **mortgage recast** (sometimes called a re-amortization) is when your servicer recalculates your
monthly payment based on your current, lower balance — at your existing interest rate. The result:
a lower monthly payment, same loan terms, same payoff timeline.

It's the opposite of a refinance. You're not changing the rate. You're not getting a new loan. You're
just asking: "given that I now owe less, what would my monthly payment be?"

## When a recast makes sense

- You came into a windfall — bonus, inheritance, business sale, RSU vest — and put it toward the mortgage
- Your rate is **lower** than current market rates (refinancing would raise your rate)
- You want to free up monthly cash flow without restarting the clock on a new 30-year term
- Your servicer charges a small one-time fee (typically $150–500) instead of the thousands a refi costs

## When it doesn't

- Your rate is **higher** than current market rates — refinance instead, you'll save more
- You don't have a lump sum to put down (recasts usually require a $5–10k minimum payment first)
- Your loan type doesn't allow it — VA, USDA, and most government-backed loans can't be recast

## The decision tree

1. **Do I have a lump sum to apply?** No → just pay extra principal monthly
2. **Is my current rate lower than market?** No → refinance instead
3. **Will I stay in this house >5 more years?** No → recast probably not worth the fee
4. **Yes to all three** → call your servicer and ask about recasting

The combination of "low rate locked in + want lower monthly payment + have cash" is the sweet spot.
That's where recast wins.`,
  },
  {
    slug: 'equity-isnt-cash',
    title: "Equity isn't cash — until you make it cash",
    excerpt:
      'The four ways homeowners actually access equity, and what each one costs in interest, time, and risk.',
    tag: 'Explainer',
    publishedAt: '2026-03-18',
    readingMinutes: 7,
    body: `Your home is worth more than you owe on it. That difference — your **equity** — shows up on
your net worth statement as a real number. But it's not cash. You can't pay your kid's tuition with it.
You can't fix a broken HVAC.

Here are the four ways homeowners turn equity into actual money, and what each one costs.

## 1. Sell the house

The cleanest path. You realize 100% of your equity, minus closing costs (~6–8%) and any capital gains
tax above the homeowner exemption.

**Best when:** you're moving anyway, or your home no longer fits your life.
**Cost:** the home itself.

## 2. Cash-out refinance

You replace your existing mortgage with a new, larger one and pocket the difference. If your home is
worth $500k and you owe $300k, you might refi into a $400k loan and walk away with $100k.

**Best when:** current rates are lower than your existing rate, or close to it.
**Cost:** closing costs (2–4% of the new loan), a new amortization clock, and interest on the cashed-out
amount for the life of the loan. If rates are *higher* than your current rate, you're paying that
higher rate on your *entire* balance — which usually wipes out the gain.

## 3. Home equity line of credit (HELOC)

A revolving credit line secured by your home. You draw what you need, pay interest only on what you
use, and repay over time.

**Best when:** you need flexible access (renovations, emergency fund, tuition timed across years).
**Cost:** typically variable rate (rises with the market), a draw period followed by a repayment
period that often spikes the monthly payment, and your house is collateral. Default = foreclosure.

## 4. Home equity loan (second mortgage)

A fixed-rate, fixed-term loan against your equity. Lump sum at close, predictable monthly payments.

**Best when:** you know the exact amount you need and want a fixed payment.
**Cost:** higher rate than your primary mortgage (it's a junior lien), and again — your house is
collateral.

## The thing nobody mentions

All four options *except selling* are loans. They look like access to your equity, but they're
debt secured by your home. You're trading equity for liquidity, and paying interest for the privilege.

This is why **building** equity matters more than tracking it. The number on your statement is real
— but it only becomes useful when you have a plan for what to do with it that doesn't undo all the
work you did to build it.`,
  },
  {
    slug: 'velocity-banking',
    title: 'Velocity banking, demystified',
    excerpt:
      "It's not magic. It's arithmetic. We pull apart the math and show what actually moves — and where the strategy quietly fails.",
    tag: 'Strategy',
    publishedAt: '2026-02-26',
    readingMinutes: 8,
    body: `Velocity banking is a payoff strategy that gets aggressive marketing online: "pay off your
30-year mortgage in 7 years!" The pitch usually involves a HELOC, a "chunking" payment, and a lot of
breathless YouTube energy.

Underneath all of that, it's actually a math-y idea worth understanding — even if you don't use it.

## The core mechanic

The strategy works in three steps:

1. Open a HELOC against your home equity
2. Use the HELOC to make a large lump-sum principal payment on your mortgage (a "chunk")
3. Aggressively pay down the HELOC balance using your monthly cash flow

Repeat steps 2 and 3 as the HELOC pays down and equity builds back up.

## Why it can work

The trick is that you're shifting where your monthly *interest* gets calculated. A HELOC's interest is
calculated on the *average daily balance* — meaning if your paycheck lands in the HELOC and your
expenses leave throughout the month, the interest is calculated on a smaller average balance than a
traditional savings/checking + mortgage setup.

You're using the HELOC as a **substitute checking account** that also services debt. Cash sits there
reducing the balance until you spend it.

## Why it usually doesn't beat plain extra principal

The math falls apart in three places:

1. **HELOC rates are usually higher than mortgage rates.** If your mortgage is 6% and your HELOC is
9%, the HELOC interest you're paying often exceeds the mortgage interest you're saving.

2. **HELOCs have variable rates.** A HELOC at today's rate might look great. A HELOC at next year's
rate (after a Fed move) might destroy the strategy.

3. **The discipline gap.** Velocity banking requires unwavering month-over-month execution. If you
miss a paycheck, get sick, or have an emergency, the HELOC balance lingers and the math inverts. Plain
extra principal payments don't have this risk — every dollar paid is permanently applied.

## The honest version

If your HELOC rate is meaningfully *lower* than your mortgage rate, velocity banking can squeeze out
real savings. If it's higher (the typical case in 2026), you're paying for the appearance of
sophistication.

The simpler strategy — automate $200–500/month in extra principal, leave it alone, and let
compounding work — beats velocity banking in the vast majority of real-world cases. Cleaner math,
zero variable-rate risk, no HELOC origination fees, and no execution overhead.

When something is marketed as a secret, it's usually marketing.`,
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function listPostsByDateDesc(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
