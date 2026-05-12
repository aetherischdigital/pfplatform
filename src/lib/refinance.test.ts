import { describe, it, expect } from 'vitest'
import { compareRefinance } from './refinance'

describe('compareRefinance', () => {
  it('lower rate, same term → positive monthly savings and lifetime savings', () => {
    const result = compareRefinance({
      currentBalance: 300_000,
      currentRatePct: 7,
      currentRemainingMonths: 360,
      newRatePct: 5.5,
      newTermMonths: 360,
      closingCosts: 6_000,
    })
    expect(result.monthlySavings).toBeGreaterThan(0)
    expect(result.totalInterestDelta).toBeGreaterThan(0)
    expect(result.netLifetimeSavings).toBeGreaterThan(0)
  })

  it('same rate, longer term → lower monthly but MORE interest', () => {
    const result = compareRefinance({
      currentBalance: 200_000,
      currentRatePct: 6,
      currentRemainingMonths: 180, // 15y left
      newRatePct: 6,
      newTermMonths: 360, // refi to 30y
      closingCosts: 0,
    })
    expect(result.monthlySavings).toBeGreaterThan(0)
    expect(result.totalInterestDelta).toBeLessThan(0)
  })

  it('higher rate → negative monthly savings, breakEven is null', () => {
    const result = compareRefinance({
      currentBalance: 250_000,
      currentRatePct: 4,
      currentRemainingMonths: 300,
      newRatePct: 7,
      newTermMonths: 300,
      closingCosts: 5_000,
    })
    expect(result.monthlySavings).toBeLessThan(0)
    expect(result.breakEvenMonths).toBeNull()
  })

  it('breakEvenMonths = ceil(closingCosts / monthlySavings) when savings are positive', () => {
    const result = compareRefinance({
      currentBalance: 300_000,
      currentRatePct: 7,
      currentRemainingMonths: 360,
      newRatePct: 5.5,
      newTermMonths: 360,
      closingCosts: 6_000,
    })
    const expected = Math.ceil(6_000 / result.monthlySavings)
    expect(result.breakEvenMonths).toBe(expected)
  })

  it('zero closing costs → instant break-even (1 month minimum)', () => {
    const result = compareRefinance({
      currentBalance: 300_000,
      currentRatePct: 7,
      currentRemainingMonths: 360,
      newRatePct: 5.5,
      newTermMonths: 360,
      closingCosts: 0,
    })
    expect(result.breakEvenMonths).toBe(0)
  })

  it('netLifetimeSavings = totalInterestDelta - closingCosts', () => {
    const result = compareRefinance({
      currentBalance: 412_000,
      currentRatePct: 6.875,
      currentRemainingMonths: 336,
      newRatePct: 5.25,
      newTermMonths: 360,
      closingCosts: 8_500,
    })
    expect(result.netLifetimeSavings).toBeCloseTo(
      result.totalInterestDelta - 8_500,
      2,
    )
  })

  it('identical loans → all deltas zero', () => {
    const result = compareRefinance({
      currentBalance: 250_000,
      currentRatePct: 6,
      currentRemainingMonths: 300,
      newRatePct: 6,
      newTermMonths: 300,
      closingCosts: 0,
    })
    expect(result.monthlySavings).toBeCloseTo(0, 5)
    expect(result.totalInterestDelta).toBeCloseTo(0, 2)
    expect(result.netLifetimeSavings).toBeCloseTo(0, 2)
  })
})
