import { ArrowRight, FileText, ListChecks, ScanSearch, Wallet, Users, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import EquityChart from '../../components/EquityChart'
import { BRAND } from '../../config/brand'

const features = [
  {
    icon: FileText,
    title: 'A living Personal Financial Statement',
    body: 'Assets, liabilities, income, expenses — the same instrument a banker uses, set up as the spine of your dashboard so every projection has real numbers behind it.',
  },
  {
    icon: ListChecks,
    title: 'Your amortization, line by line',
    body: 'Every scheduled payment as a numbered row, with the exact principal and interest split for each. The source of truth your bank should agree with — and the basis for everything else.',
  },
  {
    icon: ScanSearch,
    title: 'Prepay in exact principal amounts',
    body: 'Knock future payments off the schedule by paying their principal portion now. The platform tells you the exact dollar amount and prints the check label — no rounding, no drift, no fee programs.',
  },
  {
    icon: Wallet,
    title: 'Finding Hidden Money',
    body: "Most homeowners have an extra mortgage payment hidden in their paycheck every year. We help you find it — in your pay cycle, your tax refund, your monthly budget — and put it to work on principal.",
  },
]

const steps = [
  {
    n: '01',
    title: 'Build your ledger',
    body: 'Enter your loan terms once. The platform generates your full amortization schedule and turns it into a living ledger you control.',
  },
  {
    n: '02',
    title: 'Pay smart',
    body: "Make prepayments in the exact principal amount of upcoming scheduled payments. Each one retires a future payment entirely — no math, no drift.",
  },
  {
    n: '03',
    title: 'Audit, adjust, repeat',
    body: "Each statement, compare what the bank says against what your ledger says. Catch mismatches early; we'll help you write the letter.",
  },
]

const faqs = [
  {
    q: 'Is this financial advice?',
    a: `No. ${BRAND.name} is a tool, not an advisor. We model scenarios and surface the math so you can have better conversations with your lender, planner, or realtor.`,
  },
  {
    q: 'Why a manual ledger? Why not auto-sync from my bank?',
    a: `By design. Auto-sync makes the bank's numbers feel like ground truth — but the whole point is to audit those numbers. The platform tracks what should be true; you enter what your statement says is true. The mismatch is where the value lives.`,
  },
  {
    q: 'Do I need a realtor to use it?',
    a: `Nope. ${BRAND.name} works for any homeowner. If your realtor is on the platform, they can share custom plans with you — but solo is the default.`,
  },
  {
    q: 'What happens to my data?',
    a: 'Your financial data is yours. Encrypted at rest and in transit, no bank logins required, no third-party syncing, export anytime. We never sell or share it.',
  },
]

export default function Landing() {
  return (
    <>
      {/* Hero — dark canvas with warm radial accent */}
      <section className="relative isolate overflow-hidden bg-surface-900">
        {/* Warm walnut radial in the upper-right for depth */}
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-32 h-[36rem] w-[36rem] -z-10 rounded-full bg-[radial-gradient(circle,_rgba(168,133,99,0.35)_0%,_transparent_60%)] blur-3xl"
        />
        {/* Subtle sage wash in the lower-left to ground the composition */}
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-40 h-[40rem] w-[40rem] -z-10 rounded-full bg-[radial-gradient(circle,_rgba(95,111,90,0.28)_0%,_transparent_65%)] blur-3xl"
        />
        {/* Faint vertical gradient to deepen the foot of the hero */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-surface-900/60"
        />
        <Container className="relative py-28 lg:py-40">
          <div className="max-w-2xl space-y-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <Sparkles size={12} className="text-accent-200" />
              A homeowner's ledger — and a check on the bank's math
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Audit your mortgage.
              <br />
              <span className="text-accent-200 italic">Pay it off years sooner.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/80">
              Did you know your bank can make mistakes on your mortgage? It happens more often than you'd think
              — and almost nobody catches it. {BRAND.name} gives you the tools to balance your mortgage the same
              way you balance your checkbook, so every error stops costing you the moment it happens.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/signup" variant="accent" size="lg">
                Start free <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink
                to="/how-it-works"
                variant="ghost"
                size="lg"
                className="border border-white/30 !text-white hover:!bg-white/10"
              >
                See how it works
              </ButtonLink>
            </div>
            <div className="flex items-center gap-6 pt-2 text-xs text-white/60">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} />
                No bank logins required
              </div>
              <div>No card required</div>
            </div>
          </div>
        </Container>
      </section>

      {/* What you'll see when you log in */}
      <section className="bg-surface-50">
        <Container className="py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-accent-600">
                What you'll see when you log in
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
                Your equity, your payoff date, and the moves that change them.
              </h2>
              <p className="mt-4 text-surface-500">
                Every number on your dashboard is grounded in the amortization schedule generated from your Note —
                so when the bank's statement disagrees, you'll know who to call and what to point at.
              </p>
            </div>
            <HeroDashboardCard />
          </div>
        </Container>
      </section>

      {/* Trust strip */}
      <section className="border-y border-surface-200 bg-white">
        <Container className="py-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <Stat value="$184k" label="Interest saved (modeled)" />
            <Stat value="9.4 yrs" label="Payoff acceleration (modeled)" />
            <Stat value="0" label="Bank logins required" />
          </div>
          <p className="mt-6 text-center text-xs text-surface-400">
            Modeled on a $400,000 30-year fixed at 6.5% with $250/month redirected to principal as exact-amount prepayments.
            Run your own numbers in the <Link to="/calculator" className="underline decoration-surface-300 underline-offset-2 hover:text-surface-600">calculator</Link>.
          </p>
        </Container>
      </section>

      {/* Features */}
      <section className="bg-white">
        <Container className="py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
              Here's the key: your loan has nothing to do with years or months.
            </h2>
            <p className="mt-4 text-surface-500">
              A 30-year mortgage is just 360 numbered payments, each broken down to the penny.
              The faster you complete them, the sooner you own your home. These four tools work together
              to help you do exactly that.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-surface-200 bg-white p-7 shadow-card transition-shadow hover:shadow-card-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-900 text-accent-400 group-hover:bg-surface-800">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-surface-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-500">{f.body}</p>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* For realtors — thin strip between features and section-break */}
      <section className="bg-accent-100/60">
        <Container className="py-12">
          <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-900 text-accent-400">
                <Users size={18} />
              </div>
              <div className="max-w-2xl">
                <h3 className="font-display text-xl font-semibold text-surface-900 sm:text-2xl">
                  For realtors who want to be more than the closing handshake.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600">
                  Stay in your clients' financial lives the way a trusted advisor should — with the
                  tools to actually be useful between transactions. Manage a roster, submit value
                  updates, share custom plans.
                </p>
              </div>
            </div>
            <ButtonLink to="/how-it-works" variant="secondary" size="md" className="flex-shrink-0">
              How realtors use it <ArrowRight size={14} />
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Section break — pull-quote over photo */}
      <section className="relative isolate overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=2400&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 -z-10 bg-surface-900/60" />
        <Container className="relative py-28 lg:py-36">
          <blockquote className="max-w-3xl">
            <p className="font-display text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              You're not <span className="italic text-accent-200">paying ahead.</span> You're permanently retiring a numbered payment from the schedule.
            </p>
            <footer className="mt-6 font-mono text-xs uppercase tracking-wider text-white/60">
              The methodology, in one sentence
            </footer>
          </blockquote>
        </Container>
      </section>

      {/* How it works */}
      <section className="bg-surface-50">
        <Container className="py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-accent-600">How it works</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
                Three steps. Then repeat for thirty years.
              </h2>
              <p className="mt-4 text-surface-500">
                You don't need to be a financial expert. You need a tool that owns the math, surfaces the choices,
                and keeps the bank honest while you do the rest of your life.
              </p>
            </div>
            <ol className="space-y-6">
              {steps.map((s) => (
                <li
                  key={s.n}
                  className="flex gap-6 rounded-xl border border-surface-200 bg-white p-6"
                >
                  <span className="font-mono text-sm text-accent-500">{s.n}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-surface-900">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-surface-500">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* Mid CTA */}
      <section className="bg-surface-900 text-white">
        <Container className="py-16">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Let's face the facts.
              </h2>
              <p className="mt-3 text-surface-300">
                A single $100 error in the first year of a 7% mortgage costs you over $800 by the time it
                pays off. Most homeowners never catch it. Of course this happens, more often than you'd think
                — and the bigger problem is that nobody's looking. You can be.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/calculator" variant="accent" size="lg">
                Try the calculator <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink to="/signup" variant="ghost" size="lg" className="!text-white hover:!bg-surface-800">
                Start free
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <Container size="md" className="py-24">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            Common questions.
          </h2>
          <dl className="mt-10 divide-y divide-surface-200 border-y border-surface-200">
            {faqs.map((f) => (
              <div key={f.q} className="grid gap-2 py-6 md:grid-cols-[1fr_2fr] md:gap-10">
                <dt className="font-display text-lg font-semibold text-surface-900">{f.q}</dt>
                <dd className="text-surface-500">{f.a}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-b from-white to-surface-50">
        <Container className="py-20 text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-surface-900 sm:text-5xl">
            Eliminating debt. <span className="italic text-accent-500">Creating ownership.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-surface-500">
            Five minutes of input. A schedule the bank should agree with, and the tools to keep them honest.
            Yours to use, free for as long as you need it.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/signup" variant="primary" size="lg">
              Start free <ArrowRight size={16} />
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-semibold tracking-tight text-surface-900">{value}</div>
      <div className="mt-1 text-sm text-surface-500">{label}</div>
    </div>
  )
}

function HeroDashboardCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-x-6 -inset-y-4 -z-10 rounded-[28px] bg-gradient-to-tr from-accent-100 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-lg">
        <div className="flex items-center justify-between border-b border-surface-200 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-surface-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-surface-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-surface-200" />
          </div>
          <span className="font-mono text-xs text-surface-400">{BRAND.domain}</span>
        </div>
        <div className="p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-surface-400">
                Projected equity
              </div>
              <div className="mt-1 font-display text-4xl font-semibold tracking-tight text-surface-900">
                $312,400
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              +$48,200 / yr
            </span>
          </div>
          <div className="mt-5 h-44">
            <EquityChart className="h-full w-full" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-surface-200 pt-4">
            <div>
              <div className="text-xs text-surface-400">Mortgage paid off</div>
              <div className="font-mono text-sm font-medium text-surface-900">April 2032</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-surface-400">vs. baseline</div>
              <div className="font-mono text-sm font-medium text-accent-600">10y 2m sooner</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
