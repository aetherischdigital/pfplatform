import { ArrowRight, Calculator, Home, LineChart, Users, ShieldCheck, Sparkles } from 'lucide-react'
import Container from '../../components/ui/Container'
import { ButtonLink } from '../../components/ui/Button'
import EquityChart from '../../components/EquityChart'
import { BRAND } from '../../config/brand'

const features = [
  {
    icon: Calculator,
    title: 'Mortgage payoff strategy',
    body: 'See exactly how a few extra dollars a month shaves years off your mortgage. Run scenarios side by side.',
  },
  {
    icon: LineChart,
    title: 'Equity projection',
    body: 'Watch equity grow over time with realistic appreciation, principal paydown, and refinance scenarios.',
  },
  {
    icon: Home,
    title: 'Personal Financial Statement',
    body: 'A living PFS — assets, liabilities, income, expenses — that updates as your finances do.',
  },
  {
    icon: Users,
    title: 'Built for realtors too',
    body: 'Manage a roster of clients, share custom payoff plans, and stay top-of-mind long after closing.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Build your snapshot',
    body: 'Enter your home, mortgage, income, and obligations once. Five minutes to a complete picture.',
  },
  {
    n: '02',
    title: 'See your trajectory',
    body: 'A personalized payoff date, projected equity curve, and the monthly moves that change them.',
  },
  {
    n: '03',
    title: 'Adjust and act',
    body: 'Test extra principal, biweekly payments, and recasts. Pick the plan you can actually live with.',
  },
]

const faqs = [
  {
    q: 'Is this financial advice?',
    a: `No. ${BRAND.name} is an educational tool. We model scenarios so you can have better conversations with your lender, planner, or realtor.`,
  },
  {
    q: 'Do I need a realtor to use it?',
    a: `Nope. ${BRAND.name} works for any homeowner. If your realtor is on the platform, they can share custom plans with you — but solo is the default.`,
  },
  {
    q: 'What happens to my data?',
    a: 'Your financial data is yours. We use bank-grade encryption at rest and in transit, and we never sell or share your information.',
  },
  {
    q: 'How is this different from a spreadsheet?',
    a: `A spreadsheet shows you a number. ${BRAND.name} shows you the path — what to change, by how much, and what it costs you to wait.`,
  },
]

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-50 to-white">
        <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,_rgba(184,148,90,0.12),transparent_60%)]" />
        <Container className="py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-3 py-1 text-xs font-medium text-surface-600 shadow-sm">
                <Sparkles size={12} className="text-accent-500" />
                Built for homeowners and the realtors who serve them
              </div>
              <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-surface-900 sm:text-6xl">
                Pay off your home <span className="text-accent-500">10 years sooner.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-surface-500">
                {BRAND.name} turns your mortgage, income, and equity into a single picture —
                then shows you the moves that change it. Free to start.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/signup" variant="primary" size="lg">
                  Start free <ArrowRight size={16} />
                </ButtonLink>
                <ButtonLink to="/how-it-works" variant="secondary" size="lg">
                  See how it works
                </ButtonLink>
              </div>
              <div className="flex items-center gap-6 pt-2 text-xs text-surface-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-surface-500" />
                  Bank-grade encryption
                </div>
                <div>No card required</div>
              </div>
            </div>

            <HeroDashboardCard />
          </div>
        </Container>
      </section>

      {/* Trust strip */}
      <section className="border-y border-surface-200 bg-white">
        <Container className="py-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <Stat value="$184k" label="Avg. interest saved per user (modeled)" />
            <Stat value="9.4 yrs" label="Avg. payoff acceleration (modeled)" />
            <Stat value="100%" label="Of your data, owned by you" />
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="bg-white">
        <Container className="py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
              Everything you need to plan around the biggest asset you own.
            </h2>
            <p className="mt-4 text-surface-500">
              Four tightly-built tools that work together — not a sprawling spreadsheet you'll never open.
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

      {/* How it works */}
      <section className="bg-surface-50">
        <Container className="py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-accent-600">How it works</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-surface-900 sm:text-4xl">
                Three steps to a real plan.
              </h2>
              <p className="mt-4 text-surface-500">
                You don't need to be a financial expert. You need a tool that asks the right questions
                and shows you the consequences.
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
                The cost of waiting another month? About six.
              </h2>
              <p className="mt-3 text-surface-300">
                Every month you wait to optimize compounds against you. Try the calculator and see for yourself.
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
            See your payoff date.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-surface-500">
            Five minutes of input. A plan you can actually use. Free for as long as you need it.
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
