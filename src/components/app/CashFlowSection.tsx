import { Link } from 'react-router-dom'
import {
  INCOME_CATEGORY_LABELS,
  LIVING_EXPENSE_CATEGORY_LABELS,
  totals,
  type IncomeCategory,
  type Pfs,
} from '../../lib/pfs'
import { formatUSD } from '../../lib/mortgage'

type Props = {
  pfs: Pfs
}

// Income tones (cool sage variants — money flowing in).
const INCOME_COLORS: Record<IncomeCategory, string> = {
  salary: 'var(--color-surface-700)',
  dividends: 'var(--color-surface-600)',
  rental: 'var(--color-surface-500)',
  self_employment: 'var(--color-surface-400)',
  pension: 'var(--color-success-600)',
  social_security: 'var(--color-success-700)',
  other: 'var(--color-surface-300)',
}

// Outflow palette (warmer walnut variants — money flowing out), cycled across
// the dynamic set of outflow buckets.
const OUTFLOW_PALETTE = [
  'var(--color-accent-600)',
  'var(--color-accent-500)',
  'var(--color-warning-600)',
  'var(--color-accent-400)',
  'var(--color-danger-600)',
  'var(--color-warning-700)',
  'var(--color-accent-300)',
  'var(--color-danger-700)',
  'var(--color-accent-200)',
  'var(--color-surface-400)',
]

type Bucket = { key: string; label: string; amount: number; color: string }

export default function CashFlowSection({ pfs }: Props) {
  const t = totals(pfs)

  // Income buckets by category.
  const incomeSums = new Map<IncomeCategory, number>()
  for (const i of pfs.income) {
    incomeSums.set(i.category, (incomeSums.get(i.category) ?? 0) + i.monthly)
  }
  const incomeBuckets: Bucket[] = Array.from(incomeSums.entries())
    .map(([cat, amount]) => ({ key: cat, label: INCOME_CATEGORY_LABELS[cat], amount, color: INCOME_COLORS[cat] }))
    .sort((a, b) => b.amount - a.amount)

  // Outflow buckets: debt payments (mortgage P&I, secured, unsecured) + living
  // spend by category.
  const rawOut: { key: string; label: string; amount: number }[] = []
  if (pfs.mortgage && pfs.mortgage.monthlyPayment > 0) {
    rawOut.push({ key: 'mortgage', label: 'Mortgage (P&I)', amount: pfs.mortgage.monthlyPayment })
  }
  const securedPay = pfs.liabilities.reduce((s, l) => s + (l.monthlyPayment ?? 0), 0)
  if (securedPay > 0) rawOut.push({ key: 'secured', label: 'Secured debt', amount: securedPay })
  const unsecuredPay = pfs.expenses.reduce((s, e) => s + (e.monthlyPayment ?? 0), 0)
  if (unsecuredPay > 0) rawOut.push({ key: 'unsecured', label: 'Unsecured debt', amount: unsecuredPay })
  const livingSums = new Map<string, number>()
  for (const e of pfs.livingExpenses) {
    livingSums.set(e.category, (livingSums.get(e.category) ?? 0) + e.monthlyAmount)
  }
  for (const [cat, amount] of livingSums.entries()) {
    rawOut.push({ key: `living_${cat}`, label: LIVING_EXPENSE_CATEGORY_LABELS[cat as keyof typeof LIVING_EXPENSE_CATEGORY_LABELS], amount })
  }
  const outflowBuckets: Bucket[] = rawOut
    .sort((a, b) => b.amount - a.amount)
    .map((b, i) => ({ ...b, color: OUTFLOW_PALETTE[i % OUTFLOW_PALETTE.length] }))

  const totalIncome = t.monthlyIncome
  const totalOutflow = t.monthlyExpenses
  const discretionary = t.monthlyCashFlow
  const scaleMax = Math.max(totalIncome, totalOutflow, 1)

  const empty = pfs.income.length === 0 && outflowBuckets.length === 0

  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-surface-900">Cash flow</h2>
          <p className="mt-1 text-sm text-surface-500">
            What comes in, what goes out, and what&rsquo;s left to attack debt.
          </p>
        </div>
        {!empty && (
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-surface-500">Discretionary / mo</div>
            <div
              className={`font-display text-2xl font-semibold ${
                discretionary >= 0 ? 'text-success-700' : 'text-danger-700'
              }`}
            >
              {discretionary >= 0 ? '+' : '−'}
              {formatUSD(Math.abs(discretionary))}
            </div>
          </div>
        )}
      </header>

      {empty ? (
        <div className="mt-6 rounded-lg border border-dashed border-surface-200 bg-surface-50 px-4 py-5 text-center text-sm text-surface-500">
          Add income, debts, and living expenses on{' '}
          <Link
            to="/app/financials"
            className="font-medium text-accent-600 underline-offset-2 hover:underline"
          >
            Financials
          </Link>{' '}
          to see your monthly flow.
        </div>
      ) : (
        <div className="mt-6 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-7">
            <FlowBar heading="In" total={totalIncome} scaleMax={scaleMax} buckets={incomeBuckets} />
            <FlowBar heading="Out" total={totalOutflow} scaleMax={scaleMax} buckets={outflowBuckets} />
          </div>
          <DiscretionaryDonut
            outflow={outflowBuckets}
            discretionary={discretionary}
            income={totalIncome}
          />
        </div>
      )}
    </section>
  )
}

/** Donut of where each income dollar goes: outflow buckets + the leftover
 *  (discretionary) slice. */
function DiscretionaryDonut({
  outflow,
  discretionary,
  income,
}: {
  outflow: Bucket[]
  discretionary: number
  income: number
}) {
  const slices: Bucket[] = [...outflow]
  if (discretionary > 0) {
    slices.push({ key: 'discretionary', label: 'Discretionary', amount: discretionary, color: 'var(--color-success-600)' })
  }
  const total = slices.reduce((s, b) => s + b.amount, 0)
  if (total <= 0) return null

  const R = 52
  const C = 2 * Math.PI * R
  let offset = 0
  const segments = slices.map((b) => {
    const frac = b.amount / total
    const seg = { ...b, dash: frac * C, gap: C - frac * C, off: offset }
    offset -= frac * C
    return seg
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90" role="img" aria-label="Monthly outflow breakdown">
        {segments.map((s) => (
          <circle
            key={s.key}
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="16"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.off}
          />
        ))}
      </svg>
      <div className="max-w-[12rem] space-y-1">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs text-surface-600">
            <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
            <span className="flex-1 truncate">{s.label}</span>
            <span className="text-surface-400">{income > 0 ? Math.round((s.amount / income) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FlowBar({
  heading,
  total,
  scaleMax,
  buckets,
}: {
  heading: string
  total: number
  scaleMax: number
  buckets: Bucket[]
}) {
  const filledPct = scaleMax > 0 ? (total / scaleMax) * 100 : 0

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium uppercase tracking-wider text-surface-500">{heading}</span>
        <span className="font-mono font-medium text-surface-900">{formatUSD(total)}/mo</span>
      </div>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full bg-surface-100"
        role="img"
        aria-label={`${heading} ${formatUSD(total)} per month broken down by category`}
      >
        <div className="flex h-full" style={{ width: `${filledPct}%` }}>
          {buckets.map((b) => {
            const segPct = total > 0 ? (b.amount / total) * 100 : 0
            return (
              <div
                key={b.key}
                className="h-full"
                style={{ width: `${segPct}%`, backgroundColor: b.color }}
                title={`${b.label}: ${formatUSD(b.amount)}/mo`}
              />
            )
          })}
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {buckets.map((b) => {
          const pct = total > 0 ? (b.amount / total) * 100 : 0
          return (
            <li key={b.key} className="flex items-center gap-2 text-xs text-surface-600">
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: b.color }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate">{b.label}</span>
              <span className="font-mono font-medium text-surface-900">{formatUSD(b.amount)}</span>
              <span className="w-10 text-right text-surface-400">{pct.toFixed(0)}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
