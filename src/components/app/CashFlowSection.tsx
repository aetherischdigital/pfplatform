import {
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  type Expense,
  type IncomeSource,
  type IncomeCategory,
  type ExpenseCategory,
} from '../../lib/pfs'
import { formatUSD } from '../../lib/mortgage'

type Props = {
  income: IncomeSource[]
  expenses: Expense[]
}

// Color palette per category — uses theme tokens so dark mode comes along.
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

// Expense tones (warmer walnut variants — money flowing out).
const EXPENSE_COLORS: Record<ExpenseCategory, string> = {
  housing: 'var(--color-accent-600)',
  transportation: 'var(--color-accent-500)',
  food: 'var(--color-accent-400)',
  taxes: 'var(--color-warning-700)',
  insurance: 'var(--color-warning-600)',
  healthcare: 'var(--color-danger-600)',
  debt_service: 'var(--color-danger-700)',
  utilities: 'var(--color-accent-200)',
  other: 'var(--color-accent-100)',
}

type Bucket = { key: string; label: string; amount: number; color: string }

function aggregate<C extends string>(
  items: { category: C; monthly: number }[],
  labels: Record<C, string>,
  colors: Record<C, string>,
): Bucket[] {
  const sums = new Map<C, number>()
  for (const item of items) {
    sums.set(item.category, (sums.get(item.category) ?? 0) + item.monthly)
  }
  return Array.from(sums.entries())
    .map(([cat, amount]) => ({
      key: cat,
      label: labels[cat],
      amount,
      color: colors[cat],
    }))
    .sort((a, b) => b.amount - a.amount)
}

export default function CashFlowSection({ income, expenses }: Props) {
  const incomeBuckets = aggregate(income, INCOME_CATEGORY_LABELS, INCOME_COLORS)
  const expenseBuckets = aggregate(expenses, EXPENSE_CATEGORY_LABELS, EXPENSE_COLORS)

  const totalIncome = incomeBuckets.reduce((s, b) => s + b.amount, 0)
  const totalExpenses = expenseBuckets.reduce((s, b) => s + b.amount, 0)
  const net = totalIncome - totalExpenses

  // Use the larger of the two as the bar scale so the bigger one fills its
  // track and the smaller one is visibly proportional.
  const scaleMax = Math.max(totalIncome, totalExpenses, 1)

  const empty = income.length === 0 && expenses.length === 0

  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-surface-900">Cash flow</h2>
          <p className="mt-1 text-sm text-surface-500">
            Where the money comes in. Where it goes. What&rsquo;s left over.
          </p>
        </div>
        {!empty && (
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-surface-500">Monthly net</div>
            <div
              className={`font-display text-2xl font-semibold ${
                net >= 0 ? 'text-success-700' : 'text-danger-700'
              }`}
            >
              {net >= 0 ? '+' : '−'}
              {formatUSD(Math.abs(net))}
            </div>
          </div>
        )}
      </header>

      {empty ? (
        <div className="mt-6 rounded-lg border border-dashed border-surface-200 bg-surface-50 px-4 py-5 text-center text-sm text-surface-500">
          Add income and expenses on{' '}
          <a
            href="/app/financials"
            className="font-medium text-accent-600 underline-offset-2 hover:underline"
          >
            Financials
          </a>{' '}
          to see your monthly flow.
        </div>
      ) : (
        <div className="mt-6 space-y-7">
          <FlowBar
            heading="In"
            total={totalIncome}
            scaleMax={scaleMax}
            buckets={incomeBuckets}
            tone="in"
          />
          <FlowBar
            heading="Out"
            total={totalExpenses}
            scaleMax={scaleMax}
            buckets={expenseBuckets}
            tone="out"
          />
        </div>
      )}
    </section>
  )
}

function FlowBar({
  heading,
  total,
  scaleMax,
  buckets,
  tone,
}: {
  heading: string
  total: number
  scaleMax: number
  buckets: Bucket[]
  tone: 'in' | 'out'
}) {
  const filledPct = scaleMax > 0 ? (total / scaleMax) * 100 : 0

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium uppercase tracking-wider text-surface-500">
          {heading}
        </span>
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
              <span className="font-mono font-medium text-surface-900">
                {formatUSD(b.amount)}
              </span>
              <span className="w-10 text-right text-surface-400">{pct.toFixed(0)}%</span>
            </li>
          )
        })}
      </ul>
      {tone === 'out' && total === 0 && (
        <p className="mt-2 text-xs text-surface-500">
          No expenses tracked yet. Add a few on Financials to populate this.
        </p>
      )}
    </div>
  )
}
