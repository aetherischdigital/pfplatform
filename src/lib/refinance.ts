/**
 * Refinance comparison math. Pure functions, no React, no I/O.
 *
 * Convention: rates are percentages (e.g. 6.5 for 6.5%), money in dollars.
 *
 * Model assumes the borrower pays closing costs out of pocket (NOT rolled
 * into the new loan principal). That keeps the new loan balance equal to
 * the existing balance and makes the break-even comparison legible. To
 * model rolled-in costs, callers can pass `currentBalance + closingCosts`
 * for the principal — the math works either way.
 */

import { monthlyPaymentForLoan } from './mortgage'

export type RefinanceInput = {
  currentBalance: number
  currentRatePct: number
  currentRemainingMonths: number
  newRatePct: number
  newTermMonths: number
  closingCosts: number
}

export type RefinanceResult = {
  currentMonthly: number
  newMonthly: number
  /** current - new. Positive means lower payment after refi. */
  monthlySavings: number
  currentTotalInterest: number
  newTotalInterest: number
  /** current - new. Positive means less interest paid over the new loan's life. */
  totalInterestDelta: number
  /** totalInterestDelta - closingCosts. Positive means refi pays for itself. */
  netLifetimeSavings: number
  /**
   * Months until cumulative monthly savings recoup the closing costs.
   * - null if monthlySavings ≤ 0 (no monthly savings to recoup with)
   * - Infinity if monthlySavings > 0 but never reaches closingCosts within
   *   the new loan term (vanishingly rare given the math but handled)
   */
  breakEvenMonths: number | null
}

export function compareRefinance(input: RefinanceInput): RefinanceResult {
  const {
    currentBalance,
    currentRatePct,
    currentRemainingMonths,
    newRatePct,
    newTermMonths,
    closingCosts,
  } = input

  const currentMonthly = monthlyPaymentForLoan(
    currentBalance,
    currentRatePct,
    currentRemainingMonths,
  )
  const newMonthly = monthlyPaymentForLoan(currentBalance, newRatePct, newTermMonths)

  const monthlySavings = currentMonthly - newMonthly

  const currentTotalInterest = currentMonthly * currentRemainingMonths - currentBalance
  const newTotalInterest = newMonthly * newTermMonths - currentBalance

  const totalInterestDelta = currentTotalInterest - newTotalInterest
  const netLifetimeSavings = totalInterestDelta - closingCosts

  let breakEvenMonths: number | null
  if (monthlySavings <= 0) {
    breakEvenMonths = null
  } else {
    const m = closingCosts / monthlySavings
    breakEvenMonths = m > newTermMonths ? Infinity : Math.ceil(m)
  }

  return {
    currentMonthly,
    newMonthly,
    monthlySavings,
    currentTotalInterest,
    newTotalInterest,
    totalInterestDelta,
    netLifetimeSavings,
    breakEvenMonths,
  }
}
