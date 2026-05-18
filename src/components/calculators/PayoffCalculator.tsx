import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import PayoffChart from '../PayoffChart'
import {
  compareScenarios,
  monthlyPaymentForLoan,
  formatUSD,
  formatYearsMonths,
  payoffDate,
} from '../../lib/mortgage'
import { formFieldClass } from '../ui/formStyles'

export type PayoffCalculatorDefaults = {
  balance?: number
  rate?: number
  termYears?: number
  extra?: number
  monthlyPayment?: number
}

type Props = {
  defaults?: PayoffCalculatorDefaults
  /** Optional content rendered under the results card — e.g. a signup CTA on the public page. */
  footer?: ReactNode
}

export default function PayoffCalculator({ defaults, footer }: Props) {
  const [balance, setBalance] = useState(defaults?.balance ?? 312_500)
  const [rate, setRate] = useState(defaults?.rate ?? 6.5)
  const [termYears, setTermYears] = useState(defaults?.termYears ?? 28)
  const [extra, setExtra] = useState(defaults?.extra ?? 200)

  // If we have a known monthly payment (e.g. user's actual Note), use it.
  // Otherwise derive it from balance/rate/term.
  const monthlyPayment = useMemo(() => {
    if (defaults?.monthlyPayment && balance === (defaults.balance ?? balance)) {
      return defaults.monthlyPayment
    }
    return monthlyPaymentForLoan(balance, rate, termYears * 12)
  }, [balance, rate, termYears, defaults?.monthlyPayment, defaults?.balance])

  const result = useMemo(
    () => compareScenarios(balance, rate, monthlyPayment, extra),
    [balance, rate, monthlyPayment, extra],
  )
  const { baseline, scenario, monthsSaved, interestSaved } = result

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
          <h2 className="font-display text-lg font-semibold text-surface-900">Your loan</h2>
          <p className="mt-1 text-sm text-surface-500">
            We&rsquo;ll compute your monthly payment from these.
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
            <h3 className="font-display text-base font-semibold text-surface-900">Pay extra</h3>
            <p className="mt-1 text-sm text-surface-500">The lever that changes everything.</p>
            <div className="mt-5">
              <NumberField
                label="Extra principal each month"
                prefix="$"
                value={extra}
                onChange={setExtra}
                step={25}
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
            <div className="mt-2 flex items-baseline justify-between text-sm">
              <span className="text-surface-500">Total monthly outflow</span>
              <span className="font-mono font-medium text-surface-900">
                {formatUSD(monthlyPayment + extra)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-surface-200">
            <ResultStat
              label="Payoff date"
              value={payoffDate(scenario.months)}
              sub={`Baseline: ${payoffDate(baseline.months)}`}
              accent
            />
            <ResultStat
              label="Time saved"
              value={formatYearsMonths(Math.max(0, monthsSaved))}
              sub={extra > 0 ? 'off your loan' : 'add some extra to start'}
            />
            <ResultStat
              label="Interest saved"
              value={formatUSD(Math.max(0, interestSaved))}
              sub="over the life of the loan"
            />
          </div>

          <div className="border-t border-surface-200 px-6 pb-6 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-surface-900">
                Loan balance over time
              </h3>
              <Legend />
            </div>
            <div className="mt-4 h-72">
              <PayoffChart baseline={baseline} scenario={scenario} className="h-full w-full" />
            </div>
          </div>
        </div>

        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  )
}

function ResultStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  return (
    <div className="p-6">
      <div className="text-xs font-medium uppercase tracking-wider text-surface-500">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-semibold leading-tight tracking-tight ${
          accent ? 'text-accent-600' : 'text-surface-900'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-surface-500">{sub}</div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-surface-500">
      <span className="flex items-center gap-1.5">
        <span className="block h-0.5 w-5 bg-surface-300" />
        Baseline
      </span>
      <span className="flex items-center gap-1.5">
        <span className="block h-0.5 w-5 bg-accent-500" />
        With extra
      </span>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
  min = 0,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  min?: number
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-surface-700">{label}</span>
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => {
            const n = Number(e.target.value)
            onChange(Number.isFinite(n) ? Math.max(min, n) : min)
          }}
          step={step}
          min={min}
          className={`${formFieldClass} text-base ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-16' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}
