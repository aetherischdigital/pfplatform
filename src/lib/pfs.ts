import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Types — mirror the DB schema in 20260512000000_pfs_records.sql
// ---------------------------------------------------------------------------

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

export type ExpenseCategory = 'housing' | 'transportation' | 'food' | 'other'

export type PfsRecordKind = 'asset' | 'liability' | 'income' | 'expense'

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
  category: ExpenseCategory
}

export type Mortgage = {
  id: string
  propertyLabel: string
  startingHomeValue: number
  balance: number
  ratePct: number
  termMonthsRemaining: number
  monthlyPayment: number
  extraPrincipal: number
}

export type Pfs = {
  assets: Asset[]
  liabilities: Liability[]
  income: IncomeSource[]
  expenses: Expense[]
  mortgage: Mortgage | null
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

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing: 'Housing',
  transportation: 'Transportation',
  food: 'Food',
  other: 'Other',
}

// ---------------------------------------------------------------------------
// Row shapes returned from supabase
// ---------------------------------------------------------------------------

type PfsRecordRow = {
  id: string
  kind: PfsRecordKind
  label: string
  category: string | null
  amount: string | number
  rate: string | number | null
  created_at: string
}

type MortgageRow = {
  id: string
  property_label: string
  starting_home_value: string | number
  balance: string | number
  rate_pct: string | number
  term_months_remaining: number
  monthly_payment: string | number
  extra_principal: string | number
  created_at: string
}

const num = (v: string | number): number => (typeof v === 'string' ? Number(v) : v)

// ---------------------------------------------------------------------------
// Fetch — one round-trip per table, parallel
// ---------------------------------------------------------------------------

export async function fetchPfs(): Promise<Pfs> {
  const [records, mortgage] = await Promise.all([
    supabase
      .from('pfs_records')
      .select('id,kind,label,category,amount,rate,created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('mortgages')
      .select(
        'id,property_label,starting_home_value,balance,rate_pct,term_months_remaining,monthly_payment,extra_principal,created_at',
      )
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  if (records.error) throw records.error
  if (mortgage.error) throw mortgage.error

  const rows = (records.data ?? []) as PfsRecordRow[]
  const m = mortgage.data as MortgageRow | null

  const assets: Asset[] = []
  const liabilities: Liability[] = []
  const income: IncomeSource[] = []
  const expenses: Expense[] = []

  for (const r of rows) {
    const amount = num(r.amount)
    switch (r.kind) {
      case 'asset':
        assets.push({ id: r.id, label: r.label, category: r.category as AssetCategory, value: amount })
        break
      case 'liability':
        liabilities.push({
          id: r.id,
          label: r.label,
          category: r.category as LiabilityCategory,
          balance: amount,
          rate: r.rate != null ? num(r.rate) : undefined,
        })
        break
      case 'income':
        income.push({ id: r.id, label: r.label, monthly: amount })
        break
      case 'expense':
        expenses.push({
          id: r.id,
          label: r.label,
          category: r.category as ExpenseCategory,
          monthly: amount,
        })
        break
    }
  }

  return {
    assets,
    liabilities,
    income,
    expenses,
    mortgage: m
      ? {
          id: m.id,
          propertyLabel: m.property_label,
          startingHomeValue: num(m.starting_home_value),
          balance: num(m.balance),
          ratePct: num(m.rate_pct),
          termMonthsRemaining: m.term_months_remaining,
          monthlyPayment: num(m.monthly_payment),
          extraPrincipal: num(m.extra_principal),
        }
      : null,
  }
}

// ---------------------------------------------------------------------------
// Mutations — pfs_records
// ---------------------------------------------------------------------------

export type PfsRecordInput =
  | { kind: 'asset'; label: string; category: AssetCategory; amount: number }
  | { kind: 'liability'; label: string; category: LiabilityCategory; amount: number; rate?: number }
  | { kind: 'income'; label: string; amount: number }
  | { kind: 'expense'; label: string; category: ExpenseCategory; amount: number }

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not signed in')
  return data.user.id
}

export async function createPfsRecord(input: PfsRecordInput): Promise<void> {
  const user_id = await currentUserId()
  const row = {
    user_id,
    kind: input.kind,
    label: input.label.trim(),
    category: input.kind === 'income' ? null : input.category,
    amount: input.amount,
    rate: input.kind === 'liability' ? input.rate ?? null : null,
  }
  const { error } = await supabase.from('pfs_records').insert(row)
  if (error) throw error
}

export async function updatePfsRecord(id: string, input: PfsRecordInput): Promise<void> {
  const patch = {
    kind: input.kind,
    label: input.label.trim(),
    category: input.kind === 'income' ? null : input.category,
    amount: input.amount,
    rate: input.kind === 'liability' ? input.rate ?? null : null,
  }
  const { error } = await supabase.from('pfs_records').update(patch).eq('id', id)
  if (error) throw error
}

export async function deletePfsRecord(id: string): Promise<void> {
  const { error } = await supabase.from('pfs_records').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Mutations — mortgages
// ---------------------------------------------------------------------------

export type MortgageInput = {
  propertyLabel: string
  startingHomeValue: number
  balance: number
  ratePct: number
  termMonthsRemaining: number
  monthlyPayment: number
  extraPrincipal: number
}

function mortgageRow(input: MortgageInput) {
  return {
    property_label: input.propertyLabel.trim(),
    starting_home_value: input.startingHomeValue,
    balance: input.balance,
    rate_pct: input.ratePct,
    term_months_remaining: input.termMonthsRemaining,
    monthly_payment: input.monthlyPayment,
    extra_principal: input.extraPrincipal,
  }
}

export async function upsertMortgage(input: MortgageInput, id?: string): Promise<void> {
  if (id) {
    const { error } = await supabase.from('mortgages').update(mortgageRow(input)).eq('id', id)
    if (error) throw error
    return
  }
  const user_id = await currentUserId()
  const { error } = await supabase.from('mortgages').insert({ user_id, ...mortgageRow(input) })
  if (error) throw error
}

export async function deleteMortgage(id: string): Promise<void> {
  const { error } = await supabase.from('mortgages').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Derived totals
// ---------------------------------------------------------------------------

export type Totals = {
  totalAssets: number
  /** pfs_records liabilities only — excludes the mortgage. */
  ledgerLiabilities: number
  /** ledgerLiabilities + the mortgage balance — the true PFS liability total. */
  totalLiabilities: number
  netWorth: number
  homeEquity: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyCashFlow: number
}

export function totals(pfs: Pfs): Totals {
  const totalAssets = pfs.assets.reduce((s, a) => s + a.value, 0)
  const monthlyIncome = pfs.income.reduce((s, i) => s + i.monthly, 0)
  const monthlyExpenses = pfs.expenses.reduce((s, e) => s + e.monthly, 0)

  // The mortgage is represented exactly once, by the dedicated `mortgages`
  // table — the liability form deliberately omits the "mortgage" category so
  // the loan is never also entered as a pfs_records row. Summing the ledger
  // liabilities and adding the mortgage balance therefore counts the debt once,
  // and the SAME `mortgageBalance` feeds both net worth and home equity, so the
  // two figures can never contradict each other on the dashboard.
  const ledgerLiabilities = pfs.liabilities.reduce((s, l) => s + l.balance, 0)
  const mortgageBalance = pfs.mortgage?.balance ?? 0
  const totalLiabilities = ledgerLiabilities + mortgageBalance

  // Current home value: the real-estate asset the user entered, falling back to
  // the mortgage's starting home value when no real-estate asset exists yet.
  const homeValue =
    pfs.assets.find((a) => a.category === 'real_estate')?.value ??
    pfs.mortgage?.startingHomeValue ??
    0

  return {
    totalAssets,
    ledgerLiabilities,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    homeEquity: homeValue - mortgageBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow: monthlyIncome - monthlyExpenses,
  }
}
