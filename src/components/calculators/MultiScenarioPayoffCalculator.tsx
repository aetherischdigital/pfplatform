import { useMemo, useState } from 'react'
import MultiPayoffChart, { type ChartSeries } from '../MultiPayoffChart'
import {
  formatUSD,
  formatYearsMonths,
  monthlyPaymentForLoan,
  payoffDate,
  simulateScenario,
} from '../../lib/mortgage'
import type { Simulation } from '../../lib/mortgage'
import { NumberField } from '../ui/NumberField'

export type MultiScenarioCalculatorDefaults = {
  balance?: number
  rate?: number
  termYears?: number
  monthlyPayment?: number
}

type Props = {
  defaults?: MultiScenarioCalculatorDefaults
}

type ScenarioRow = {
  key: 'baseline' | 'monthly' | 'biweekly' | 'lump'
  label: string
  color: string
  sim: Simulation
}

export default function MultiScenarioPayoffCalculator({ defaults }: Props) {
  const [balance, setBalance] = useState(defaults?.balance ?? 312_500)
  const [rate, setRate] = useState(defaults?.rate ?? 6.5)
  const [termYears, setTermYears] = useState(defaults?.termYears ?? 28)
  const [extraMonthly, setExtraMonthly] = useState(200)
  const [lumpAmount, setLumpAmount] = useState(10_000)
  const [lumpMonth, setLumpMonth] = useState(12)

  const monthlyPayment = useMemo(() => {
    if (defaults?.monthlyPayment && balance === (defaults.balance ?? balance)) {
      return defaults.monthlyPayment
    }
    return monthlyPaymentForLoan(balance, rate, termYears * 12)
  }, [balance, rate, termYears, defaults?.monthlyPayment, defaults?.balance])

  const scenarios = useMemo<ScenarioRow[]>(() => {
    const shared = {
      startingBalance: balance,
      annualRatePct: rate,
      monthlyPayment,
    }
    return [
      {
        key: 'baseline',
        label: 'No extra',
        color: 'var(--color-surface-500)',
        sim: simulateScenario(shared),
      },
      {
        key: 'monthly',
        label: `Extra ${formatUSD(extraMonthly)}/mo`,
        color: 'var(--color-accent-500)',
        sim: simulateScenario({ ...shared, extraPrincipal: extraMonthly }),
      },
      {
        key: 'biweekly',
        label: 'Biweekly (13/yr)',
        color: 'var(--color-success-600)',
        sim: simulateScenario({ ...shared, extraPrincipal: monthlyPayment / 12 }),
      },
      {
        key: 'lump',
        label: `Lump ${formatUSD(lumpAmount)} @ mo ${lumpMonth}`,
        color: 'var(--color-warning-600)',
        sim: simulateScenario({
          ...shared,
          lumpSum: { month: lumpMonth, amount: lumpAmount },
        }),
      },
    ]
  }, [balance, rate, monthlyPayment, extraMonthly, lumpAmount, lumpMonth])

  const baseline = scenarios[0]

  const chartSeries: ChartSeries[] = scenarios.map((s) => ({
    key: s.key,
    label: s.label,
    color: s.color,
    history: s.sim.history,
    months: s.sim.months,
  }))

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
          <h2 className="font-display text-lg font-semibold text-surface-900">Your loan</h2>
          <p className="mt-1 text-sm text-surface-500">
            We&rsquo;ll run four prepayment strategies side-by-side.
          </p>
          <div className="mt-6 space-y-5">
            <NumberField
              label="Mortgage balance"
              prefix="$"
              value={balance}
              onChange={setBalance}
              step={1000}
            />
            <NumberField
              label="Interest rate"
              suffix="%"
              value={rate}
              onChange={setRate}
              step={0.125}
            />
            <NumberField
              label="Term remaining"
              suffix="years"
              value={termYears}
              onChange={setTermYears}
              step={1}
              min={1}
            />
          </div>

          <div className="mt-7 border-t border-surface-200 pt-6">
            <h3 className="font-display text-base font-semibold text-surface-900">
              Extra each month
            </h3>
            <p className="mt-1 text-xs text-surface-500">
              Sent on top of every regular payment.
            </p>
            <div className="mt-4">
              <NumberField
                label="Amount"
                prefix="$"
                value={extraMonthly}
                onChange={setExtraMonthly}
                step={25}
              />
            </div>
          </div>

          <div className="mt-7 border-t border-surface-200 pt-6">
            <h3 className="font-display text-base font-semibold text-surface-900">
              Biweekly equivalent
            </h3>
            <p className="mt-1 text-xs text-surface-500">
              13 full payments per year — modeled as {formatUSD(monthlyPayment / 12)}/mo extra.
            </p>
          </div>

          <div className="mt-7 border-t border-surface-200 pt-6">
            <h3 className="font-display text-base font-semibold text-surface-900">
              One-time lump sum
            </h3>
            <p className="mt-1 text-xs text-surface-500">
              Applied entirely to principal at a single month.
            </p>
            <div className="mt-4 space-y-4">
              <NumberField
                label="Amount"
                prefix="$"
                value={lumpAmount}
                onChange={setLumpAmount}
                step={500}
              />
              <NumberField
                label="Applied at month"
                value={lumpMonth}
                onChange={setLumpMonth}
                step={1}
                min={1}
                hint="Month from now. A lump that arrives after natural payoff is a no-op."
              />
            </div>
          </div>

          <div className="mt-7 rounded-lg border border-surface-200 bg-surface-50 p-4">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-surface-500">Scheduled monthly payment</span>
              <span className="font-mono font-medium text-surface-900">
                {formatUSD(monthlyPayment)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-lg">
          <div className="border-b border-surface-200 px-6 pb-5 pt-5">
            <h3 className="font-display text-base font-semibold text-surface-900">
              Balance over time
            </h3>
            <p className="mt-1 text-xs text-surface-500">
              Hover the chart to read each scenario&rsquo;s balance at any month.
            </p>
            <div className="mt-4 h-72">
              <MultiPayoffChart series={chartSeries} className="h-full w-full" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                <tr>
                  <th className="px-4 py-3">Scenario</th>
                  <th className="px-4 py-3 text-right">Payoff</th>
                  <th className="px-4 py-3 text-right">Total interest</th>
                  <th className="px-4 py-3 text-right">Saved vs. baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-surface-900">
                {scenarios.map((s) => (
                  <tr key={s.key}>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-medium">{s.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number.isFinite(s.sim.months) ? payoffDate(s.sim.months) : '—'}
                      <div className="text-xs text-surface-500">
                        {formatYearsMonths(s.sim.months)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatUSD(s.sim.totalInterest)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {s.key === 'baseline' ? (
                        <span className="text-surface-400">—</span>
                      ) : (
                        <span className="text-success-700">
                          {formatUSD(Math.max(0, baseline.sim.totalInterest - s.sim.totalInterest))}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

