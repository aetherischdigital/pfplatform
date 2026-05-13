import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Calculator as CalculatorIcon,
  ListOrdered,
  RefreshCw,
  Split,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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

type TabId = 'payoff' | 'amortization' | 'equity' | 'scenarios' | 'refinance'

type Tab = {
  id: TabId
  label: string
  icon: LucideIcon
  title: string
  blurb: string
}

const TABS: Tab[] = [
  {
    id: 'payoff',
    label: 'Payoff',
    icon: CalculatorIcon,
    title: 'Mortgage payoff',
    blurb: 'How much faster does your loan disappear if you send extra each month?',
  },
  {
    id: 'amortization',
    label: 'Amortization',
    icon: ListOrdered,
    title: 'Amortization schedule',
    blurb:
      'Where does every dollar of every payment go? Here’s the receipt, month by month.',
  },
  {
    id: 'equity',
    label: 'Equity',
    icon: TrendingUp,
    title: 'Equity projection',
    blurb:
      'Two things build equity: your home value rising, and your balance falling. Watch them work together.',
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    icon: Split,
    title: 'Payoff scenarios',
    blurb: 'Four ways to retire your loan early. Which one fits your situation?',
  },
  {
    id: 'refinance',
    label: 'Refinance',
    icon: RefreshCw,
    title: 'Refinance compare',
    blurb:
      'A lower payment isn’t free. What does it cost — and when does it pay for itself?',
  },
]

function tabFromHash(hash: string): TabId {
  const id = hash.replace(/^#/, '') as TabId
  return TABS.some((t) => t.id === id) ? id : 'payoff'
}

export default function Calculators() {
  const [pfs, setPfs] = useState<Pfs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    typeof window === 'undefined' ? 'payoff' : tabFromHash(window.location.hash),
  )

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

  // Reflect tab choice in the URL hash so deep-links + back/forward work.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onHashChange = () => setActiveTab(tabFromHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const selectTab = (id: TabId) => {
    setActiveTab(id)
    if (typeof window !== 'undefined') {
      // Use replaceState so tab clicks don't pollute history; back button still
      // takes you back to wherever you came from.
      window.history.replaceState(null, '', `#${id}`)
    }
  }

  const active = TABS.find((t) => t.id === activeTab) ?? TABS[0]

  return (
    <div className="space-y-6">
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

      <div
        role="tablist"
        aria-label="Calculators"
        className="sticky top-0 z-20 -mx-6 overflow-x-auto border-b border-surface-200 bg-surface-50/95 px-6 backdrop-blur"
      >
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = t.id === activeTab
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => selectTab(t.id)}
                className={`flex flex-shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 ${
                  isActive
                    ? 'border-accent-500 text-surface-900'
                    : 'border-transparent text-surface-500 hover:text-surface-900'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <section className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-accent-100 text-accent-600">
            <active.icon size={18} />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-surface-900">
              {active.title}
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">{active.blurb}</p>
          </div>
        </div>

        {loading ? (
          <PayoffCalculatorSkeleton />
        ) : activeTab === 'payoff' ? (
          <PayoffCalculator defaults={pfsToCalculatorDefaults(pfs)} />
        ) : activeTab === 'amortization' ? (
          <AmortizationCalculator defaults={pfsToAmortizationDefaults(pfs)} />
        ) : activeTab === 'equity' ? (
          <EquityProjectionCalculator defaults={pfsToEquityDefaults(pfs)} />
        ) : activeTab === 'scenarios' ? (
          <MultiScenarioPayoffCalculator defaults={pfsToMultiScenarioDefaults(pfs)} />
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
    propertyTaxAnnual: m.propertyTaxAnnual,
    homeownersInsuranceAnnual: m.homeownersInsuranceAnnual,
    hoaMonthly: m.hoaMonthly,
  }
}

function pfsToAmortizationDefaults(pfs: Pfs | null): AmortizationCalculatorDefaults | undefined {
  if (!pfs?.mortgage) return undefined
  const m = pfs.mortgage
  return {
    balance: m.balance,
    rate: m.ratePct,
    termYears: Math.max(1, Math.round(m.termMonthsRemaining / 12)),
    propertyTaxAnnual: m.propertyTaxAnnual,
    homeownersInsuranceAnnual: m.homeownersInsuranceAnnual,
    hoaMonthly: m.hoaMonthly,
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
    propertyTaxAnnual: m.propertyTaxAnnual,
    homeownersInsuranceAnnual: m.homeownersInsuranceAnnual,
    hoaMonthly: m.hoaMonthly,
  }
}

function pfsToRefinanceDefaults(pfs: Pfs | null): RefinanceCalculatorDefaults | undefined {
  if (!pfs?.mortgage) return undefined
  const m = pfs.mortgage
  return {
    currentBalance: m.balance,
    currentRatePct: m.ratePct,
    currentRemainingYears: Math.max(1, Math.round(m.termMonthsRemaining / 12)),
    propertyTaxAnnual: m.propertyTaxAnnual,
    homeownersInsuranceAnnual: m.homeownersInsuranceAnnual,
    hoaMonthly: m.hoaMonthly,
  }
}
