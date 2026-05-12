/**
 * Local-storage flags that drive the dashboard onboarding card. Kept out of
 * the component file so Fast Refresh doesn't complain about non-component
 * exports.
 */

export const ONBOARDING_DISMISSED_KEY = 'pfp:onboarding-dismissed'
export const ONBOARDING_CALC_VISITED_KEY = 'pfp:visited-calculator'

/** Called by the Calculators page on mount so step 3 ticks off. */
export function markCalculatorVisited(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ONBOARDING_CALC_VISITED_KEY, '1')
}
