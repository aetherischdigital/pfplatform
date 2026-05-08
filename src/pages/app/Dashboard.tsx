import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react'
import {
  MOCK_PROFILE,
  MOCK_ASSETS,
  MOCK_LIABILITIES,
  MOCK_MORTGAGE,
  totals,
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
} from '../../lib/mockData'
import { projectEquity } from '../../lib/equity'
import {
  compareScenarios,
  formatUSD,
  formatYearsMonths,
  payoffDate,
} from '../../lib/mortgage'
import EquityProjectionChart from '../../components/EquityProjectionChart'
import { ButtonLink } from '../../components/ui/Button'

export default function Dashboard() {
  const t = totals()

  const points = projectEquity({
    startingHomeValue: MOCK_MORTGAGE.startingHomeValue,
    startingBalance: MOCK_MORTGAGE.balance,
    annualAppreciationPct: 3,
    annualRatePct: MOCK_MORTGAGE.ratePct,
    monthlyPayment: MOCK_MORTGAGE.monthlyPayment,
    extraPrincipal: MOCK_MORTGAGE.extraPrincipal,
    months: MOCK_MORTGAGE.termMonthsRemaining,
  })
  const peakEquity = points[points.length - 1].equity

  const scenario = compareScenarios(
    MOCK_MORTGAGE.balance,
    MOCK_MORTGAGE.ratePct,
    MOCK_MORTGAGE.monthlyPayment,
    MOCK_MORTGAGE.extraPrincipal,
  )

  const greeting = greetingForNow()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
            {greeting}, {firstName(MOCK_PROFILE.name)}.
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Here's where you stand today and where you're heading.
          </p>
        </div>
        <span className="self-start rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-600">
          Demo data — not yet wired to a real backend
        </span>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Net worth"
          value={formatUSD(t.netWorth)}
          delta="+$48k YoY"
        />
        <Stat
          label="Home equity"
          value={formatUSD(t.homeEquity)}
          delta="+$12k YoY"
          accent
        />
        <Stat
          label="Monthly cash flow"
          value={`+${formatUSD(t.monthlyCashFlow)}`}
          delta={`${formatUSD(t.monthlyIncome)} in / ${formatUSD(t.monthlyExpenses)} out`}
        />
        <Stat
          label="Projected payoff"
          value={payoffDate(scenario.scenario.months)}
          delta={`${formatYearsMonths(Math.max(0, scenario.monthsSaved))} sooner`}
        />
      </div>

      {/* Chart + scenario */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-surface-900">
                  Equity over time
                </h2>
                <p className="mt-1 text-sm text-surface-500">
                  Projected with 3% annual home appreciation and your current plan.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-surface-400">At payoff</div>
                <div className="font-display text-xl font-semibold text-accent-600">
                  {formatUSD(peakEquity)}
                </div>
              </div>
            </div>
            <div className="mt-5 h-56">
              <EquityProjectionChart points={points} className="h-full w-full" />
            </div>
            <div className="mt-4 flex items-center gap-5 text-xs text-surface-500">
              <span className="flex items-center gap-1.5">
                <span className="block h-2.5 w-2.5 rounded-sm bg-accent-500/30" />
                Equity (gold area)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="block h-2.5 w-2.5 rounded-sm bg-surface-200" />
                Mortgage balance
              </span>
              <span className="flex items-center gap-1.5">
                <span className="block h-0.5 w-5 bg-surface-500" />
                Home value
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="flex h-full flex-col rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-surface-900">
              Payoff plan
            </h2>
            <p className="mt-1 text-sm text-surface-500">
              Paying ${MOCK_MORTGAGE.extraPrincipal} extra each month vs. baseline.
            </p>
            <dl className="mt-5 space-y-3">
              <Row
                label="Baseline payoff"
                value={payoffDate(scenario.baseline.months)}
                muted
              />
              <Row
                label="Your payoff"
                value={payoffDate(scenario.scenario.months)}
                accent
              />
              <Row
                label="Time saved"
                value={formatYearsMonths(Math.max(0, scenario.monthsSaved))}
              />
              <Row
                label="Interest saved"
                value={formatUSD(Math.max(0, scenario.interestSaved))}
              />
            </dl>
            <div className="mt-auto pt-5">
              <ButtonLink to="/calculator" variant="secondary" size="sm" className="w-full">
                Try other scenarios <ArrowRight size={14} />
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      {/* PFS summary */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SummaryCard
          title="Assets"
          total={t.totalAssets}
          rows={MOCK_ASSETS.map((a) => ({
            id: a.id,
            label: a.label,
            sub: ASSET_CATEGORY_LABELS[a.category],
            value: formatUSD(a.value),
          }))}
          totalSign="+"
        />
        <SummaryCard
          title="Liabilities"
          total={t.totalLiabilities}
          rows={MOCK_LIABILITIES.map((l) => ({
            id: l.id,
            label: l.label,
            sub: l.rate
              ? `${LIABILITY_CATEGORY_LABELS[l.category]} • ${l.rate}%`
              : LIABILITY_CATEGORY_LABELS[l.category],
            value: formatUSD(l.balance),
          }))}
          totalSign="−"
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-100 p-5">
        <Sparkles size={16} className="mt-0.5 flex-shrink-0 text-accent-600" />
        <div className="flex-1 text-sm text-surface-700">
          This is the fully-built dashboard with placeholder data. Once Supabase auth
          and the PFS schema land, every number above flows from your actual records.
        </div>
        <Link
          to="/app/financials"
          className="text-sm font-medium text-surface-900 hover:underline"
        >
          View full PFS →
        </Link>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  delta,
  accent,
}: {
  label: string
  value: string
  delta: string
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wider text-surface-400">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-semibold leading-tight tracking-tight ${
          accent ? 'text-accent-600' : 'text-surface-900'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-surface-500">
        <ArrowUpRight size={12} className="text-emerald-600" />
        {delta}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  muted,
  accent,
}: {
  label: string
  value: string
  muted?: boolean
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-surface-200 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-sm text-surface-500">{label}</dt>
      <dd
        className={`font-mono text-sm font-medium ${
          accent ? 'text-accent-600' : muted ? 'text-surface-400' : 'text-surface-900'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

type Row = { id: string; label: string; sub: string; value: string }

function SummaryCard({
  title,
  total,
  rows,
  totalSign,
}: {
  title: string
  total: number
  rows: Row[]
  totalSign: '+' | '−'
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-surface-900">{title}</h2>
        <div className="font-mono text-xl font-semibold text-surface-900">
          {totalSign}
          {formatUSD(total)}
        </div>
      </div>
      <ul className="mt-4 divide-y divide-surface-200 border-t border-surface-200">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium text-surface-900">{r.label}</div>
              <div className="text-xs text-surface-500">{r.sub}</div>
            </div>
            <span className="font-mono text-sm text-surface-900">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function greetingForNow(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function firstName(full: string): string {
  return full.split(' ')[0]
}
