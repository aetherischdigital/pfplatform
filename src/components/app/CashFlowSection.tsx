import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ArrowRight } from 'lucide-react'
import {
  LIVING_EXPENSE_CATEGORY_LABELS,
  expenseMonthlyOutflow,
  liabilityMonthlyOutflow,
  propertyMonthlyOutflow,
  totals,
  type Pfs,
} from '../../lib/pfs'
import { formatUSD } from '../../lib/mortgage'

type Props = {
  pfs: Pfs
}

// Thomas's waterfall:
//   + Income
//   − Fixed expenses (mortgage P&I + secured + unsecured debt payments)
//   = Discretionary income      ← surplus before lifestyle choices
//   − Living expenses           ← the coachable lever
//   = Left over                 ← what's free to aim at principal

export default function CashFlowSection({ pfs }: Props) {
  const t = totals(pfs)
  const [fixedOpen, setFixedOpen] = useState(false)
  const [livingOpen, setLivingOpen] = useState(false)

  const empty =
    pfs.income.length === 0 &&
    t.monthlyDebtPayments === 0 &&
    pfs.livingExpenses.length === 0

  // Fixed expenses — every individual debt, grouped by Secured / Unsecured.
  // Three row states:
  //   - normal amount (user-entered monthlyPayment)
  //   - estimated amount (credit-card interest-only floor from balance × APR)
  //   - needs-entry (no resolvable outflow — listed so the gap is visible)
  // Each property contributes its full housing cost (PITI), tagged to the
  // property, so taxes/insurance/HOA show here instead of under Household spend.
  const securedItems: BreakdownRow[] = []
  for (const p of pfs.properties) {
    const outflow = propertyMonthlyOutflow(p)
    if (outflow > 0) {
      securedItems.push({
        key: `property-${p.id}`,
        label: `Housing (PITI) · ${p.label}`,
        amount: outflow,
      })
    }
  }
  for (const l of pfs.liabilities) {
    const outflow = liabilityMonthlyOutflow(l)
    if (outflow) {
      securedItems.push({ key: l.id, label: l.label, amount: outflow.amount })
    } else {
      securedItems.push({ key: l.id, label: l.label, amount: 0, needsEntry: true })
    }
  }
  // Resolvable rows ranked by amount, needs-entry rows trailing
  securedItems.sort(byAmountResolvableFirst)

  const unsecuredItems: BreakdownRow[] = []
  let hasEstimatedRow = false
  for (const e of pfs.expenses) {
    const outflow = expenseMonthlyOutflow(e)
    if (outflow) {
      if (outflow.estimated) hasEstimatedRow = true
      unsecuredItems.push({
        key: e.id,
        label: e.label,
        amount: outflow.amount,
        estimated: outflow.estimated,
      })
    } else {
      unsecuredItems.push({ key: e.id, label: e.label, amount: 0, needsEntry: true })
    }
  }
  unsecuredItems.sort(byAmountResolvableFirst)

  const fixedGroups: BreakdownGroup[] = []
  if (securedItems.length > 0) fixedGroups.push({ label: 'Secured', rows: securedItems })
  if (unsecuredItems.length > 0) fixedGroups.push({ label: 'Unsecured', rows: unsecuredItems })

  const livingSums = new Map<string, number>()
  for (const e of pfs.livingExpenses) {
    livingSums.set(e.category, (livingSums.get(e.category) ?? 0) + e.monthlyAmount)
  }
  const livingItems: BreakdownRow[] = [...livingSums.entries()]
    .map(([cat, amount]) => ({
      key: cat,
      label: LIVING_EXPENSE_CATEGORY_LABELS[cat as keyof typeof LIVING_EXPENSE_CATEGORY_LABELS],
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
  const livingGroups: BreakdownGroup[] =
    livingItems.length > 0 ? [{ rows: livingItems }] : []

  // Widths anchor on income; if expenses exceed income, we cap at 100% and
  // the deficit shows as a danger callout instead of an oversized bar.
  const incomeBasis = Math.max(t.monthlyIncome, 1)
  const pctOfIncome = (n: number) => Math.min(100, (Math.max(n, 0) / incomeBasis) * 100)

  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
      <header>
        <h2 className="font-display text-lg font-semibold text-surface-900">Cash flow</h2>
        <p className="mt-1 text-sm text-surface-500">
          Where your money goes each month — and what&rsquo;s left to direct at debt.
        </p>
      </header>

      {empty ? (
        <div className="mt-6 rounded-lg border border-dashed border-surface-200 bg-surface-50 px-4 py-5 text-center text-sm text-surface-500">
          Add income, debts, and spending on{' '}
          <Link
            to="/app/financials"
            className="font-medium text-accent-600 underline-offset-2 hover:underline"
          >
            Financials
          </Link>{' '}
          to see your monthly flow.
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          <WaterfallRow
            kind="income"
            label="Income"
            amount={t.monthlyIncome}
            widthPct={pctOfIncome(t.monthlyIncome)}
          />

          <SubtractRow
            label="Fixed expenses (debt)"
            amount={t.monthlyDebtPayments}
            tagline="housing PITI · secured · unsecured"
            open={fixedOpen}
            onToggle={() => setFixedOpen((v) => !v)}
            groups={fixedGroups}
            emptyHint="No debt payments yet."
            footnote={fixedFootnote(hasEstimatedRow, fixedGroups)}
          />

          <WaterfallRow
            kind="discretionary"
            label="Discretionary income"
            amount={t.monthlyDiscretionary}
            widthPct={pctOfIncome(t.monthlyDiscretionary)}
            sublabel="surplus before lifestyle"
          />

          <SubtractRow
            label="Spending"
            amount={t.monthlyLivingExpenses}
            tagline="where you can find more money"
            taglineAccent
            open={livingOpen}
            onToggle={() => setLivingOpen((v) => !v)}
            groups={livingGroups}
            emptyHint="No spending entered yet."
          />

          <WaterfallRow
            kind="leftover"
            label="Left over"
            amount={t.monthlyLeftover}
            widthPct={pctOfIncome(t.monthlyLeftover)}
            sublabel={
              t.monthlyLeftover > 0
                ? 'your Hidden Money — aim at principal'
                : t.monthlyLeftover === 0
                  ? 'nothing left to direct at principal'
                  : 'spending exceeds income'
            }
            negative={t.monthlyLeftover < 0}
          />

          {t.monthlyLeftover > 0 && (
            <div className="flex justify-end pt-1">
              <Link
                to="/app/calculators"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                Run a prepayment scenario <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Waterfall row — the bars (income / discretionary / leftover)
// ---------------------------------------------------------------------------

type WaterfallKind = 'income' | 'discretionary' | 'leftover'

function WaterfallRow({
  kind,
  label,
  amount,
  widthPct,
  sublabel,
  negative,
}: {
  kind: WaterfallKind
  label: string
  amount: number
  widthPct: number
  sublabel?: string
  negative?: boolean
}) {
  const palette = negative
    ? {
        bar: 'bg-danger-500',
        label: 'text-danger-700',
        amount: 'text-danger-700',
      }
    : kind === 'income'
      ? {
          bar: 'bg-surface-700',
          label: 'text-surface-500',
          amount: 'text-surface-900',
        }
      : kind === 'discretionary'
        ? {
            bar: 'bg-accent-500',
            label: 'text-accent-700',
            amount: 'text-accent-700',
          }
        : {
            bar: 'bg-success-600',
            label: 'text-success-700',
            amount: 'text-success-700',
          }

  const isSubtotal = kind !== 'income'

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-medium uppercase tracking-wider ${
              isSubtotal ? 'text-xs' : 'text-[11px]'
            } ${palette.label}`}
          >
            {isSubtotal && <span className="mr-1 font-mono text-surface-400">=</span>}
            {label}
          </span>
          {sublabel && (
            <span className="text-xs italic text-surface-400">— {sublabel}</span>
          )}
        </div>
        <span
          className={`font-mono font-semibold ${
            isSubtotal ? 'text-xl' : 'text-base'
          } ${palette.amount}`}
        >
          {negative ? '−' : ''}
          {formatUSD(Math.abs(amount))}
        </span>
      </div>
      <div
        className="mt-1.5 h-3 overflow-hidden rounded-full bg-surface-100"
        role="img"
        aria-label={`${label} ${formatUSD(Math.abs(amount))} per month`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${palette.bar}`}
          style={{ width: `${Math.max(widthPct, 2)}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subtract row — the deductions (fixed / living) with expandable breakdown
// ---------------------------------------------------------------------------

type BreakdownRow = {
  key: string
  label: string
  /** Resolved monthly outflow. Meaningless when needsEntry is true. */
  amount: number
  /** Computed from balance × APR (credit-card interest-only floor) — render
   *  with an asterisk and footnote so the user knows it's a derived estimate. */
  estimated?: boolean
  /** Debt exists but has no resolvable monthly outflow — render as a muted
   *  "needs payment" row so the gap is visible, but don't include in totals. */
  needsEntry?: boolean
}
type BreakdownGroup = { label?: string; rows: BreakdownRow[] }

/** Sort resolved rows by amount desc; needs-entry rows trail at the bottom. */
function byAmountResolvableFirst(a: BreakdownRow, b: BreakdownRow): number {
  if (a.needsEntry && !b.needsEntry) return 1
  if (!a.needsEntry && b.needsEntry) return -1
  return b.amount - a.amount
}

function fixedFootnote(hasEstimated: boolean, groups: BreakdownGroup[]): string | undefined {
  const needsCount = groups.reduce(
    (s, g) => s + g.rows.filter((r) => r.needsEntry).length,
    0,
  )
  const parts: string[] = []
  if (hasEstimated) {
    parts.push(
      '* Interest-only estimate from balance × APR. Set the actual monthly payment on Financials for precision.',
    )
  }
  if (needsCount > 0) {
    parts.push(
      `${needsCount} row${needsCount === 1 ? '' : 's'} marked "needs payment" — add a monthly payment on Financials to include in cash flow.`,
    )
  }
  return parts.length > 0 ? parts.join(' ') : undefined
}

function SubtractRow({
  label,
  amount,
  tagline,
  taglineAccent,
  open,
  onToggle,
  groups,
  emptyHint,
  footnote,
}: {
  label: string
  amount: number
  tagline: string
  taglineAccent?: boolean
  open: boolean
  onToggle: () => void
  groups: BreakdownGroup[]
  emptyHint: string
  footnote?: string
}) {
  const totalRows = groups.reduce((s, g) => s + g.rows.length, 0)
  const disabled = totalRows === 0 && !footnote
  return (
    <div className="border-l-2 border-dashed border-surface-200 pl-4">
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={`group flex w-full items-baseline justify-between gap-3 rounded-md py-1 text-left transition-colors ${
          disabled ? 'cursor-default' : 'hover:bg-surface-50'
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400`}
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm text-surface-400">−</span>
          <span className="text-sm font-medium text-surface-700">{label}</span>
          <span
            className={`text-xs italic ${
              taglineAccent ? 'text-accent-600' : 'text-surface-400'
            }`}
          >
            — {tagline}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold text-surface-700">
            −{formatUSD(amount)}
          </span>
          {!disabled && (
            <ChevronDown
              size={14}
              className={`text-surface-400 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>
      {open && (
        <div className="mt-1 ml-4 space-y-3">
          {totalRows === 0 ? (
            <div className="py-2 text-xs italic text-surface-400">{emptyHint}</div>
          ) : (
            groups.map((g, gi) => (
              <div key={g.label ?? `g-${gi}`}>
                {g.label && (
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-surface-400">
                    {g.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {g.rows.map((r) => (
                    <div
                      key={r.key}
                      className="flex items-baseline justify-between gap-3 py-1"
                    >
                      <span
                        className={`text-xs ${
                          r.needsEntry ? 'italic text-surface-400' : 'text-surface-500'
                        }`}
                      >
                        {r.label}
                        {r.estimated && (
                          <span className="ml-1 text-accent-600" aria-label="interest-only estimate">
                            *
                          </span>
                        )}
                      </span>
                      <span
                        className={`font-mono text-xs ${
                          r.needsEntry ? 'italic text-surface-400' : 'text-surface-700'
                        }`}
                      >
                        {r.needsEntry ? 'needs payment' : formatUSD(r.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          {footnote && (
            <div className="border-t border-dashed border-surface-200 pt-2 text-[11px] italic text-surface-400">
              {footnote}
            </div>
          )}
        </div>
      )}
    </div>
  )
}