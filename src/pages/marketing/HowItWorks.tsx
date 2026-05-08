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
    title: 'A complete picture of your finances, in one place.',
    body: 'The Personal Financial Statement is a banker\'s tool — assets, liabilities, income, expenses. We make it the spine of your dashboard so every recommendation has real numbers behind it.',
    bullets: [
      'Track home, accounts, vehicles, and other assets',
      'Mortgages, loans, and credit lines with live balances',
      'Income and expenses with the level of detail you want',
    ],
    icon: Home,
    visual: 'pfs',
  },
  {
    eyebrow: 'Step 02',
    title: 'See equity grow as it actually will.',
    body: 'Realistic appreciation, principal paydown, and refinance scenarios in one chart. Not a single line — a range, with assumptions you can challenge.',
    bullets: [
      'Conservative, expected, and aggressive projection bands',
      'See the impact of one-time and recurring extra principal',
      'Compare current path vs. optimized path side by side',
    ],
    icon: LineChart,
    visual: 'equity',
  },
  {
    eyebrow: 'Step 03',
    title: 'A payoff plan that actually fits your life.',
    body: 'Test biweekly payments, recasts, lump-sum scenarios, and round-up strategies. Pick the plan you\'ll actually stick to — not the most aggressive one on paper.',
    bullets: [
      'Side-by-side scenario comparison',
      'Total interest saved, broken out by strategy',
      'Calendar of triggered actions you can opt in to',
    ],
    icon: Calculator,
    visual: 'payoff',
  },
  {
    eyebrow: 'For realtors',
    title: 'Stay top-of-mind long after closing.',
    body: 'Manage your roster, share custom payoff plans with each client, and become the long-term trusted advisor instead of the one-time transaction.',
    bullets: [
      'Invite clients with one link',
      'View and edit their financial plan with their permission',
      'Branded reports you can send between meetings',
    ],
    icon: Users,
    visual: 'realtor',
  },
  {
    eyebrow: 'Always-on',
    title: 'Education that compounds.',
    body: 'Articles, calculators, and walkthroughs that turn an abstract concept ("equity") into something you can act on this month.',
    bullets: [
      'Plain-English deep-dives on payoff strategies',
      'Tools you can use without an account',
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
            From a number on a statement to a plan you can act on.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-surface-500">
            Five tools, one product. Built so each step makes the next one easier.
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
                className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${
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
            Ready to see your numbers?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-surface-500">
            Five minutes of input gets you a full picture. No card, no commitment.
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
            <div className="text-xs font-medium uppercase tracking-wider text-surface-400">
              Projected equity
            </div>
            <div className="mt-1 font-display text-3xl font-semibold text-surface-900">$312,400</div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
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
      { name: '+$200/mo principal', years: '24 yr 8 mo', interest: '$182,100', highlight: false },
      { name: 'Biweekly + $200', years: '21 yr 4 mo', interest: '$148,300', highlight: true },
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
          <span className="font-mono text-xs text-surface-400">4 active</span>
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
      { tag: 'Explainer', title: 'What a recast is, and when to use one' },
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
