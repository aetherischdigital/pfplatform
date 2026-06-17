import { Star } from 'lucide-react'
import { simulate, formatUSD, formatYearsMonths, payoffDate } from '../../lib/mortgage'
import type { Mortgage } from '../../lib/pfs'

/**
 * Every property's loan side by side — balance, scheduled payoff, total
 * interest, and (where extra principal is set) the time and interest saved.
 * Pure projections from each loan's current numbers, no inputs to tweak.
 */
export default function PayoffMatrix({ mortgages }: { mortgages: Mortgage[] }) {
  if (mortgages.length === 0) {
    return (
      <p className="text-sm text-surface-500">
        No mortgages yet. Add a property with a loan in your{' '}
        <span className="font-medium text-surface-700">Properties</span> to compare payoffs here.
      </p>
    )
  }

  const rows = mortgages.map((m) => {
    const baseline = simulate(m.balance, m.ratePct, m.monthlyPayment, 0)
    const withExtra =
      m.extraPrincipal > 0
        ? simulate(m.balance, m.ratePct, m.monthlyPayment, m.extraPrincipal)
        : null
    return {
      m,
      baseline,
      withExtra,
      interestSaved: withExtra ? baseline.totalInterest - withExtra.totalInterest : 0,
      monthsSaved: withExtra ? baseline.months - withExtra.months : 0,
    }
  })
  const anyExtra = rows.some((r) => r.withExtra)

  const totalBalance = mortgages.reduce((s, m) => s + m.balance, 0)
  const totalInterest = rows.reduce(
    (s, r) => s + (Number.isFinite(r.baseline.totalInterest) ? r.baseline.totalInterest : 0),
    0,
  )
  const totalSaved = rows.reduce(
    (s, r) => s + (Number.isFinite(r.interestSaved) ? r.interestSaved : 0),
    0,
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-surface-200 text-left text-xs uppercase tracking-wide text-surface-400">
            <th className="py-2 pr-4 font-medium">Property</th>
            <th className="px-4 py-2 text-right font-medium">Balance</th>
            <th className="px-4 py-2 text-right font-medium">Rate</th>
            <th className="px-4 py-2 text-right font-medium">P&amp;I / mo</th>
            <th className="px-4 py-2 text-right font-medium">Payoff</th>
            <th className="px-4 py-2 text-right font-medium">Time left</th>
            <th className="px-4 py-2 text-right font-medium">Total interest</th>
            {anyExtra && <th className="pl-4 py-2 text-right font-medium">With extra principal</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {rows.map(({ m, baseline, withExtra, interestSaved, monthsSaved }) => (
            <tr key={m.id}>
              <td className="py-3 pr-4 font-medium text-surface-900">
                <span className="inline-flex items-center gap-1.5">
                  {m.propertyLabel}
                  {m.isPrimary && (
                    <Star size={11} className="text-accent-500" fill="currentColor" />
                  )}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-surface-700">
                {formatUSD(m.balance)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-surface-700">{m.ratePct}%</td>
              <td className="px-4 py-3 text-right tabular-nums text-surface-700">
                {formatUSD(m.monthlyPayment)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-surface-900">
                {payoffDate(baseline.months)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-surface-700">
                {formatYearsMonths(baseline.months)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-surface-700">
                {formatUSD(baseline.totalInterest)}
              </td>
              {anyExtra && (
                <td className="pl-4 py-3 text-right tabular-nums">
                  {withExtra ? (
                    <span className="text-success-700">
                      saves {formatUSD(interestSaved)} · {formatYearsMonths(monthsSaved)} sooner
                    </span>
                  ) : (
                    <span className="text-surface-400">no extra set</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-surface-200 font-semibold text-surface-900">
            <td className="py-3 pr-4">
              {mortgages.length} {mortgages.length === 1 ? 'loan' : 'loans'}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">{formatUSD(totalBalance)}</td>
            <td colSpan={4} />
            <td className="px-4 py-3 text-right tabular-nums">{formatUSD(totalInterest)}</td>
            {anyExtra && (
              <td className="pl-4 py-3 text-right tabular-nums text-success-700">
                saves {formatUSD(totalSaved)}
              </td>
            )}
          </tr>
        </tfoot>
      </table>
      <p className="mt-4 text-xs text-surface-400">
        Projections use each loan&rsquo;s current balance, rate, payment, and any extra principal
        you&rsquo;ve set. Edit those on a specific property, or open a single-loan tab to model
        what-ifs.
      </p>
    </div>
  )
}
