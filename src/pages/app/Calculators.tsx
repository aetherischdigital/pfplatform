import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Calculator as CalculatorIcon,
  ListOrdered,
  RefreshCw,
  Repeat,
  Scale,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PayoffCalculator, {
  type PayoffCalculatorDefaults,
} from '../../components/calculators/PayoffCalculator'
import AmortizationCalculator, {
  type AmortizationCalculatorDefaults,
} from '../../components/calculators/AmortizationCalculator'
import { fetchPfs, type Pfs } from '../../lib/pfs'
import { Button } from '../../components/ui/Button'
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
              Compare your scheduled payoff against extra-principal scenarios.
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
              See exactly where each payment goes — principal, interest, and balance — for the life of the loan.
            </p>
          </div>
        </div>

        {loading ? (
          <PayoffCalculatorSkeleton />
        ) : (
          <AmortizationCalculator defaults={pfsToAmortizationDefaults(pfs)} />
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-surface-900">More calculators</h2>
        <p className="mt-1 text-sm text-surface-500">
          Still to come in the Phase 2 release.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ComingSoonTile
            icon={Repeat}
            title="Equity projection"
            description="Project equity over time given property value, growth rate, and your loan terms."
          />
          <ComingSoonTile
            icon={RefreshCw}
            title="Refinance compare"
            description="Side-by-side: current loan vs. a new rate and term, with break-even."
          />
          <ComingSoonTile
            icon={Scale}
            title="Scenarios side-by-side"
            description="Compare no-extra, monthly-extra, biweekly, and lump-sum payoff strategies."
          />
        </div>
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

function ComingSoonTile({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="relative rounded-2xl border border-surface-200 bg-white p-5 shadow-card">
      <span className="absolute right-3 top-3 rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-500">
        Phase 2
      </span>
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-100 text-surface-500">
        <Icon size={16} />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold text-surface-900">{title}</h3>
      <p className="mt-1 text-sm text-surface-500">{description}</p>
      <Button variant="secondary" size="sm" disabled className="mt-4 w-full">
        Coming soon
      </Button>
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
