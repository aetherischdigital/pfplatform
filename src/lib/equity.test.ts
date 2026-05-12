import { describe, it, expect } from 'vitest'
import { projectEquity } from './equity'
import { monthlyPaymentForLoan } from './mortgage'

describe('projectEquity', () => {
  it('returns months+1 points (includes month 0)', () => {
    const points = projectEquity({
      startingHomeValue: 400_000,
      startingBalance: 300_000,
      annualAppreciationPct: 3,
      annualRatePct: 6,
      monthlyPayment: monthlyPaymentForLoan(300_000, 6, 360),
      extraPrincipal: 0,
      months: 60,
    })
    expect(points).toHaveLength(61)
    expect(points[0].month).toBe(0)
    expect(points[60].month).toBe(60)
  })

  it('starts with equity = homeValue - balance', () => {
    const points = projectEquity({
      startingHomeValue: 400_000,
      startingBalance: 300_000,
      annualAppreciationPct: 3,
      annualRatePct: 6,
      monthlyPayment: 2000,
      extraPrincipal: 0,
      months: 12,
    })
    expect(points[0].equity).toBeCloseTo(100_000, 2)
  })

  it('home value compounds to the expected annual rate', () => {
    // 6% annual = ((1 + 0.06)^(1/12))^12 should round-trip to exactly 1.06
    const points = projectEquity({
      startingHomeValue: 100_000,
      startingBalance: 0,
      annualAppreciationPct: 6,
      annualRatePct: 0,
      monthlyPayment: 0,
      extraPrincipal: 0,
      months: 12,
    })
    expect(points[12].homeValue).toBeCloseTo(106_000, 0)
  })

  it('with zero appreciation, home value stays flat', () => {
    const points = projectEquity({
      startingHomeValue: 400_000,
      startingBalance: 200_000,
      annualAppreciationPct: 0,
      annualRatePct: 5,
      monthlyPayment: 1500,
      extraPrincipal: 0,
      months: 60,
    })
    for (const p of points) {
      expect(p.homeValue).toBeCloseTo(400_000, 2)
    }
  })

  it('equity grows monotonically when both balance shrinks and value rises', () => {
    const points = projectEquity({
      startingHomeValue: 400_000,
      startingBalance: 300_000,
      annualAppreciationPct: 3,
      annualRatePct: 6,
      monthlyPayment: monthlyPaymentForLoan(300_000, 6, 360),
      extraPrincipal: 0,
      months: 360,
    })
    for (let i = 1; i < points.length; i++) {
      expect(points[i].equity).toBeGreaterThanOrEqual(points[i - 1].equity - 0.01)
    }
  })

  it('reports negative equity for an underwater loan that loses value', () => {
    const points = projectEquity({
      startingHomeValue: 250_000,
      startingBalance: 300_000,
      annualAppreciationPct: -2,
      annualRatePct: 6,
      monthlyPayment: monthlyPaymentForLoan(300_000, 6, 360),
      extraPrincipal: 0,
      months: 24,
    })
    expect(points[0].equity).toBeLessThan(0)
  })

  it('extra principal accelerates equity growth vs. baseline', () => {
    const base = {
      startingHomeValue: 400_000,
      startingBalance: 300_000,
      annualAppreciationPct: 3,
      annualRatePct: 6,
      monthlyPayment: monthlyPaymentForLoan(300_000, 6, 360),
      months: 120,
    }
    const baseline = projectEquity({ ...base, extraPrincipal: 0 })
    const accelerated = projectEquity({ ...base, extraPrincipal: 250 })
    expect(accelerated[120].equity).toBeGreaterThan(baseline[120].equity)
  })

  it('balance never goes negative even if payments overshoot', () => {
    const points = projectEquity({
      startingHomeValue: 400_000,
      startingBalance: 1_000,
      annualAppreciationPct: 3,
      annualRatePct: 6,
      monthlyPayment: 5_000, // wildly overpays
      extraPrincipal: 0,
      months: 12,
    })
    for (const p of points) {
      expect(p.balance).toBeGreaterThanOrEqual(0)
    }
  })
})
