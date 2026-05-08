/**
 * Sample financial data for the authenticated dashboard mock.
 * When Supabase + the real PFS data model land, this file is replaced by
 * actual queries — every component already reads from these typed shapes.
 */

export type AssetCategory =
  | 'real_estate'
  | 'retirement'
  | 'investments'
  | 'cash'
  | 'vehicle'
  | 'other'

export type LiabilityCategory =
  | 'mortgage'
  | 'auto_loan'
  | 'student_loan'
  | 'credit_card'
  | 'other'

export type Asset = {
  id: string
  label: string
  category: AssetCategory
  value: number
}

export type Liability = {
  id: string
  label: string
  category: LiabilityCategory
  balance: number
  rate?: number
}

export type IncomeSource = {
  id: string
  label: string
  monthly: number
}

export type Expense = {
  id: string
  label: string
  monthly: number
  category: 'housing' | 'transportation' | 'food' | 'other'
}

export type MockMortgage = {
  id: string
  propertyLabel: string
  startingHomeValue: number
  balance: number
  ratePct: number
  termMonthsRemaining: number
  monthlyPayment: number
  extraPrincipal: number
}

export type Profile = {
  name: string
  email: string
  role: 'homeowner' | 'realtor' | 'admin'
}

export const MOCK_PROFILE: Profile = {
  name: 'Casey Homeowner',
  email: 'casey@example.com',
  role: 'homeowner',
}

export const MOCK_ASSETS: Asset[] = [
  { id: 'a1', label: 'Primary residence', category: 'real_estate', value: 485_000 },
  { id: 'a2', label: 'Retirement (401k)', category: 'retirement', value: 142_800 },
  { id: 'a3', label: 'Brokerage account', category: 'investments', value: 38_400 },
  { id: 'a4', label: 'Cash + checking', category: 'cash', value: 28_400 },
  { id: 'a5', label: 'Toyota RAV4', category: 'vehicle', value: 22_000 },
]

export const MOCK_LIABILITIES: Liability[] = [
  { id: 'l1', label: 'Primary mortgage', category: 'mortgage', balance: 312_500, rate: 6.5 },
  { id: 'l2', label: 'Auto loan', category: 'auto_loan', balance: 18_200, rate: 5.9 },
  { id: 'l3', label: 'Credit card', category: 'credit_card', balance: 2_400, rate: 22.4 },
]

export const MOCK_INCOME: IncomeSource[] = [
  { id: 'i1', label: 'Salary', monthly: 8_500 },
  { id: 'i2', label: 'Freelance', monthly: 1_200 },
]

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', label: 'Mortgage P&I', monthly: 2_017, category: 'housing' },
  { id: 'e2', label: 'Property tax + insurance', monthly: 480, category: 'housing' },
  { id: 'e3', label: 'Utilities', monthly: 240, category: 'housing' },
  { id: 'e4', label: 'Auto + gas', monthly: 520, category: 'transportation' },
  { id: 'e5', label: 'Groceries', monthly: 850, category: 'food' },
  { id: 'e6', label: 'Subscriptions', monthly: 120, category: 'other' },
]

export const MOCK_MORTGAGE: MockMortgage = {
  id: 'm1',
  propertyLabel: 'Primary residence',
  startingHomeValue: 485_000,
  balance: 312_500,
  ratePct: 6.5,
  termMonthsRemaining: 28 * 12,
  monthlyPayment: 2_017,
  extraPrincipal: 200,
}

export type Totals = {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  homeEquity: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyCashFlow: number
}

export function totals(): Totals {
  const totalAssets = MOCK_ASSETS.reduce((s, a) => s + a.value, 0)
  const totalLiabilities = MOCK_LIABILITIES.reduce((s, l) => s + l.balance, 0)
  const monthlyIncome = MOCK_INCOME.reduce((s, i) => s + i.monthly, 0)
  const monthlyExpenses = MOCK_EXPENSES.reduce((s, e) => s + e.monthly, 0)
  const home = MOCK_ASSETS.find((a) => a.category === 'real_estate')?.value ?? 0
  const mortgage = MOCK_LIABILITIES.find((l) => l.category === 'mortgage')?.balance ?? 0
  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    homeEquity: home - mortgage,
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow: monthlyIncome - monthlyExpenses,
  }
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  real_estate: 'Real estate',
  retirement: 'Retirement',
  investments: 'Investments',
  cash: 'Cash',
  vehicle: 'Vehicle',
  other: 'Other',
}

export const LIABILITY_CATEGORY_LABELS: Record<LiabilityCategory, string> = {
  mortgage: 'Mortgage',
  auto_loan: 'Auto loan',
  student_loan: 'Student loan',
  credit_card: 'Credit card',
  other: 'Other',
}
