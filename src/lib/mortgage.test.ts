import { describe, it, expect } from 'vitest'
import {
  amortizationSchedule,
  monthlyPaymentForLoan,
  simulate,
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
