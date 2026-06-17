import { describe, it, expect } from 'vitest'
import {
  amortizationSchedule,
  monthlyPaymentForLoan,
  simulate,
  simulateScenario,
} from './mortgage'

describe('monthlyPaymentForLoan', () => {
  it('returns principal/term when rate is zero', () => {
    expect(monthlyPaymentForLoan(120_000, 0, 120)).toBeCloseTo(1_000, 5)
  })

  it('matches the textbook formula for a 30-year 6% loan', () => {
    // 300_000 @ 6% / 30y → ~1798.65 (Bankrate, etc.)
    expect(monthlyPaymentForLoan(300_000, 6, 360)).toBeCloseTo(1798.65, 1)
  })

  it('returns 0 for degenerate inputs', () => {
    expect(monthlyPaymentForLoan(0, 5, 360)).toBe(0)
    expect(monthlyPaymentForLoan(100_000, 5, 0)).toBe(0)
  })
})

describe('amortizationSchedule', () => {
  it('produces exactly termMonths rows for a normal loan', () => {
    const rows = amortizationSchedule(300_000, 6, 360)
    expect(rows).toHaveLength(360)
  })

  it('retires the balance to zero at the final row', () => {
    const rows = amortizationSchedule(250_000, 5.5, 360)
    expect(rows[rows.length - 1].balance).toBeCloseTo(0, 2)
  })

  it('row payments are always interest + principal', () => {
    const rows = amortizationSchedule(200_000, 7, 360)
    for (const r of rows) {
      expect(r.payment).toBeCloseTo(r.principal + r.interest, 5)
    }
  })

  it('interest portion shrinks over time, principal grows', () => {
    const rows = amortizationSchedule(300_000, 6, 360)
    expect(rows[0].interest).toBeGreaterThan(rows[359].interest)
    expect(rows[0].principal).toBeLessThan(rows[359].principal)
  })

  it('returns empty for zero/negative inputs', () => {
    expect(amortizationSchedule(0, 5, 360)).toEqual([])
    expect(amortizationSchedule(100_000, 5, 0)).toEqual([])
  })

  it('handles zero-interest loans cleanly', () => {
    const rows = amortizationSchedule(12_000, 0, 12)
    expect(rows).toHaveLength(12)
    expect(rows[0].interest).toBe(0)
    expect(rows[0].principal).toBeCloseTo(1_000, 5)
    expect(rows[11].balance).toBeCloseTo(0, 5)
  })

  it('schedule sum of interest matches simulate() with no extra principal', () => {
    const balance = 412_000
    const ratePct = 6.875
    const termMonths = 360
    const payment = monthlyPaymentForLoan(balance, ratePct, termMonths)
    const rows = amortizationSchedule(balance, ratePct, termMonths)
    const totalFromSchedule = rows.reduce((acc, r) => acc + r.interest, 0)
    const fromSimulate = simulate(balance, ratePct, payment, 0).totalInterest
    expect(totalFromSchedule).toBeCloseTo(fromSimulate, 1)
  })
})

describe('simulateScenario', () => {
  const balance = 300_000
  const ratePct = 6
  const payment = monthlyPaymentForLoan(balance, ratePct, 360)

  it('matches simulate() exactly when no extras are passed', () => {
    const a = simulate(balance, ratePct, payment, 0)
    const b = simulateScenario({ startingBalance: balance, annualRatePct: ratePct, monthlyPayment: payment })
    expect(b.months).toBe(a.months)
    expect(b.totalInterest).toBeCloseTo(a.totalInterest, 2)
  })

  it('matches simulate(..., extra) when only extraPrincipal is passed', () => {
    const a = simulate(balance, ratePct, payment, 250)
    const b = simulateScenario({
      startingBalance: balance,
      annualRatePct: ratePct,
      monthlyPayment: payment,
      extraPrincipal: 250,
    })
    expect(b.months).toBe(a.months)
    expect(b.totalInterest).toBeCloseTo(a.totalInterest, 2)
  })

  it('biweekly (extra = payment/12) shortens the loan and reduces interest vs. baseline', () => {
    const baseline = simulateScenario({ startingBalance: balance, annualRatePct: ratePct, monthlyPayment: payment })
    const biweekly = simulateScenario({
      startingBalance: balance,
      annualRatePct: ratePct,
      monthlyPayment: payment,
      extraPrincipal: payment / 12,
    })
    expect(biweekly.months).toBeLessThan(baseline.months)
    expect(biweekly.totalInterest).toBeLessThan(baseline.totalInterest)
  })

  it('lump sum at month 1 saves more interest than the same amount at month 240', () => {
    const early = simulateScenario({
      startingBalance: balance,
      annualRatePct: ratePct,
      monthlyPayment: payment,
      lumpSum: { month: 1, amount: 10_000 },
    })
    const late = simulateScenario({
      startingBalance: balance,
      annualRatePct: ratePct,
      monthlyPayment: payment,
      lumpSum: { month: 240, amount: 10_000 },
    })
    expect(early.totalInterest).toBeLessThan(late.totalInterest)
  })

  it('a lump sum equal to the balance pays the loan off the same month', () => {
    const result = simulateScenario({
      startingBalance: balance,
      annualRatePct: ratePct,
      monthlyPayment: payment,
      lumpSum: { month: 1, amount: 1_000_000 },
    })
    expect(result.months).toBe(1)
  })

  it('lump sum past the natural payoff month is a no-op', () => {
    const noLump = simulateScenario({
      startingBalance: balance,
      annualRatePct: ratePct,
      monthlyPayment: payment,
    })
    const lateLump = simulateScenario({
      startingBalance: balance,
      annualRatePct: ratePct,
      monthlyPayment: payment,
      lumpSum: { month: 500, amount: 50_000 },
    })
    expect(lateLump.months).toBe(noLump.months)
    expect(lateLump.totalInterest).toBeCloseTo(noLump.totalInterest, 2)
  })

  it('returns Infinity when payment does not cover interest', () => {
    const result = simulateScenario({
      startingBalance: 300_000,
      annualRatePct: 6,
      monthlyPayment: 100, // way too low
    })
    expect(result.months).toBe(Infinity)
  })
})
