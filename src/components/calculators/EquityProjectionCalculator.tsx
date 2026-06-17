import { useMemo, useState } from 'react'
import EquityProjectionChart from '../EquityProjectionChart'
import { projectEquity } from '../../lib/equity'
import {
  formatUSD,
  formatYearsMonths,
  monthlyPaymentForLoan,
} from '../../lib/mortgage'
import { NumberField } from '../ui/NumberField'

export type EquityCalculatorDefaults = {
  startingHomeValue?: number
  balance?: number
  rate?: number
  termYears?: number
  monthlyPayment?: number
  extra?: number
}

type Props = {
  defaults?: EquityCalculatorDefaults
}

const HORIZON_OPTIONS = [5, 10, 15, 20, 30] as const

export default function EquityProjectionCalculator({ defaults }: Props) {
  const [homeValue, setHomeValue] = useState(defaults?.startingHomeValue ?? 425_000)
  const [balance, setBalance] = useState(defaults?.balance ?? 312_500)
  const [appreciationPct, setAppreciationPct] = useState(3)
  const [rate, setRate] = useState(defaults?.rate ?? 6.5)
  const [termYears, setTermYears] = useState(defaults?.termYears ?? 28)
  const [extra, setExtra] = useState(defaults?.extra ?? 0)
  const [horizonYears, setHorizonYears] = useState<(typeof HORIZON_OPTIONS)[number]>(30)

  const monthlyPayment = useMemo(() => {
    if (defaults?.monthlyPayment && balance === (defaults.balance ?? balance)) {
      return defaults.monthlyPayment
    }
    return monthlyPaymentForLoan(balance, rate, termYears * 12)
  }, [balance, rate, termYears, defaults?.monthlyPayment, defaults?.balance])

  const points = useMemo(
    () =>
      projectEquity({
        startingHomeValue: homeValue,
        startingBalance: balance,
        annualAppreciationPct: appreciationPct,
        annualRatePct: rate,
        monthlyPayment,
        extraPrincipal: extra,
        months: horizonYears * 12,
      }),
    [homeValue, balance, appreciationPct, rate, monthlyPayment, extra, horizonYears],
  )

  const startingEquity = points[0]?.equity ?? 0
  const endingPoint = points[points.length - 1]
  const endingEquity = endingPoint?.equity ?? 0
  const totalAppreciation = (endingPoint?.homeValue ?? homeValue) - homeValue
  const principalPaidDown = balance - (endingPoint?.balance ?? balance)

  // First month at which balance reaches zero, if within the horizon.
  const payoffMonth = useMemo(() => {
    for (let i = 0; i < points.length; i++) {
      if (points[i].balance <= 0.01) return points[i].month
    }
    return null
  }, [points])

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
          <h2 className="font-display text-lg font-semibold text-surface-900">Your property</h2>
          <p className="mt-1 text-sm text-surface-500">
            How fast equity builds depends on both sides: value rising and balance falling.
          </p>
          <div className="mt-6 space-y-5">
            <NumberField
              label="Home value (today)"
              prefix="$"
              value={homeValue}
              onChange={setHomeValue}
              step={1000}
            />
            <NumberField
              label="Mortgage balance"
              prefix="$"
              value={balance}
              onChange={setBalance}
              step={1000}
            />
            <NumberField
              label="Annual appreciation"
              suffix="%"
              value={appreciationPct}
              onChange={setAppreciationPct}
              step={0.25}
              min={-10}
              hint="Long-run U.S. average is roughly 3–4%. Negative for a soft market."
            />
          </div>

          <div className="mt-7 border-t border-surface-200 pt-6">
            <h3 className="font-display text-base font-semibold text-surface-900">Your loan</h3>
            <div className="mt-5 space-y-5">
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
              <NumberField
                label="Extra principal each month"
                prefix="$"
                value={extra}
                onChange={setExtra}
                step={25}
              />
            </div>
          </div>

          <div className="mt-7 border-t border-surface-200 pt-6">
            <h3 className="font-display text-base font-semibold text-surface-900">
              Projection horizon
            </h3>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {HORIZON_OPTIONS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setHorizonYears(y)}
                  className={`rounded-md border px-2 py-2 text-sm font-medium transition-colors ${
                    horizonYears === y
                      ? 'border-accent-500 bg-accent-50 text-accent-700'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                  }`}
                >
                  {y}y
                </button>
              ))}
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
          <div className="grid grid-cols-1 divide-y divide-surface-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <ResultStat
              label="Equity today"
              value={formatUSD(startingEquity)}
              sub={`${pctOf(startingEquity, homeValue)} of home value`}
            />
            <ResultStat
              label={`Equity in ${horizonYears}y`}
              value={formatUSD(endingEquity)}
              sub={`+${formatUSD(endingEquity - startingEquity)} vs. today`}
              accent
            />
            <ResultStat
              label={payoffMonth !== null ? 'Loan paid off in' : 'Principal paid down'}
              value={
                payoffMonth !== null
                  ? formatYearsMonths(payoffMonth)
                  : formatUSD(principalPaidDown)
              }
              sub={
                payoffMonth !== null
                  ? `${formatUSD(totalAppreciation)} in appreciation`
                  : `${formatUSD(totalAppreciation)} in appreciation on top`
              }
            />
          </div>

          <div className="border-t border-surface-200 px-6 pb-6 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-surface-900">
                Home value vs. mortgage balance
              </h3>
              <Legend />
            </div>
            <div className="mt-4 h-72">
              <EquityProjectionChart points={points} className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function pctOf(part: number, whole: number): string {
  if (!Number.isFinite(whole) || whole <= 0) return '—'
  return `${Math.round((part / whole) * 100)}%`
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-surface-500">
      <span className="flex items-center gap-1.5">
        <span className="block h-2.5 w-2.5 rounded-sm bg-accent-500/30" />
        Equity
      </span>
      <span className="flex items-center gap-1.5">
        <span className="block h-2.5 w-2.5 rounded-sm bg-surface-200" />
        Balance
      </span>
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
      <div className="font-mono text-[11px] uppercase tracking-wider text-surface-500">{label}</div>
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

