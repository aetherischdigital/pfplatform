import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ListPlus, Home, Wallet, Calculator as CalcIcon, Search, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  ONBOARDING_DISMISSED_KEY as DISMISSED_KEY,
  ONBOARDING_CALC_VISITED_KEY as CALC_VISITED_KEY,
  getHomeStatus,
  setHomeStatus,
  type HomeStatus,
} from '../../lib/onboarding'

type OnboardingState = {
  /** True once the user has at least one property on file. */
  hasProperty: boolean
  hasAnyPfs: boolean
  /** True when the user has BOTH an income source AND a living expense — the
   *  cash flow waterfall needs both to tell a coherent story. */
  hasCashFlowInputs: boolean
}

type Step = {
  icon: LucideIcon
  title: string
  body: string
  ctaLabel: string
  ctaTo: string
  done: boolean
}

/**
 * First-run onboarding nudge on the dashboard. Starts by asking whether the
 * user owns a home, then branches: owners lead with "add your home", planners
 * with setting up the rest of their finances. Auto-checks steps off as the user
 * does them, shrinks to a single-line nudge near the end, and can be dismissed
 * for good (persisted in localStorage).
 */
export default function OnboardingCard({
  hasProperty,
  hasAnyPfs,
  hasCashFlowInputs,
}: OnboardingState) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(DISMISSED_KEY) === '1'
  })
  const [status, setStatus] = useState<HomeStatus | null>(() => getHomeStatus())
  // Re-read the calculator-visited flag on every render. Cheap, keeps the
  // checkmark in sync without needing a focus/storage event listener.
  const [calcVisited, setCalcVisited] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(CALC_VISITED_KEY) === '1'
  })
  useEffect(() => {
    const onVisibility = () => {
      if (typeof window === 'undefined') return
      setCalcVisited(window.localStorage.getItem(CALC_VISITED_KEY) === '1')
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const dismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') window.localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (dismissed) return null

  // Owning a property always wins — a planner who buys gets the owner path.
  const branch: HomeStatus | null = hasProperty ? 'owner' : status

  // First run: ask which path before showing any steps.
  if (branch === null) {
    const choose = (s: HomeStatus) => {
      setHomeStatus(s)
      setStatus(s)
    }
    return (
      <div className="relative rounded-2xl border border-accent-200 bg-accent-100/50 p-6 shadow-card animate-fade-in sm:p-8">
        <DismissButton onClick={dismiss} corner />
        <div className="flex flex-col gap-1 pr-10">
          <p className="font-mono text-xs uppercase tracking-wider text-accent-600">
            Getting started
          </p>
          <h2 className="font-display text-xl font-semibold tracking-tight text-surface-900">
            Do you own a home?
          </h2>
          <p className="text-sm text-surface-600">
            We&rsquo;ll set up your ledger around what matters to you.
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ChoiceButton
            icon={Home}
            title="Yes, I own a home"
            body="Track equity, payoff, and your true monthly cost of ownership."
            onClick={() => choose('owner')}
          />
          <ChoiceButton
            icon={Search}
            title="Not yet — I'm planning"
            body="Set up your finances and see what you can afford."
            onClick={() => choose('planning')}
          />
        </div>
      </div>
    )
  }

  const ownerSteps: Step[] = [
    {
      icon: Home,
      title: 'Add your home',
      body: 'Value, carrying costs, and your mortgage if you have one — unlocks equity + payoff.',
      ctaLabel: 'Add property',
      ctaTo: '/app/properties/new',
      done: hasProperty,
    },
    {
      icon: Wallet,
      title: 'Add income & spending',
      body: 'Your paycheck plus everyday costs — what powers your cash-flow waterfall.',
      ctaLabel: 'Open the PFS',
      ctaTo: '/app/financials',
      done: hasCashFlowInputs,
    },
    {
      icon: ListPlus,
      title: 'Add other assets & debts',
      body: 'Retirement, investments, auto loans, credit cards — round out your net worth.',
      ctaLabel: 'Open the PFS',
      ctaTo: '/app/financials',
      done: hasAnyPfs,
    },
    {
      icon: CalcIcon,
      title: 'Run a what-if scenario',
      body: 'See how an extra $100/mo changes your payoff date.',
      ctaLabel: 'Open the calculator',
      ctaTo: '/app/calculators',
      done: calcVisited,
    },
  ]

  const planningSteps: Step[] = [
    {
      icon: Wallet,
      title: 'Add income & spending',
      body: 'Your paycheck plus everyday costs — the foundation of any plan.',
      ctaLabel: 'Open the PFS',
      ctaTo: '/app/financials',
      done: hasCashFlowInputs,
    },
    {
      icon: ListPlus,
      title: 'Add assets & debts',
      body: 'Savings, investments, student loans, credit cards — your starting net worth.',
      ctaLabel: 'Open the PFS',
      ctaTo: '/app/financials',
      done: hasAnyPfs,
    },
    {
      icon: CalcIcon,
      title: 'See what you can afford',
      body: 'Model a future mortgage and payoff before you buy.',
      ctaLabel: 'Open the calculator',
      ctaTo: '/app/calculators',
      done: calcVisited,
    },
  ]

  const steps = branch === 'owner' ? ownerSteps : planningSteps
  const allDone = steps.every((s) => s.done)
  if (allDone) return null

  const doneCount = steps.filter((s) => s.done).length
  // Once the user is mostly through, shrink to a single-line nudge.
  const compact = doneCount >= steps.length - 1
  const nextStep = steps.find((s) => !s.done)

  if (compact && nextStep) {
    return (
      <div className="relative flex items-center gap-3 rounded-xl border border-accent-200 bg-accent-100/50 px-4 py-3 shadow-card animate-fade-in">
        <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-surface-900 text-accent-400">
          <nextStep.icon size={14} />
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <span className="font-mono text-xs uppercase tracking-wider text-accent-600">
            {doneCount} of {steps.length} done —{' '}
          </span>
          <span className="font-medium text-surface-900">{nextStep.title}.</span>{' '}
          <Link
            to={nextStep.ctaTo}
            className="rounded font-medium text-surface-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
          >
            {nextStep.ctaLabel} →
          </Link>
        </div>
        <DismissButton onClick={dismiss} />
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border border-accent-200 bg-accent-100/50 p-6 shadow-card animate-fade-in sm:p-8">
      <DismissButton onClick={dismiss} corner />
      <div className="flex flex-col gap-1 pr-10">
        <p className="font-mono text-xs uppercase tracking-wider text-accent-600">
          Getting started — {doneCount} of {steps.length} done
        </p>
        <h2 className="font-display text-xl font-semibold tracking-tight text-surface-900">
          {branch === 'owner'
            ? `Set up your ledger in ${steps.length} steps.`
            : `Lay the groundwork in ${steps.length} steps.`}
        </h2>
      </div>
      <ol
        className={`mt-6 grid gap-4 sm:grid-cols-2 ${
          steps.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
        }`}
      >
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <li
              key={s.title}
              className={`flex flex-col rounded-xl border bg-white p-5 transition-colors ${
                s.done ? 'border-success-200 bg-success-50/50' : 'border-surface-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg ${
                    s.done ? 'bg-success-600 text-white' : 'bg-surface-900 text-accent-400'
                  }`}
                >
                  {s.done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-xs uppercase tracking-wider text-surface-500">
                    Step {i + 1}
                  </div>
                  <h3 className="mt-0.5 font-display text-base font-semibold text-surface-900">
                    {s.title}
                  </h3>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-surface-600">{s.body}</p>
              {!s.done && (
                <Link
                  to={s.ctaTo}
                  className="mt-4 inline-flex items-center gap-1 rounded text-sm font-medium text-surface-900 transition-colors hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                >
                  {s.ctaLabel} →
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ChoiceButton({
  icon: Icon,
  title,
  body,
  onClick,
}: {
  icon: LucideIcon
  title: string
  body: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl border border-surface-200 bg-white p-4 text-left transition-colors hover:border-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
    >
      <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-surface-900 text-accent-400">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="font-display text-base font-semibold text-surface-900">{title}</div>
        <p className="mt-0.5 text-sm leading-relaxed text-surface-600">{body}</p>
      </div>
    </button>
  )
}

function DismissButton({ onClick, corner }: { onClick: () => void; corner?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md p-2 text-surface-500 transition-colors hover:bg-surface-50 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 ${
        corner ? 'absolute right-3 top-3' : ''
      }`}
      aria-label="Dismiss onboarding"
    >
      <X size={14} />
    </button>
  )
}
