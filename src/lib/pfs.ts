import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Types — mirror the DB schema in 20260512000000_pfs_records.sql
// + Phase 2 §3.4 expansion in 20260513000000_pfs_expansion.sql
// ---------------------------------------------------------------------------

export type AssetCategory =
  | 'real_estate'
  | 'retirement'
  | 'investments'
  | 'cash'
  | 'vehicle'
  | 'life_insurance_cash'
  | 'securities_marketable'
  | 'securities_nonmarketable'
  | 'other'

export type LiabilityCategory =
  | 'mortgage'
  | 'auto_loan'
  | 'student_loan'
  | 'credit_card'
  | 'heloc'
  | 'personal_loan'
  | 'tax_debt'
  | 'medical_debt'
  | 'notes_due_others'
  | 'other'

export type IncomeCategory =
  | 'salary'
  | 'dividends'
  | 'rental'
  | 'self_employment'
  | 'pension'
  | 'social_security'
  | 'other'

export type ExpenseCategory =
  | 'housing'
  | 'transportation'
  | 'food'
  | 'taxes'
  | 'insurance'
  | 'healthcare'
  | 'debt_service'
  | 'utilities'
  | 'other'

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
  category: IncomeCategory
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
  // Phase 2 PITI extras (nullable until users opt in).
  propertyTaxAnnual: number | null
  homeownersInsuranceAnnual: number | null
  hoaMonthly: number | null
  // Phase 2 multi-property: schema allows multiple mortgages per user, with
  // exactly one flagged is_primary. The data layer currently exposes only the
  // primary as `Pfs.mortgage` to keep existing dashboard/calculator consumers
  // unchanged; multi-property UI is a Phase 2 §2.2 amendment.
  isPrimary: boolean
}

export type Pfs = {
  assets: Asset[]
  liabilities: Liability[]
  income: IncomeSource[]
  expenses: Expense[]
  /** The user's primary mortgage. Null if no mortgage exists. */
  mortgage: Mortgage | null
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  real_estate: 'Real estate',
  retirement: 'Retirement',
  investments: 'Investments',
  cash: 'Cash',
  vehicle: 'Vehicle',
  life_insurance_cash: 'Life insurance (cash value)',
  securities_marketable: 'Marketable securities',
  securities_nonmarketable: 'Non-marketable securities',
  other: 'Other',
}

export const LIABILITY_CATEGORY_LABELS: Record<LiabilityCategory, string> = {
  mortgage: 'Mortgage',
  auto_loan: 'Auto loan',
  student_loan: 'Student loan',
  credit_card: 'Credit card',
  heloc: 'HELOC / second mortgage',
  personal_loan: 'Personal loan',
  tax_debt: 'Tax debt',
  medical_debt: 'Medical debt',
  notes_due_others: 'Notes due to others',
  other: 'Other',
}

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  salary: 'Salary / bonus / commission',
  dividends: 'Dividends & interest',
  rental: 'Rental income',
  self_employment: 'Self-employment',
  pension: 'Pension',
  social_security: 'Social Security',
  other: 'Other',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing: 'Housing',
  transportation: 'Transportation',
  food: 'Food',
  taxes: 'Taxes',
  insurance: 'Insurance',
  healthcare: 'Healthcare',
  debt_service: 'Debt service',
  utilities: 'Utilities',
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
  property_tax_annual: string | number | null
  homeowners_insurance_annual: string | number | null
  hoa_monthly: string | number | null
  is_primary: boolean
  created_at: string
}

const num = (v: string | number): number => (typeof v === 'string' ? Number(v) : v)
const nullableNum = (v: string | number | null): number | null =>
  v === null ? null : typeof v === 'string' ? Number(v) : v

function toMortgage(m: MortgageRow): Mortgage {
  return {
    id: m.id,
    propertyLabel: m.property_label,
    startingHomeValue: num(m.starting_home_value),
    balance: num(m.balance),
    ratePct: num(m.rate_pct),
    termMonthsRemaining: m.term_months_remaining,
    monthlyPayment: num(m.monthly_payment),
    extraPrincipal: num(m.extra_principal),
    propertyTaxAnnual: nullableNum(m.property_tax_annual),
    homeownersInsuranceAnnual: nullableNum(m.homeowners_insurance_annual),
    hoaMonthly: nullableNum(m.hoa_monthly),
    isPrimary: m.is_primary,
  }
}

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
        'id,property_label,starting_home_value,balance,rate_pct,term_months_remaining,monthly_payment,extra_principal,property_tax_annual,homeowners_insurance_annual,hoa_monthly,is_primary,created_at',
      )
      .eq('is_primary', true)
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
        income.push({
          id: r.id,
          label: r.label,
          // Migration backfills any NULL income.category to 'other', so the
          // cast is safe — the DB constraint guarantees a value.
          category: (r.category ?? 'other') as IncomeCategory,
          monthly: amount,
        })
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
    mortgage: m ? toMortgage(m) : null,
  }
}

// ---------------------------------------------------------------------------
// Mutations — pfs_records
// ---------------------------------------------------------------------------

export type PfsRecordInput =
  | { kind: 'asset'; label: string; category: AssetCategory; amount: number }
  | { kind: 'liability'; label: string; category: LiabilityCategory; amount: number; rate?: number }
  | { kind: 'income'; label: string; category: IncomeCategory; amount: number }
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
    category: input.category,
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
    category: input.category,
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
  propertyTaxAnnual: number | null
  homeownersInsuranceAnnual: number | null
  hoaMonthly: number | null
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
    property_tax_annual: input.propertyTaxAnnual,
    homeowners_insurance_annual: input.homeownersInsuranceAnnual,
    hoa_monthly: input.hoaMonthly,
  }
}

export async function upsertMortgage(input: MortgageInput, id?: string): Promise<void> {
  if (id) {
    const { error } = await supabase.from('mortgages').update(mortgageRow(input)).eq('id', id)
    if (error) throw error
    return
  }
  const user_id = await currentUserId()
  // New mortgages default to is_primary=true at the DB level. The partial
  // unique index enforces one-primary-per-user, so a second insert with
  // is_primary=true would fail — for now (single-property UX) that's the
  // intended guardrail.
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
  totalLiabilities: number
  netWorth: number
  homeEquity: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyCashFlow: number
}

export function totals(pfs: Pfs): Totals {
  const totalAssets = pfs.assets.reduce((s, a) => s + a.value, 0)
  const totalLiabilities = pfs.liabilities.reduce((s, l) => s + l.balance, 0)
  const monthlyIncome = pfs.income.reduce((s, i) => s + i.monthly, 0)
  const monthlyExpenses = pfs.expenses.reduce((s, e) => s + e.monthly, 0)
  const home = pfs.assets.find((a) => a.category === 'real_estate')?.value ?? 0
  const mortgageBalance =
    pfs.mortgage?.balance ?? pfs.liabilities.find((l) => l.category === 'mortgage')?.balance ?? 0
  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    homeEquity: home - mortgageBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow: monthlyIncome - monthlyExpenses,
  }
}

/**
 * Estimated total monthly housing outflow (true PITI). P+I from
 * monthlyPayment, T+I prorated from annual fields, plus HOA. Returns null if
 * we don't have enough data to make the math meaningful (no mortgage at all).
 *
 * Returns just P+I if PITI extras haven't been entered — the cells are NULL
 * until the user fills them in, and we don't want to silently understate by
 * pretending those costs are zero. Caller decides how to render the gap.
 */
export function totalMonthlyHousingOutflow(m: Mortgage | null): {
  total: number
  hasPiti: boolean
} | null {
  if (!m) return null
  const taxes = m.propertyTaxAnnual ?? 0
  const insurance = m.homeownersInsuranceAnnual ?? 0
  const hoa = m.hoaMonthly ?? 0
  const piti = m.propertyTaxAnnual != null || m.homeownersInsuranceAnnual != null || m.hoaMonthly != null
  return {
    total: m.monthlyPayment + taxes / 12 + insurance / 12 + hoa,
    hasPiti: piti,
  }
}
