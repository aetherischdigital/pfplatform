import { ArrowRight, Calculator, Home, LineChart, Users, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import EquityChart from '../../components/EquityChart'

type Section = {
  eyebrow: string
  title: string
  body: string
  bullets: string[]
  icon: LucideIcon
  visual: 'pfs' | 'equity' | 'payoff' | 'realtor' | 'learn'
}

const sections: Section[] = [
  {
    eyebrow: 'Step 01',
    title: 'The PFS as your spine.',
    body: "Here's where everything starts. The Personal Financial Statement is the instrument a banker uses to evaluate a borrower. We turn it the other way around — into the living spine of your dashboard, so every payoff projection, prepayment plan, and equity report draws from one consistent picture of your finances.",
    bullets: [
      'Assets: home, retirement, cash, vehicles, other holdings',
      'Liabilities: mortgages, loans, credit lines with current balances',
      'Income and expenses, at the level of detail you choose',
    ],
    icon: Home,
    visual: 'pfs',
  },
  {
    eyebrow: 'Step 02',
    title: 'Your amortization schedule — the one the bank should agree with.',
    body: "Never forget this: your loan has nothing to do with years or months. Every fixed-rate loan resolves to a numbered list of payments, each with a precise principal and interest split decided the day the Note is signed. We generate that schedule for you, store it as your ledger, and project equity off of it. The bank's statement should match — and if it doesn't, that's news you want.",
    bullets: [
      'Full payment-by-payment amortization, generated from your Note',
      'Equity projection grounded in checkable math, not a forecast',
      'Reconcile each monthly statement against the ledger to catch errors',
    ],
    icon: LineChart,
    visual: 'equity',
  },
  {
    eyebrow: 'Step 03',
    title: 'Prepay with confidence.',
    body: "The more additional principal you send, the faster the loan is retired. The platform tells you exactly what your balance should be after each additional payment. So you're not paying ahead, you're retiring your mortgage early.",
    bullets: [
      'All additional principal prepayments accelerate the loan',
      'Compare your balance against your monthly statement to check for accuracy',
      'Every prepayment updates your projected payoff and interest saved',
    ],
    icon: Calculator,
    visual: 'payoff',
  },
  {
    eyebrow: 'For realtors',
    title: 'Stay top-of-mind long after closing.',
    body: 'Manage a roster of homeowner clients, view their plans with permission, and become the long-term advisor instead of the one-time transaction. Submit property-value updates, send reminders, and share payoff progress on a cadence you set.',
    bullets: [
      'Invite clients with one link; they keep ownership of their data',
      'View — or, with permission, edit — their dashboard side by side with yours',
      'Reminder templates and branded reports for after-closing touchpoints',
    ],
    icon: Users,
    visual: 'realtor',
  },
  {
    eyebrow: 'Always-on',
    title: 'Education built around the methodology.',
    body: 'Articles, calculators, and walkthroughs that explain why the prepayment workflow works — when biweekly programs are a marketing trick, when a refinance is actually worth it, how to catch a servicer transfer that loses a payment in the seam.',
    bullets: [
      'Plain-English deep-dives on prepayment, PMI, servicer transfers',
      'When is a refinance feasible and beneficial?',
      'Public mortgage payoff calculator — no account required',
      'New content as the platform grows',
    ],
    icon: BookOpen,
    visual: 'learn',
  },
]

export default function HowItWorks() {
  return (
    <>
      <section className="bg-gradient-to-b from-surface-50 to-white">
        <Container className="py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-accent-600">How it works</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-5xl font-semibold tracking-tight text-surface-900 sm:text-6xl">
            From a Note at closing to a ledger you control for the next thirty years.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-surface-500">
            Five tools, one product. The PFS, the amortization schedule, the prepayment workflow, the realtor surface, and the
            education that explains the math.
          </p>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="space-y-24 py-20">
          {sections.map((s, i) => {
            const reversed = i % 2 === 1
            const Icon = s.icon
            return (
              <div
                key={s.title}
                id={s.visual === 'realtor' ? 'realtors' : undefined}
                className={`scroll-mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${
                  reversed ? 'lg:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface-900 text-accent-400">
                    <Icon size={18} />
                  </div>
                  <p className="mt-5 font-mono text-xs uppercase tracking-wider text-accent-600">
                    {s.eyebrow}
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
                    {s.title}
                  </h2>
                  <p className="mt-4 text-surface-500">{s.body}</p>
                  <ul className="mt-6 space-y-2.5">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex gap-3 text-sm text-surface-700">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-500" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <SectionVisual kind={s.visual} />
              </div>
            )
          })}
        </Container>
      </section>

      <section className="bg-surface-50">
        <Container className="py-20 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
            Ready to start your ledger?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-surface-500">
            Five minutes of input gets you your full amortization schedule and a dashboard you'll actually use. No card, no commitment.
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

function SectionVisual({ kind }: { kind: Section['visual'] }) {
  if (kind === 'equity') {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-lg">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-surface-500">
              Projected equity
            </div>
            <div className="mt-1 font-display text-3xl font-semibold text-surface-900">$312,400</div>
          </div>
          <span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700">
            +$48k / yr
          </span>
        </div>
        <div className="mt-5 h-40">
          <EquityChart className="h-full w-full" />
        </div>
      </div>
    )
  }

  if (kind === 'pfs') {
    const rows = [
      { label: 'Primary residence', value: '$485,000', kind: 'asset' },
      { label: 'Retirement (401k)', value: '$142,800', kind: 'asset' },
      { label: 'Cash', value: '$28,400', kind: 'asset' },
      { label: 'Mortgage balance', value: '−$312,500', kind: 'liab' },
      { label: 'Auto loan', value: '−$18,200', kind: 'liab' },
    ]
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-lg">
        <div className="mb-4 flex items-baseline justify-between">
          <h4 className="font-display text-base font-semibold text-surface-900">Net worth</h4>
          <span className="font-mono text-2xl font-semibold text-surface-900">$325,500</span>
        </div>
        <ul className="divide-y divide-surface-200 border-y border-surface-200">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between py-3">
              <span className="text-sm text-surface-700">{r.label}</span>
              <span
                className={`font-mono text-sm ${
                  r.kind === 'asset' ? 'text-surface-900' : 'text-surface-500'
                }`}
              >
                {r.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (kind === 'payoff') {
    const scenarios = [
      { name: 'Baseline', years: '30 yr 0 mo', interest: '$248,400', highlight: false },
      { name: '+$100/mo to principal', years: '26 yr 8 mo', interest: '$210,800', highlight: false },
      { name: '+$200/mo to principal', years: '24 yr 8 mo', interest: '$182,100', highlight: true },
    ]
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-lg">
        <h4 className="font-display text-base font-semibold text-surface-900">Scenarios</h4>
        <div className="mt-4 space-y-2">
          {scenarios.map((s) => (
            <div
              key={s.name}
              className={`rounded-lg border p-4 ${
                s.highlight
                  ? 'border-accent-400 bg-accent-100/50'
                  : 'border-surface-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-surface-900">{s.name}</span>
                <span className="font-mono text-xs text-surface-500">{s.years}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-surface-500">Total interest</span>
                <span className="font-mono text-sm text-surface-900">{s.interest}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (kind === 'realtor') {
    const clients = [
      { name: 'Maya Patel', status: 'On track', years: '8.4y sooner' },
      { name: 'Daniel Cho', status: 'Awaiting input', years: '—' },
      { name: 'The Reyes Family', status: 'On track', years: '11.1y sooner' },
      { name: 'Jordan Lee', status: 'Behind plan', years: '4.2y sooner' },
    ]
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-base font-semibold text-surface-900">Your clients</h4>
          <span className="font-mono text-xs text-surface-500">4 active</span>
        </div>
        <ul className="mt-4 divide-y divide-surface-200 border-t border-surface-200">
          {clients.map((c) => (
            <li key={c.name} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium text-surface-900">{c.name}</div>
                <div className="text-xs text-surface-500">{c.status}</div>
              </div>
              <span className="font-mono text-xs text-accent-600">{c.years}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (kind === 'learn') {
    const posts = [
      { tag: 'Strategy', title: 'When biweekly payments actually beat extra principal' },
      { tag: 'Calculator', title: 'See your payoff date in under 60 seconds' },
      { tag: 'Explainer', title: 'Refinance — when is it beneficial to use one' },
    ]
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-lg">
        <h4 className="font-display text-base font-semibold text-surface-900">Insights</h4>
        <ul className="mt-4 space-y-3">
          {posts.map((p) => (
            <li key={p.title} className="rounded-lg border border-surface-200 p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-accent-600">
                {p.tag}
              </div>
              <div className="mt-1 text-sm font-medium text-surface-900">{p.title}</div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return null
}
