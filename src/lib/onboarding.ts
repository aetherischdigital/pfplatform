/**
 * Local-storage flags that drive the dashboard onboarding card. Kept out of
 * the component file so Fast Refresh doesn't complain about non-component
 * exports.
 */

export const ONBOARDING_DISMISSED_KEY = 'pfp:onboarding-dismissed'
export const ONBOARDING_CALC_VISITED_KEY = 'pfp:visited-calculator'
export const ONBOARDING_HOME_STATUS_KEY = 'pfp:home-status'

/** Called by the Calculators page on mount so the calculator step ticks off. */
export function markCalculatorVisited(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ONBOARDING_CALC_VISITED_KEY, '1')
}

/**
 * Whether the user owns a home or is still planning/house-hunting. Drives which
 * onboarding path they get — owners lead with "add your home", planners with
 * setting up the rest of their finances. Null until they pick on first run.
 */
export type HomeStatus = 'owner' | 'planning'

export function getHomeStatus(): HomeStatus | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(ONBOARDING_HOME_STATUS_KEY)
  return v === 'owner' || v === 'planning' ? v : null
}

export function setHomeStatus(status: HomeStatus): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ONBOARDING_HOME_STATUS_KEY, status)
}
