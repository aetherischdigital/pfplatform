import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Calculator as CalculatorIcon,
  ListOrdered,
  RefreshCw,
  Split,
  TrendingUp,
} from 'lucide-react'
import PayoffCalculator, {
  type PayoffCalculatorDefaults,
} from '../../components/calculators/PayoffCalculator'
import AmortizationCalculator, {
  type AmortizationCalculatorDefaults,
} from '../../components/calculators/AmortizationCalculator'
import EquityProjectionCalculator, {
  type EquityCalculatorDefaults,
} from '../../components/calculators/EquityProjectionCalculator'
import MultiScenarioPayoffCalculator, {
  type MultiScenarioCalculatorDefaults,
} from '../../components/calculators/MultiScenarioPayoffCalculator'
import RefinanceCompareCalculator, {
  type RefinanceCalculatorDefaults,
} from '../../components/calculators/RefinanceCompareCalculator'
import { fetchPfs, type Pfs } from '../../lib/pfs'
import { markCalculatorVisited } from '../../lib/onboarding'

export default function Calculators() {
  const [pfs, setPfs] = useState<Pfs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // Onboarding step 3: visiting this page checks off "Run a what-if scenario."
    markCalculatorVisited()
    fetchPfs()
      .then((data) => {
        if (!cancelled) setPfs(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const defaults = pfsToCalculatorDefaults(pfs)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
          Calculators
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          {pfs?.mortgage
            ? 'Pre-filled with your mortgage. Edit any value to model a what-if.'
            : 'Run scenarios on your loan. Add a mortgage in your PFS to pre-fill these.'}
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-600">
            <CalculatorIcon size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-surface-900">
              Mortgage payoff
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">
              How much faster does your loan disappear if you send extra each month?
            </p>
          </div>
        </div>

        {loading ? <PayoffCalculatorSkeleton /> : <PayoffCalculator defaults={defaults} />}
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-600">
            <ListOrdered size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-surface-900">
              Amortization schedule
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">
              Where does every dollar of every payment go? Here&rsquo;s the receipt, month by month.
            </p>
          </div>
        </div>

        {loading ? (
          <PayoffCalculatorSkeleton />
        ) : (
          <AmortizationCalculator defaults={pfsToAmortizationDefaults(pfs)} />
        )}
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-600">
            <TrendingUp size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-surface-900">
              Equity projection
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">
              Two things build equity: your home value rising, and your balance falling. Watch them work together.
            </p>
          </div>
        </div>

        {loading ? (
          <PayoffCalculatorSkeleton />
        ) : (
          <EquityProjectionCalculator defaults={pfsToEquityDefaults(pfs)} />
        )}
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-600">
            <Split size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-surface-900">
              Payoff scenarios
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">
              Four ways to retire your loan early. Which one fits your situation?
            </p>
          </div>
        </div>

        {loading ? (
          <PayoffCalculatorSkeleton />
        ) : (
          <MultiScenarioPayoffCalculator defaults={pfsToMultiScenarioDefaults(pfs)} />
        )}
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-600">
            <RefreshCw size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-surface-900">
              Refinance compare
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">
              A lower payment isn&rsquo;t free. What does it cost &mdash; and when does it pay for itself?
            </p>
          </div>
        </div>

        {loading ? (
          <PayoffCalculatorSkeleton />
        ) : (
          <RefinanceCompareCalculator defaults={pfsToRefinanceDefaults(pfs)} />
        )}
      </section>
    </div>
  )
}

function PayoffCalculatorSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <div className="space-y-5 rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
          <div className="h-5 w-32 animate-pulse rounded bg-surface-100" />
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-100" />
                <div className="h-10 w-full animate-pulse rounded-md bg-surface-100" />
              </div>
            ))}
          </div>
          <div className="h-20 animate-pulse rounded-lg bg-surface-100" />
        </div>
      </div>
      <div className="lg:col-span-7">
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card-lg">
          <div className="grid grid-cols-1 divide-y divide-surface-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2 p-6">
                <div className="h-3 w-20 animate-pulse rounded bg-surface-100" />
                <div className="h-7 w-28 animate-pulse rounded bg-surface-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-surface-100" />
              </div>
            ))}
          </div>
          <div className="border-t border-surface-200 p-6">
            <div className="h-72 w-full animate-pulse rounded bg-surface-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

function pfsToCalculatorDefaults(pfs: Pfs | null): PayoffCalculatorDefaults | undefined {
  if (!pfs?.mortgage) return undefined
  const m = pfs.mortgage
  return {
    balance: m.balance,
    rate: m.ratePct,
    termYears: Math.max(1, Math.round(m.termMonthsRemaining / 12)),
    extra: m.extraPrincipal,
    monthlyPayment: m.monthlyPayment,
  }
}

function pfsToAmortizationDefaults(pfs: Pfs | null): AmortizationCalculatorDefaults | undefined {
  if (!pfs?.mortgage) return undefined
  const m = pfs.mortgage
  return {
    balance: m.balance,
    rate: m.ratePct,
    termYears: Math.max(1, Math.round(m.termMonthsRemaining / 12)),
  }
}

function pfsToEquityDefaults(pfs: Pfs | null): EquityCalculatorDefaults | undefined {
  if (!pfs?.mortgage) return undefined
  const m = pfs.mortgage
  return {
    startingHomeValue: m.startingHomeValue,
    balance: m.balance,
    rate: m.ratePct,
    termYears: Math.max(1, Math.round(m.termMonthsRemaining / 12)),
    monthlyPayment: m.monthlyPayment,
    extra: m.extraPrincipal,
  }
}

function pfsToMultiScenarioDefaults(pfs: Pfs | null): MultiScenarioCalculatorDefaults | undefined {
  if (!pfs?.mortgage) return undefined
  const m = pfs.mortgage
  return {
    balance: m.balance,
    rate: m.ratePct,
    termYears: Math.max(1, Math.round(m.termMonthsRemaining / 12)),
    monthlyPayment: m.monthlyPayment,
  }
}

function pfsToRefinanceDefaults(pfs: Pfs | null): RefinanceCalculatorDefaults | undefined {
  if (!pfs?.mortgage) return undefined
  const m = pfs.mortgage
  return {
    currentBalance: m.balance,
    currentRatePct: m.ratePct,
    currentRemainingYears: Math.max(1, Math.round(m.termMonthsRemaining / 12)),
  }
}
