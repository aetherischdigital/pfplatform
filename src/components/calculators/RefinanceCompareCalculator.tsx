import { useMemo, useState } from 'react'
import { compareRefinance } from '../../lib/refinance'
import { formatUSD, formatYearsMonths } from '../../lib/mortgage'
import { NumberField } from '../ui/NumberField'
import PitiLine from './PitiLine'

export type RefinanceCalculatorDefaults = {
  currentBalance?: number
  currentRatePct?: number
  currentRemainingYears?: number
  propertyTaxAnnual?: number | null
  homeownersInsuranceAnnual?: number | null
  hoaMonthly?: number | null
  floodInsuranceAnnual?: number | null
  pmiMipMonthly?: number | null
}

type Props = {
  defaults?: RefinanceCalculatorDefaults
}

export default function RefinanceCompareCalculator({ defaults }: Props) {
  const [currentBalance, setCurrentBalance] = useState(defaults?.currentBalance ?? 312_500)
  const [currentRate, setCurrentRate] = useState(defaults?.currentRatePct ?? 7.25)
  const [currentRemainingYears, setCurrentRemainingYears] = useState(
    defaults?.currentRemainingYears ?? 28,
  )
  const [newRate, setNewRate] = useState(5.5)
  const [newTermYears, setNewTermYears] = useState(30)
  const [closingCosts, setClosingCosts] = useState(6_000)

  const result = useMemo(
    () =>
      compareRefinance({
        currentBalance,
        currentRatePct: currentRate,
        currentRemainingMonths: Math.max(1, Math.round(currentRemainingYears * 12)),
        newRatePct: newRate,
        newTermMonths: Math.max(1, Math.round(newTermYears * 12)),
        closingCosts,
      }),
    [
      currentBalance,
      currentRate,
      currentRemainingYears,
      newRate,
      newTermYears,
      closingCosts,
    ],
  )

  const savesMonthly = result.monthlySavings > 0
  const savesLifetime = result.netLifetimeSavings > 0

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
            <h3 className="font-display text-base font-semibold text-surface-900">
              Current loan
            </h3>
            <p className="mt-1 text-xs text-surface-500">What you have today.</p>
            <div className="mt-5 space-y-4">
              <NumberField
                label="Balance"
                prefix="$"
                value={currentBalance}
                onChange={setCurrentBalance}
                step={1000}
              />
              <NumberField
                label="Interest rate"
                suffix="%"
                value={currentRate}
                onChange={setCurrentRate}
                step={0.125}
              />
              <NumberField
                label="Term remaining"
                suffix="years"
                value={currentRemainingYears}
                onChange={setCurrentRemainingYears}
                step={1}
                min={1}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-accent-200 bg-accent-50/40 p-6 shadow-card">
            <h3 className="font-display text-base font-semibold text-surface-900">
              New loan
            </h3>
            <p className="mt-1 text-xs text-surface-500">What you&rsquo;re considering.</p>
            <div className="mt-5 space-y-4">
              <NumberField
                label="Interest rate"
                suffix="%"
                value={newRate}
                onChange={setNewRate}
                step={0.125}
              />
              <NumberField
                label="Term"
                suffix="years"
                value={newTermYears}
                onChange={setNewTermYears}
                step={1}
                min={1}
              />
              <NumberField
                label="Closing costs"
                prefix="$"
                value={closingCosts}
                onChange={setClosingCosts}
                step={250}
                hint="Paid out of pocket. Rolling them into the loan would add to the balance instead."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-lg">
          <div className="grid grid-cols-1 divide-y divide-surface-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <ResultStat
              label="Monthly payment"
              value={formatUSD(result.newMonthly)}
              sub={
                savesMonthly
                  ? `Save ${formatUSD(result.monthlySavings)}/mo vs. ${formatUSD(result.currentMonthly)}`
                  : `${formatUSD(-result.monthlySavings)}/mo MORE than ${formatUSD(result.currentMonthly)}`
              }
              tone={savesMonthly ? 'good' : 'bad'}
            />
            <ResultStat
              label="Break-even"
              value={
                result.breakEvenMonths === null
                  ? '—'
                  : !Number.isFinite(result.breakEvenMonths)
                    ? 'Never'
                    : formatYearsMonths(result.breakEvenMonths)
              }
              sub={
                result.breakEvenMonths === null
                  ? "New payment isn't lower — break-even doesn't apply this way."
                  : result.breakEvenMonths === 0
                    ? 'No closing costs to recoup.'
                    : `Until monthly savings cover ${formatUSD(closingCosts)} in closing costs.`
              }
            />
            <ResultStat
              label="Lifetime impact"
              value={
                savesLifetime
                  ? `+${formatUSD(result.netLifetimeSavings)}`
                  : `−${formatUSD(-result.netLifetimeSavings)}`
              }
              sub={
                savesLifetime
                  ? 'Net savings over the new loan, after closing costs.'
                  : 'You pay more lifetime, after closing costs.'
              }
              tone={savesLifetime ? 'good' : 'bad'}
              accent
            />
          </div>

          <div className="border-t border-surface-200 px-6 py-5">
            <h3 className="font-display text-base font-semibold text-surface-900">
              The full picture
            </h3>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow
                label="Total interest, current loan"
                value={formatUSD(result.currentTotalInterest)}
              />
              <DetailRow
                label="Total interest, new loan"
                value={formatUSD(result.newTotalInterest)}
              />
              <DetailRow
                label="Interest difference"
                value={
                  result.totalInterestDelta >= 0
                    ? `Save ${formatUSD(result.totalInterestDelta)}`
                    : `Pay ${formatUSD(-result.totalInterestDelta)} more`
                }
                tone={result.totalInterestDelta >= 0 ? 'good' : 'bad'}
              />
              <DetailRow label="Closing costs (out of pocket)" value={formatUSD(closingCosts)} />
            </dl>
            <div className="mt-5 rounded-lg border border-surface-200 bg-surface-50 p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-surface-500">
                True PITI comparison
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-surface-500">Current loan</p>
                  <PitiLine
                    monthlyPayment={result.currentMonthly}
                    propertyTaxAnnual={defaults?.propertyTaxAnnual ?? null}
                    homeownersInsuranceAnnual={defaults?.homeownersInsuranceAnnual ?? null}
                    hoaMonthly={defaults?.hoaMonthly ?? null}
                    floodInsuranceAnnual={defaults?.floodInsuranceAnnual ?? null}
                    pmiMipMonthly={defaults?.pmiMipMonthly ?? null}
                  />
                </div>
                <div>
                  <p className="text-xs text-surface-500">After refinance</p>
                  <PitiLine
                    monthlyPayment={result.newMonthly}
                    propertyTaxAnnual={defaults?.propertyTaxAnnual ?? null}
                    homeownersInsuranceAnnual={defaults?.homeownersInsuranceAnnual ?? null}
                    hoaMonthly={defaults?.hoaMonthly ?? null}
                    floodInsuranceAnnual={defaults?.floodInsuranceAnnual ?? null}
                    pmiMipMonthly={defaults?.pmiMipMonthly ?? null}
                  />
                </div>
              </div>
              {defaults?.propertyTaxAnnual == null &&
                defaults?.homeownersInsuranceAnnual == null &&
                defaults?.hoaMonthly == null && (
                  <p className="mt-2 text-xs text-surface-500">
                    Add property tax, insurance, or HOA to your mortgage in Financials to see true monthly costs here.
                  </p>
                )}
            </div>
            <p className="mt-3 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-xs text-surface-600">
              <strong className="font-semibold text-surface-900">Heads up:</strong>{' '}
              Break-even only pays off if you stay in the home (and keep this loan) past
              that date. Extending the term lowers your monthly but can add lifetime
              interest — watch the &ldquo;Interest difference&rdquo; row above.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultStat({
  label,
  value,
  sub,
  tone,
  accent,
}: {
  label: string
  value: string
  sub: string
  tone?: 'good' | 'bad'
  accent?: boolean
}) {
  const toneClass =
    tone === 'good'
      ? 'text-success-700'
      : tone === 'bad'
        ? 'text-danger-700'
        : accent
          ? 'text-accent-600'
          : 'text-surface-900'
  return (
    <div className="p-6">
      <div className="font-mono text-[11px] uppercase tracking-wider text-surface-500">{label}</div>
      <div
        className={`mt-2 font-display text-2xl font-semibold leading-tight tracking-tight ${toneClass}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-surface-500">{sub}</div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'good' | 'bad'
}) {
  const toneClass =
    tone === 'good' ? 'text-success-700' : tone === 'bad' ? 'text-danger-700' : 'text-surface-900'
  return (
    <div>
      <dt className="text-xs text-surface-500">{label}</dt>
      <dd className={`mt-1 font-mono text-sm font-medium ${toneClass}`}>{value}</dd>
    </div>
  )
}

