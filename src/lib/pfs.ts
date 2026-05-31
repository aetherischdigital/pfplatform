import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Types — mirror the DB schema in 20260512000000_pfs_records.sql
// + secured/unsecured recategorization (20260522010000_pfs_secured_unsecured.sql)
//
// Thomas's model: Liabilities = SECURED debt (backed by an asset); Expenses =
// UNSECURED debt / obligations (no collateral). Both keep a balance so they
// count against net worth. Household / living spend lives OUTSIDE the PFS in
// the living_expenses table (feeds the cash-flow / discretionary tool).
// ---------------------------------------------------------------------------

export type AssetCategory =
  | 'real_estate'
  | 'retirement'
  | 'investments'
  | 'cash'
  | 'vehicle'
  | 'other'

/** SECURED debt only — backed by an asset the lender can take. The mortgage
 *  itself lives in the `mortgages` table, not here. */
export type LiabilityCategory = 'auto_loan' | 'heloc' | 'other'

/** UNSECURED debt / obligations — no collateral. Shown under "Expenses" per the
 *  methodology, but they keep a balance so they still hit net worth. */
export type ExpenseCategory =
  | 'credit_card'
  | 'student_loan'
  | 'alimony'
  | 'child_support'
  | 'medical_debt'
  | 'personal_loan'
  | 'tax_debt'
  | 'notes_due_others'
  | 'other'

/** Household / living spend — NOT part of the PFS. Feeds the cash-flow tool. */
export type LivingExpenseCategory =
  | 'housing'
  | 'utilities'
  | 'transportation'
  | 'food'
  | 'insurance'
  | 'phone'
  | 'internet_cable'
  | 'healthcare'
  | 'subscriptions'
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
  /** Recurring monthly payment, if known — feeds the cash-flow view. */
  monthlyPayment: number | null
}

export type IncomeSource = {
  id: string
  label: string
  monthly: number
}

/** An unsecured debt / obligation. Carries a balance (counts toward net worth)
 *  plus an optional monthly payment (feeds the cash-flow view). */
export type Expense = {
  id: string
  label: string
  category: ExpenseCategory
  balance: number
  rate?: number
  monthlyPayment: number | null
}

export type LivingExpense = {
  id: string
  label: string
  category: LivingExpenseCategory
  monthlyAmount: number
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
  livingExpenses: LivingExpense[]
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
  auto_loan: 'Auto loan',
  heloc: 'HELOC / second mortgage',
  other: 'Other secured debt',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  credit_card: 'Credit card',
  student_loan: 'Student loan',
  alimony: 'Alimony',
  child_support: 'Child support',
  medical_debt: 'Medical debt',
  personal_loan: 'Personal loan',
  tax_debt: 'Tax debt',
  notes_due_others: 'Notes due to others',
  other: 'Other unsecured debt',
}

export const LIVING_EXPENSE_CATEGORY_LABELS: Record<LivingExpenseCategory, string> = {
  housing: 'Housing (rent / non-mortgage)',
  utilities: 'Utilities',
  transportation: 'Transportation',
  food: 'Food & groceries',
  insurance: 'Insurance',
  phone: 'Phone',
  internet_cable: 'Internet / cable',
  healthcare: 'Healthcare',
  subscriptions: 'Subscriptions',
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
  monthly_payment: string | number | null
  created_at: string
}

type LivingExpenseRow = {
  id: string
  label: string
  category: string
  monthly_amount: string | number
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
const nullableNum = (v: string | number | null): number | null =>
  v === null ? null : typeof v === 'string' ? Number(v) : v

// ---------------------------------------------------------------------------
// Fetch — one round-trip per table, parallel
// ---------------------------------------------------------------------------

export async function fetchPfs(): Promise<Pfs> {
  const [records, mortgage, living] = await Promise.all([
    supabase
      .from('pfs_records')
      .select('id,kind,label,category,amount,rate,monthly_payment,created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('mortgages')
      .select(
        'id,property_label,starting_home_value,balance,rate_pct,term_months_remaining,monthly_payment,extra_principal,created_at',
      )
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('living_expenses')
      .select('id,label,category,monthly_amount,created_at')
      .order('created_at', { ascending: true }),
  ])

  if (records.error) throw records.error
  if (mortgage.error) throw mortgage.error
  if (living.error) throw living.error

  const rows = (records.data ?? []) as PfsRecordRow[]
  const m = mortgage.data as MortgageRow | null

  const assets: Asset[] = []
  const liabilities: Liability[] = []
  const income: IncomeSource[] = []
  const expenses: Expense[] = []

  for (const r of rows) {
    const amount = num(r.amount)
    const rate = r.rate != null ? num(r.rate) : undefined
    const monthlyPayment = nullableNum(r.monthly_payment)
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
          rate,
          monthlyPayment,
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
          balance: amount,
          rate,
          monthlyPayment,
        })
        break
    }
  }

  const livingExpenses: LivingExpense[] = ((living.data ?? []) as LivingExpenseRow[]).map((l) => ({
    id: l.id,
    label: l.label,
    category: l.category as LivingExpenseCategory,
    monthlyAmount: num(l.monthly_amount),
  }))

  return {
    assets,
    liabilities,
    income,
    expenses,
    livingExpenses,
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
  | {
      kind: 'liability'
      label: string
      category: LiabilityCategory
      amount: number
      rate?: number
      monthlyPayment?: number | null
    }
  | { kind: 'income'; label: string; amount: number }
  | {
      kind: 'expense'
      label: string
      category: ExpenseCategory
      amount: number
      rate?: number
      monthlyPayment?: number | null
    }

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Not signed in')
  return data.user.id
}

/** Debts (liability + expense) carry rate + monthly_payment; asset/income don't. */
function recordExtras(input: PfsRecordInput): { rate: number | null; monthly_payment: number | null } {
  if (input.kind === 'liability' || input.kind === 'expense') {
    return { rate: input.rate ?? null, monthly_payment: input.monthlyPayment ?? null }
  }
  return { rate: null, monthly_payment: null }
}

export async function createPfsRecord(input: PfsRecordInput): Promise<void> {
  const user_id = await currentUserId()
  const row = {
    user_id,
    kind: input.kind,
    label: input.label.trim(),
    category: input.kind === 'income' ? null : input.category,
    amount: input.amount,
    ...recordExtras(input),
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
    ...recordExtras(input),
  }
  const { error } = await supabase.from('pfs_records').update(patch).eq('id', id)
  if (error) throw error
}

export async function deletePfsRecord(id: string): Promise<void> {
  const { error } = await supabase.from('pfs_records').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Mutations — living_expenses
// ---------------------------------------------------------------------------

export type LivingExpenseInput = {
  label: string
  category: LivingExpenseCategory
  monthlyAmount: number
}

export async function createLivingExpense(input: LivingExpenseInput): Promise<void> {
  const user_id = await currentUserId()
  const { error } = await supabase.from('living_expenses').insert({
    user_id,
    label: input.label.trim(),
    category: input.category,
    monthly_amount: input.monthlyAmount,
  })
  if (error) throw error
}

export async function updateLivingExpense(id: string, input: LivingExpenseInput): Promise<void> {
  const { error } = await supabase
    .from('living_expenses')
    .update({
      label: input.label.trim(),
      category: input.category,
      monthly_amount: input.monthlyAmount,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteLivingExpense(id: string): Promise<void> {
  const { error } = await supabase.from('living_expenses').delete().eq('id', id)
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
// Cash-flow contribution per debt
//
// Drives both the totals (Discretionary, Left over) and the per-row breakdown
// in the dashboard waterfall. Three states for any debt:
//
//   { amount, estimated: false } — user-entered monthlyPayment, treat as authoritative
//   { amount, estimated: true  } — interest-only floor computed from balance × APR
//                                  (credit cards only; revolving, no fixed amortization)
//   null                         — no resolvable outflow; surface in the UI as a
//                                  "needs monthly payment" row so it's visible as
//                                  a gap rather than silently dropped from cash flow
// ---------------------------------------------------------------------------

export type MonthlyOutflow = { amount: number; estimated: boolean }

export function expenseMonthlyOutflow(e: Expense): MonthlyOutflow | null {
  if (e.monthlyPayment != null && e.monthlyPayment > 0) {
    return { amount: e.monthlyPayment, estimated: false }
  }
  // Credit cards are the only revolving unsecured debt — interest-only is a
  // defensible floor. Installment debts (student loan, personal loan) have a
  // fixed amortizing payment the user knows from their statement; we'd mislead
  // by guessing.
  if (e.category === 'credit_card' && e.rate != null && e.rate > 0 && e.balance > 0) {
    return { amount: (e.balance * e.rate) / 100 / 12, estimated: true }
  }
  return null
}

export function liabilityMonthlyOutflow(l: Liability): MonthlyOutflow | null {
  if (l.monthlyPayment != null && l.monthlyPayment > 0) {
    return { amount: l.monthlyPayment, estimated: false }
  }
  return null
}

// ---------------------------------------------------------------------------
// Derived totals
// ---------------------------------------------------------------------------

export type Totals = {
  totalAssets: number
  /** Secured pfs_records liabilities only — excludes the mortgage. */
  ledgerLiabilities: number
  /** Unsecured debt balances (the "expenses" section). */
  unsecuredDebt: number
  /** ledgerLiabilities + mortgage balance + unsecured debt — true PFS liability total. */
  totalLiabilities: number
  netWorth: number
  homeEquity: number
  monthlyIncome: number
  /** Monthly debt payments: secured + unsecured + mortgage P&I. These are
   *  contractually fixed — Thomas's "fixed expenses" in the waterfall. */
  monthlyDebtPayments: number
  /** Monthly household / living spend. The "coachable" / variable layer. */
  monthlyLivingExpenses: number
  /** Total monthly outflow = debt payments + living expenses. */
  monthlyExpenses: number
  /** Income − fixed debt payments. The "before lifestyle" surplus — the
   *  number Thomas wants the user thinking about before living expenses
   *  eat into it. */
  monthlyDiscretionary: number
  /** Income − all outflow (debts + living). What's truly free to direct
   *  at principal. The bottom line of the cash-flow waterfall. */
  monthlyLeftover: number
}

export function totals(pfs: Pfs): Totals {
  const totalAssets = pfs.assets.reduce((s, a) => s + a.value, 0)
  const monthlyIncome = pfs.income.reduce((s, i) => s + i.monthly, 0)

  // Every debt counts toward net worth, just in different sections: secured ->
  // Liabilities, the mortgage -> the mortgages table, unsecured -> Expenses.
  // The SAME mortgageBalance feeds both net worth and home equity.
  const ledgerLiabilities = pfs.liabilities.reduce((s, l) => s + l.balance, 0)
  const unsecuredDebt = pfs.expenses.reduce((s, e) => s + e.balance, 0)
  const mortgageBalance = pfs.mortgage?.balance ?? 0
  const totalLiabilities = ledgerLiabilities + mortgageBalance + unsecuredDebt

  const homeValue =
    pfs.assets.find((a) => a.category === 'real_estate')?.value ??
    pfs.mortgage?.startingHomeValue ??
    0

  const securedPayments = pfs.liabilities.reduce(
    (s, l) => s + (liabilityMonthlyOutflow(l)?.amount ?? 0),
    0,
  )
  const unsecuredPayments = pfs.expenses.reduce(
    (s, e) => s + (expenseMonthlyOutflow(e)?.amount ?? 0),
    0,
  )
  const mortgagePayment = pfs.mortgage?.monthlyPayment ?? 0
  const monthlyDebtPayments = securedPayments + unsecuredPayments + mortgagePayment
  const monthlyLivingExpenses = pfs.livingExpenses.reduce((s, e) => s + e.monthlyAmount, 0)
  const monthlyExpenses = monthlyDebtPayments + monthlyLivingExpenses

  return {
    totalAssets,
    ledgerLiabilities,
    unsecuredDebt,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    homeEquity: homeValue - mortgageBalance,
    monthlyIncome,
    monthlyDebtPayments,
    monthlyLivingExpenses,
    monthlyExpenses,
    monthlyDiscretionary: monthlyIncome - monthlyDebtPayments,
    monthlyLeftover: monthlyIncome - monthlyExpenses,
  }
}
