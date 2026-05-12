import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ListPlus, Home, Calculator as CalcIcon, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  ONBOARDING_DISMISSED_KEY as DISMISSED_KEY,
  ONBOARDING_CALC_VISITED_KEY as CALC_VISITED_KEY,
} from '../../lib/onboarding'

type OnboardingState = {
  hasAnyPfs: boolean
  hasMortgage: boolean
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
 * 3-step onboarding nudge for first-time users on the dashboard. Auto-checks
 * steps off as the user does them. User can dismiss for good with the X — the
 * dismissed flag persists in localStorage and once all three steps are done
 * the card simply stops rendering.
 */
export default function OnboardingCard({
  hasAnyPfs,
  hasMortgage,
}: OnboardingState) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(DISMISSED_KEY) === '1'
  })
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

  const steps: Step[] = [
    {
      icon: ListPlus,
      title: 'Add an asset or liability',
      body: 'Start with one row in your PFS — the home, a retirement account, anything.',
      ctaLabel: 'Open the PFS',
      ctaTo: '/app/financials',
      done: hasAnyPfs,
    },
    {
      icon: Home,
      title: 'Add your mortgage',
      body: 'Enter your balance, rate, and monthly payment to unlock equity + payoff projections.',
      ctaLabel: 'Add mortgage',
      ctaTo: '/app/financials',
      done: hasMortgage,
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

  const allDone = steps.every((s) => s.done)
  if (dismissed || allDone) return null

  const dismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISSED_KEY, '1')
    }
  }

  const doneCount = steps.filter((s) => s.done).length

  return (
    <div className="relative rounded-2xl border border-accent-200 bg-accent-100/50 p-6 shadow-card animate-fade-in sm:p-8">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-md p-2 text-surface-500 transition-colors hover:bg-surface-50 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
        aria-label="Dismiss onboarding"
      >
        <X size={14} />
      </button>
      <div className="flex flex-col gap-1 pr-10">
        <p className="font-mono text-xs uppercase tracking-wider text-accent-600">
          Getting started — {doneCount} of {steps.length} done
        </p>
        <h2 className="font-display text-xl font-semibold tracking-tight text-surface-900">
          Set up your ledger in three steps.
        </h2>
      </div>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
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
                    s.done
                      ? 'bg-success-600 text-white'
                      : 'bg-surface-900 text-accent-400'
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

