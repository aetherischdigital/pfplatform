/**
 * Project home value, mortgage balance, and equity month-by-month.
 * Pure function — same shape will eventually drive the dashboard's chart
 * from real Supabase data.
 */
export type EquityPoint = {
  month: number
  homeValue: number
  balance: number
  equity: number
}

export type EquityProjectionInput = {
  startingHomeValue: number
  startingBalance: number
  /** Annual home appreciation (%); 3 is a reasonable default */
  annualAppreciationPct: number
  annualRatePct: number
  monthlyPayment: number
  extraPrincipal: number
  /** How many months to project */
  months: number
}

export function projectEquity(input: EquityProjectionInput): EquityPoint[] {
  const {
    startingHomeValue,
    startingBalance,
    annualAppreciationPct,
    annualRatePct,
    monthlyPayment,
    extraPrincipal,
    months,
  } = input

  const homeMonthlyGrowth = Math.pow(1 + annualAppreciationPct / 100, 1 / 12) - 1
  const loanMonthlyRate = annualRatePct / 100 / 12

  let homeValue = startingHomeValue
  let balance = startingBalance

  const points: EquityPoint[] = [
    { month: 0, homeValue, balance, equity: homeValue - balance },
  ]

  for (let m = 1; m <= months; m++) {
    homeValue *= 1 + homeMonthlyGrowth

    if (balance > 0.01) {
      const interest = balance * loanMonthlyRate
      const principalPayment = monthlyPayment + extraPrincipal - interest
      if (principalPayment > 0) {
        balance = Math.max(0, balance - principalPayment)
      }
    }

    points.push({ month: m, homeValue, balance, equity: homeValue - balance })
  }

  return points
}
