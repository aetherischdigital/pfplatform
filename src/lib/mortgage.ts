/**
 * Mortgage payoff math. Pure functions, no React, no I/O — safe to reuse
 * in the calculator page now and the authenticated dashboard later.
 *
 * Convention: rates are percentages (e.g. 6.5 for 6.5%), not decimals.
 * Money is in dollars (not cents) — float math is fine for display purposes.
 */

export type SimulationPoint = {
  /** Months elapsed from start (0 = today) */
  month: number
  /** Remaining principal balance at the end of this month */
  balance: number
  /** Cumulative interest paid through this month */
  cumulativeInterest: number
}

export type Simulation = {
  /** Total months until payoff. Infinity if the payment doesn't cover interest. */
  months: number
  /** Total interest paid over the life of the loan */
  totalInterest: number
  /** Month-by-month balance + cumulative interest, starting at month 0 */
  history: SimulationPoint[]
}

export type ComparisonResult = {
  baseline: Simulation
  scenario: Simulation
  monthsSaved: number
  interestSaved: number
}

/** Standard amortization formula: monthly payment for a loan paid off in `termMonths`. */
export function monthlyPaymentForLoan(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): number {
  if (principal <= 0 || termMonths <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / termMonths
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

/**
 * Run the loan forward month-by-month until paid off.
 * `monthlyPayment` is the scheduled minimum (P&I); `extraPrincipal` is added on top.
 * Capped at 600 months (50y) to avoid runaway loops on degenerate inputs.
 */
export function simulate(
  startingBalance: number,
  annualRatePct: number,
  monthlyPayment: number,
  extraPrincipal: number = 0,
): Simulation {
  const r = annualRatePct / 100 / 12
  let balance = startingBalance
  let cumulativeInterest = 0
  let month = 0
  const history: SimulationPoint[] = [
    { month: 0, balance, cumulativeInterest: 0 },
  ]

  while (balance > 0.01 && month < 600) {
    const interest = balance * r
    const principalPayment = monthlyPayment + extraPrincipal - interest

    if (principalPayment <= 0) {
      // Payment doesn't even cover the interest — loan never amortizes.
      return { months: Infinity, totalInterest: Infinity, history }
    }

    const principalApplied = Math.min(principalPayment, balance)
    balance -= principalApplied
    cumulativeInterest += interest
    month++
    history.push({ month, balance: Math.max(0, balance), cumulativeInterest })
  }

  // If we exited via the 50-year cap with balance remaining, the loan would
  // still be amortizing past our horizon. Don't pretend it paid off at month
  // 600 — return Infinity so callers render "—" instead of a misleading date.
  if (balance > 0.01) {
    return { months: Infinity, totalInterest: Infinity, history }
  }

  return { months: month, totalInterest: cumulativeInterest, history }
}

/**
 * Compare a scenario (with extra principal) against a baseline (without).
 * Both runs use the same scheduled monthly payment.
 */
export function compareScenarios(
  startingBalance: number,
  annualRatePct: number,
  monthlyPayment: number,
  extraPrincipal: number,
): ComparisonResult {
  const baseline = simulate(startingBalance, annualRatePct, monthlyPayment, 0)
  const scenario = simulate(startingBalance, annualRatePct, monthlyPayment, extraPrincipal)
  return {
    baseline,
    scenario,
    monthsSaved: baseline.months - scenario.months,
    interestSaved: baseline.totalInterest - scenario.totalInterest,
  }
}

export type AmortizationRow = {
  /** 1-indexed month number (1 = first payment) */
  month: number
  /** Scheduled P&I payment for this month */
  payment: number
  /** Portion of the payment applied to principal */
  principal: number
  /** Portion of the payment that paid interest */
  interest: number
  /** Remaining balance after this month's payment */
  balance: number
}

/**
 * Full amortization schedule for a loan paid on its scheduled monthly P&I
 * with no extra principal. Returns one row per month until the balance is
 * fully retired (or the 50-year cap, in which case the schedule is
 * truncated and the final row's balance is non-zero — callers should
 * surface this honestly rather than pretend it amortized).
 *
 * For "what if I add extra" scenarios, use `simulate()` instead — it
 * returns the same shape of history but accepts `extraPrincipal`.
 */
export function amortizationSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): AmortizationRow[] {
  if (principal <= 0 || termMonths <= 0) return []
  const payment = monthlyPaymentForLoan(principal, annualRatePct, termMonths)
  const r = annualRatePct / 100 / 12
  const rows: AmortizationRow[] = []
  let balance = principal

  for (let m = 1; m <= termMonths && balance > 0.01; m++) {
    const interest = balance * r
    let principalPaid = payment - interest
    // Last row often has a tiny overpay due to float rounding — clamp it.
    if (principalPaid > balance) principalPaid = balance
    balance -= principalPaid
    rows.push({
      month: m,
      payment: principalPaid + interest,
      principal: principalPaid,
      interest,
      balance: Math.max(0, balance),
    })
  }
  return rows
}

/** Pretty-print a month count as "Xy Ym" (or "Ym" / "Xy"). */
export function formatYearsMonths(totalMonths: number): string {
  if (!Number.isFinite(totalMonths)) return '—'
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  if (y === 0) return `${m}mo`
  if (m === 0) return `${y}y`
  return `${y}y ${m}mo`
}

/** Add `monthsAhead` months to today and return as e.g. "April 2032". */
export function payoffDate(monthsAhead: number, from: Date = new Date()): string {
  if (!Number.isFinite(monthsAhead)) return '—'
  const d = new Date(from.getFullYear(), from.getMonth() + monthsAhead, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Currency, no cents. */
export function formatUSD(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}
