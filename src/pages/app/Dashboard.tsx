import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Home,
  TrendingUp,
  Coins,
  LineChart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  fetchPfs,
  totalMonthlyHousingOutflow,
  totals,
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  type Pfs,
} from '../../lib/pfs'
import { fetchOwnProfile, displayLabel, type Profile } from '../../lib/profile'
import { projectEquity } from '../../lib/equity'
import {
  compareScenarios,
  formatUSD,
  formatYearsMonths,
  payoffDate,
  simulate,
} from '../../lib/mortgage'
import EquityProjectionChart from '../../components/EquityProjectionChart'
import { Button, ButtonLink } from '../../components/ui/Button'
import OnboardingCard from '../../components/app/OnboardingCard'
import CashFlowSection from '../../components/app/CashFlowSection'
import NetWorthHistory from '../../components/app/NetWorthHistory'

export default function Dashboard() {
  const [pfs, setPfs] = useState<Pfs | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchPfs(), fetchOwnProfile()])
      .then(([pfsData, profileData]) => {
        if (cancelled) return
        setPfs(pfsData)
        setProfile(profileData)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <SkeletonState />
  if (error || !pfs) return <ErrorState message={error ?? 'No data.'} />

  const t = totals(pfs)
  const hasAnyData =
    pfs.assets.length > 0 ||
    pfs.liabilities.length > 0 ||
    pfs.income.length > 0 ||
    pfs.expenses.length > 0 ||
    pfs.livingExpenses.length > 0

  const greeting = greetingForNow()
  const name = displayLabel(profile)

  if (!hasAnyData) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
            {greeting}, {name}.
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Let&rsquo;s build your ledger. Once you add a few PFS entries, this dashboard fills in.
          </p>
        </div>
        <OnboardingCard hasAnyPfs={false} hasMortgage={false} hasCashFlowInputs={false} />
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-surface-500">
            Coming next
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <PreviewCard
              icon={TrendingUp}
              title="Equity over time"
              body="Watch your home value rise and your balance fall — together."
            />
            <PreviewCard
              icon={Coins}
              title="Cash flow"
              body="Where the money comes in. Where it goes. What's left over."
            />
            <PreviewCard
              icon={LineChart}
              title="Net-worth trajectory"
              body="Save a monthly snapshot, see your trendline take shape."
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
            {greeting}, {name}.
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Here&rsquo;s where you stand today and where you&rsquo;re heading.
          </p>
        </div>
      </div>

      <OnboardingCard
        hasAnyPfs={hasAnyData}
        hasMortgage={!!pfs.mortgage}
        hasCashFlowInputs={pfs.income.length > 0 && pfs.livingExpenses.length > 0}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Net worth" value={formatUSD(t.netWorth)} />
        <Stat label="Home equity" value={formatUSD(t.homeEquity)} accent />
        <Stat
          label="Left over / mo"
          value={`${t.monthlyLeftover >= 0 ? '+' : '−'}${formatUSD(Math.abs(t.monthlyLeftover))}`}
          delta={leftoverDelta(t.monthlyDebtPayments, t.monthlyLivingExpenses)}
          trend={t.monthlyLeftover >= 0 ? 'positive' : 'negative'}
        />
        <PayoffStat pfs={pfs} />
      </div>

      {pfs.mortgage ? (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <EquitySection mortgage={pfs.mortgage} />
          </div>
          <div className="lg:col-span-5">
            <PayoffPlanSection mortgage={pfs.mortgage} />
          </div>
        </div>
      ) : (
        <NoMortgagePrompt />
      )}

      <CashFlowSection pfs={pfs} />

      {(t.totalAssets > 0 || t.totalLiabilities > 0) && (
        <NetWorthHistory totalAssets={t.totalAssets} totalLiabilities={t.totalLiabilities} />
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <SummaryCard
          title="Assets"
          total={t.totalAssets}
          groups={[
            {
              rows: pfs.assets.map((a) => ({
                id: a.id,
                label: a.label,
                sub: ASSET_CATEGORY_LABELS[a.category],
                value: formatUSD(a.value),
              })),
            },
          ]}
          totalSign="+"
          emptyHint="No assets yet."
        />
        <SummaryCard
          title="Liabilities"
          total={t.totalLiabilities}
          groups={[
            {
              label: 'Secured',
              rows: [
                ...(pfs.mortgage
                  ? [
                      {
                        id: pfs.mortgage.id,
                        label: pfs.mortgage.propertyLabel,
                        sub: `Mortgage • ${pfs.mortgage.ratePct}%`,
                        value: formatUSD(pfs.mortgage.balance),
                      },
                    ]
                  : []),
                ...pfs.liabilities.map((l) => ({
                  id: l.id,
                  label: l.label,
                  sub: l.rate
                    ? `${LIABILITY_CATEGORY_LABELS[l.category]} • ${l.rate}%`
                    : LIABILITY_CATEGORY_LABELS[l.category],
                  value: formatUSD(l.balance),
                })),
              ],
            },
            {
              label: 'Unsecured',
              rows: pfs.expenses.map((e) => ({
                id: e.id,
                label: e.label,
                sub: e.rate
                  ? `${EXPENSE_CATEGORY_LABELS[e.category]} • ${e.rate}%`
                  : EXPENSE_CATEGORY_LABELS[e.category],
                value: formatUSD(e.balance),
              })),
            },
          ]}
          totalSign="−"
          emptyHint="No liabilities yet."
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
        <div className="text-sm text-surface-700">
          Want to edit your line items? Open the full Personal Financial Statement.
        </div>
        <Link
          to="/app/financials"
          className="rounded text-sm font-medium text-surface-900 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
        >
          View full PFS →
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function EquitySection({ mortgage: m }: { mortgage: NonNullable<Pfs['mortgage']> }) {
  const { points, headlineEquity, headlineLabel } = useMemo(() => {
    const months = m.termMonthsRemaining
    const pts = projectEquity({
      startingHomeValue: m.startingHomeValue,
      startingBalance: m.balance,
      annualAppreciationPct: 3,
      annualRatePct: m.ratePct,
      monthlyPayment: m.monthlyPayment,
      extraPrincipal: m.extraPrincipal,
      months,
    })
    // Headline = equity at actual payoff if the loan clears within the term;
    // otherwise equity at the end of the projected term. Avoids labelling an
    // end-of-term figure "At payoff" when the payment under-amortizes.
    const sim = simulate(m.balance, m.ratePct, m.monthlyPayment, m.extraPrincipal)
    const paysOffWithinTerm = Number.isFinite(sim.months) && sim.months <= months
    const headlineMonth = paysOffWithinTerm ? sim.months : months
    return {
      points: pts,
      headlineEquity: pts[Math.min(headlineMonth, pts.length - 1)]?.equity ?? 0,
      headlineLabel: paysOffWithinTerm ? 'At payoff' : `In ${formatYearsMonths(months)}`,
    }
  }, [m])

  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-surface-900">Equity over time</h2>
          <p className="mt-1 text-sm text-surface-500">
            Projected with 3% annual home appreciation and your current plan.
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] uppercase tracking-wider text-surface-500">{headlineLabel}</div>
          <div className="font-display text-xl font-semibold text-accent-600">
            {formatUSD(headlineEquity)}
          </div>
        </div>
      </div>
      <div className="mt-5 h-56">
        <EquityProjectionChart points={points} className="h-full w-full" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-surface-500">
        <span className="flex items-center gap-1.5">
          <span className="block h-2.5 w-2.5 rounded-sm bg-accent-500/30" />
          Equity
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
  )
}

function PayoffPlanSection({ mortgage: m }: { mortgage: NonNullable<Pfs['mortgage']> }) {
  const scenario = useMemo(
    () => compareScenarios(m.balance, m.ratePct, m.monthlyPayment, m.extraPrincipal),
    [m],
  )
  const piti = totalMonthlyHousingOutflow(m)

  return (
    <div className="flex h-full flex-col rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <h2 className="font-display text-lg font-semibold text-surface-900">Payoff plan</h2>
      <p className="mt-1 text-sm text-surface-500">
        {m.extraPrincipal > 0
          ? `Paying ${formatUSD(m.extraPrincipal)} extra each month vs. baseline.`
          : 'Add extra principal to accelerate your payoff.'}
      </p>
      <dl className="mt-5 space-y-3">
        <Row label="Baseline payoff" value={payoffDate(scenario.baseline.months)} muted />
        <Row label="Your payoff" value={payoffDate(scenario.scenario.months)} accent />
        <Row label="Time saved" value={formatYearsMonths(Math.max(0, scenario.monthsSaved))} />
        <Row
          label="Interest saved"
          value={formatUSD(Math.max(0, scenario.interestSaved))}
        />
      </dl>
      {piti?.hasPiti ? (
        <div className="mt-5 rounded-lg border border-surface-200 bg-surface-50 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-surface-500">
            True monthly housing cost
          </div>
          <div className="mt-1.5 font-display text-xl font-semibold text-surface-900">
            {formatUSD(piti.total)}/mo
          </div>
          <dl className="mt-3 space-y-1 text-xs text-surface-600">
            <PitiRow label="Principal &amp; interest" value={formatUSD(m.monthlyPayment)} />
            {m.propertyTaxAnnual != null && (
              <PitiRow label="Property tax" value={`${formatUSD(m.propertyTaxAnnual / 12)} (${formatUSD(m.propertyTaxAnnual)}/yr)`} />
            )}
            {m.homeownersInsuranceAnnual != null && (
              <PitiRow label="Insurance" value={`${formatUSD(m.homeownersInsuranceAnnual / 12)} (${formatUSD(m.homeownersInsuranceAnnual)}/yr)`} />
            )}
            {m.hoaMonthly != null && m.hoaMonthly > 0 && (
              <PitiRow label="HOA" value={formatUSD(m.hoaMonthly)} />
            )}
          </dl>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-surface-200 bg-surface-50 p-4">
          <div className="text-xs text-surface-500">
            Want true monthly housing cost?{' '}
            <Link
              to="/app/financials"
              className="font-medium text-accent-600 underline-offset-2 hover:underline"
            >
              Edit your property on Financials
            </Link>{' '}
            and add property tax, insurance, and HOA.
          </div>
        </div>
      )}
      <div className="mt-auto pt-5">
        <ButtonLink to="/app/calculators" variant="secondary" size="sm" className="w-full">
          Try other scenarios <ArrowRight size={14} />
        </ButtonLink>
      </div>
    </div>
  )
}

function PitiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-surface-500">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  )
}

function PayoffStat({ pfs }: { pfs: Pfs }) {
  const m = pfs.mortgage
  const scenario = useMemo(
    () => (m ? compareScenarios(m.balance, m.ratePct, m.monthlyPayment, m.extraPrincipal) : null),
    [m],
  )
  if (!m || !scenario) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
        <div className="font-mono text-[11px] uppercase tracking-wider text-surface-400">
          Projected payoff
        </div>
        <div className="mt-2 font-display text-base font-medium text-surface-500">
          Add mortgage
        </div>
      </div>
    )
  }
  return (
    <Stat
      label="Projected payoff"
      value={payoffDate(scenario.scenario.months)}
      delta={`${formatYearsMonths(Math.max(0, scenario.monthsSaved))} sooner`}
    />
  )
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function Stat({
  label,
  value,
  delta,
  accent,
  trend = 'positive',
}: {
  label: string
  value: string
  delta?: string
  accent?: boolean
  trend?: 'positive' | 'negative' | 'neutral'
}) {
  const TrendIcon = trend === 'negative' ? ArrowDownRight : ArrowUpRight
  const trendColor =
    trend === 'negative'
      ? 'text-danger-600'
      : trend === 'neutral'
        ? 'text-surface-400'
        : 'text-success-600'
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
      <div className="font-mono text-[11px] uppercase tracking-wider text-surface-500">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-semibold leading-tight tracking-tight ${
          accent ? 'text-accent-600' : 'text-surface-900'
        }`}
      >
        {value}
      </div>
      {delta && (
        <div className="mt-1 flex items-center gap-1 text-xs text-surface-500">
          {trend !== 'neutral' && <TrendIcon size={12} className={trendColor} />}
          {delta}
        </div>
      )}
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
          accent ? 'text-accent-600' : muted ? 'text-surface-500' : 'text-surface-900'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

type SummaryRow = { id: string; label: string; sub: string; value: string }
type SummaryGroup = { label?: string; rows: SummaryRow[] }

function SummaryCard({
  title,
  total,
  groups,
  totalSign,
  emptyHint,
}: {
  title: string
  total: number
  groups: SummaryGroup[]
  totalSign: '+' | '−'
  emptyHint: string
}) {
  // Drop empty groups so we don't render a "Secured" header with no rows under it.
  const visible = groups.filter((g) => g.rows.length > 0)
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-surface-900">{title}</h2>
        <div className="font-mono text-xl font-semibold text-surface-900">
          {total > 0 ? totalSign : ''}
          {formatUSD(total)}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-surface-200 px-4 py-6 text-center text-sm text-surface-500">
          {emptyHint}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {visible.map((g, gi) => (
            <div key={g.label ?? `g-${gi}`}>
              {g.label && (
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-surface-400">
                  {g.label}
                </div>
              )}
              <ul
                className={`divide-y divide-surface-200 ${
                  gi === 0 ? 'border-t border-surface-200' : ''
                }`}
              >
                {g.rows.map((r) => (
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
          ))}
        </div>
      )}
    </div>
  )
}

function PreviewCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-200 bg-white/50 p-5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-100 text-surface-500">
        <Icon size={16} />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold text-surface-900">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-surface-500">{body}</p>
    </div>
  )
}

function EmptyStateCard({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaTo,
}: {
  icon: LucideIcon
  title: string
  body: string
  ctaLabel: string
  ctaTo: string
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-8 text-center shadow-card sm:p-10">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-100 text-accent-600">
        <Icon size={20} />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold text-surface-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-surface-500">{body}</p>
      <div className="mt-6">
        <ButtonLink to={ctaTo} variant="primary" size="md">
          {ctaLabel} <ArrowRight size={14} />
        </ButtonLink>
      </div>
    </div>
  )
}

function NoMortgagePrompt() {
  return (
    <EmptyStateCard
      icon={Home}
      title="Add your mortgage to unlock equity & payoff projections"
      body="Enter your balance, rate, and monthly payment from your Note. The platform projects equity, compares payoff scenarios, and shows interest saved against the baseline."
      ctaLabel="Add mortgage"
      ctaTo="/app/financials?add=mortgage"
    />
  )
}

function SkeletonState() {
  return (
    <div className="space-y-8">
      <div className="h-12 animate-pulse rounded-md bg-surface-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-100" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 h-72 animate-pulse rounded-2xl bg-surface-100" />
        <div className="lg:col-span-5 h-72 animate-pulse rounded-2xl bg-surface-100" />
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-danger-200 bg-danger-50 p-8 text-center">
      <AlertTriangle size={24} className="mx-auto text-danger-600" />
      <p className="mt-3 text-sm text-danger-700">{message}</p>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => window.location.reload()}
        className="mt-4"
      >
        Reload
      </Button>
    </div>
  )
}

function leftoverDelta(debts: number, living: number): string | undefined {
  const parts: string[] = []
  if (debts > 0) parts.push(`${formatUSD(debts)} debts`)
  if (living > 0) parts.push(`${formatUSD(living)} living`)
  if (parts.length === 0) return undefined
  return `after ${parts.join(' + ')}`
}

function greetingForNow(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
