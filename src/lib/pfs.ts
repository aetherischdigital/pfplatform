import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Types — mirror the DB schema in 20260512000000_pfs_records.sql
// + Phase 2 §3.4 expansion (20260513000000_pfs_expansion.sql)
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
  | 'life_insurance_cash'
  | 'securities_marketable'
  | 'securities_nonmarketable'
  | 'other'

/** SECURED debt only — backed by an asset the lender can take. The mortgage
 *  itself lives in the `mortgages` table, not here. */
export type LiabilityCategory = 'auto_loan' | 'heloc' | 'other'

export type IncomeCategory =
  | 'salary'
  | 'dividends'
  | 'rental'
  | 'self_employment'
  | 'pension'
  | 'social_security'
  | 'other'

/** UNSECURED debt / obligations — no collateral. Shown under "Expenses" per
 *  the methodology, but they keep a balance so they still hit net worth. */
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
  category: IncomeCategory
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

// A property's loan, as a denormalized READ VIEW: the loan-specific fields
// (balance, rate, term, P+I, extra, PMI) merged with the parent property's
// fields (label, value, taxes, insurance, HOA, type) at load time. This keeps
// the existing dashboard / calculator / equity / totals code — which has always
// treated "the mortgage" as the whole property picture — working unchanged.
//
// The DB stores loan fields on `mortgages` and property fields on `properties`
// (see 20260616120000_properties_parent.sql). WRITES go through
// createProperty/updateProperty for the home and upsertMortgage for the loan —
// never by mutating a Mortgage object directly.
export type Mortgage = {
  /** Loan row id (mortgages.id). */
  id: string
  /** Parent property this loan is secured by. */
  propertyId: string
  propertyLabel: string
  startingHomeValue: number
  balance: number
  ratePct: number
  termMonthsRemaining: number
  /** Date the first scheduled payment is/was due. Null until entered. Anchors
   *  the numbered amortization schedule to real calendar dates. */
  firstPaymentDate: string | null
  monthlyPayment: number
  extraPrincipal: number
  // PITI extras — sourced from the parent property (nullable until opted in).
  propertyTaxAnnual: number | null
  homeownersInsuranceAnnual: number | null
  floodInsuranceAnnual: number | null
  /** Monthly PMI (conventional) / MIP (FHA) premium — a loan attribute. */
  pmiMipMonthly: number | null
  hoaMonthly: number | null
  /** True when the parent property is the user's primary residence. */
  isPrimary: boolean
  // Schedule C extras — sourced from the parent property.
  dateAcquired: string | null
  originalCost: number | null
  pctOwnership: number
}

export type PropertyType = 'primary' | 'vacation' | 'rental' | 'other'

/** A real-estate holding — the source of truth for address, value, and carrying
 *  costs. Its loan (if any) is nested as `mortgage`; a paid-off home has none. */
export type Property = {
  id: string
  label: string
  propertyType: PropertyType
  address: string | null
  marketValue: number
  propertyTaxAnnual: number | null
  homeownersInsuranceAnnual: number | null
  floodInsuranceAnnual: number | null
  hoaMonthly: number | null
  /** Gross monthly rent collected — meaningful when propertyType === 'rental'. */
  monthlyRent: number | null
  dateAcquired: string | null
  originalCost: number | null
  pctOwnership: number
  /** The loan secured by this property, if any. Null for a paid-off home. */
  mortgage: Mortgage | null
}

export type Pfs = {
  assets: Asset[]
  liabilities: Liability[]
  income: IncomeSource[]
  expenses: Expense[]
  livingExpenses: LivingExpense[]
  /** All real-estate holdings, each with its optional loan nested. Sorted
   *  oldest first. Includes paid-off homes (no loan). */
  properties: Property[]
  /** The primary residence, if one is flagged. */
  primaryProperty: Property | null
  /** The primary residence's loan. Null if none. (Back-compat convenience.) */
  mortgage: Mortgage | null
  /** Every property loan, flattened. Excludes paid-off homes. Sorted oldest first. */
  mortgages: Mortgage[]
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
  auto_loan: 'Auto loan',
  heloc: 'HELOC / second mortgage',
  other: 'Other secured debt',
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

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  primary: 'Primary home',
  vacation: 'Vacation home',
  rental: 'Rental property',
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

// A mortgages row — loan fields only (the property columns moved to properties
// in 20260616120000_properties_parent.sql).
type LoanRow = {
  id: string
  property_id: string
  balance: string | number
  rate_pct: string | number
  term_months_remaining: number
  first_payment_date: string | null
  monthly_payment: string | number
  extra_principal: string | number
  pmi_mip_monthly: string | number | null
}

// A properties row with its loan embedded via the reverse FK. PostgREST returns
// the embed as a single object (the property_id unique index makes it to-one)
// or, defensively, a one-element array — normalized in toProperty.
type PropertyRow = {
  id: string
  label: string
  property_type: PropertyType
  address: string | null
  market_value: string | number
  property_tax_annual: string | number | null
  homeowners_insurance_annual: string | number | null
  flood_insurance_annual: string | number | null
  hoa_monthly: string | number | null
  monthly_rent: string | number | null
  date_acquired: string | null
  original_cost: string | number | null
  pct_ownership: string | number
  created_at: string
  mortgages: LoanRow | LoanRow[] | null
}

const num = (v: string | number): number => (typeof v === 'string' ? Number(v) : v)
const nullableNum = (v: string | number | null): number | null =>
  v === null ? null : typeof v === 'string' ? Number(v) : v

function toProperty(p: PropertyRow): Property {
  const propertyTaxAnnual = nullableNum(p.property_tax_annual)
  const homeownersInsuranceAnnual = nullableNum(p.homeowners_insurance_annual)
  const floodInsuranceAnnual = nullableNum(p.flood_insurance_annual)
  const hoaMonthly = nullableNum(p.hoa_monthly)
  const marketValue = num(p.market_value)
  const dateAcquired = p.date_acquired
  const originalCost = nullableNum(p.original_cost)
  const pctOwnership = num(p.pct_ownership)
  const isPrimary = p.property_type === 'primary'

  // Normalize the embedded loan (object, one-element array, or null) to a row.
  const loan: LoanRow | null = Array.isArray(p.mortgages)
    ? (p.mortgages[0] ?? null)
    : p.mortgages

  const mortgage: Mortgage | null = loan
    ? {
        id: loan.id,
        propertyId: p.id,
        propertyLabel: p.label,
        startingHomeValue: marketValue,
        balance: num(loan.balance),
        ratePct: num(loan.rate_pct),
        termMonthsRemaining: loan.term_months_remaining,
        firstPaymentDate: loan.first_payment_date,
        monthlyPayment: num(loan.monthly_payment),
        extraPrincipal: num(loan.extra_principal),
        propertyTaxAnnual,
        homeownersInsuranceAnnual,
        floodInsuranceAnnual,
        pmiMipMonthly: nullableNum(loan.pmi_mip_monthly),
        hoaMonthly,
        isPrimary,
        dateAcquired,
        originalCost,
        pctOwnership,
      }
    : null

  return {
    id: p.id,
    label: p.label,
    propertyType: p.property_type,
    address: p.address,
    marketValue,
    propertyTaxAnnual,
    homeownersInsuranceAnnual,
    floodInsuranceAnnual,
    hoaMonthly,
    monthlyRent: nullableNum(p.monthly_rent),
    dateAcquired,
    originalCost,
    pctOwnership,
    mortgage,
  }
}

// ---------------------------------------------------------------------------
// Fetch — one round-trip per table, parallel
// ---------------------------------------------------------------------------

export async function fetchPfs(): Promise<Pfs> {
  const [records, propertyList, living] = await Promise.all([
    supabase
      .from('pfs_records')
      .select('id,kind,label,category,amount,rate,monthly_payment,created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('properties')
      .select(
        'id,label,property_type,address,market_value,property_tax_annual,homeowners_insurance_annual,flood_insurance_annual,hoa_monthly,monthly_rent,date_acquired,original_cost,pct_ownership,created_at,mortgages(id,property_id,balance,rate_pct,term_months_remaining,first_payment_date,monthly_payment,extra_principal,pmi_mip_monthly)',
      )
      .order('created_at', { ascending: true }),
    supabase
      .from('living_expenses')
      .select('id,label,category,monthly_amount,created_at')
      .order('created_at', { ascending: true }),
  ])

  if (records.error) throw records.error
  if (propertyList.error) throw propertyList.error
  if (living.error) throw living.error

  const rows = (records.data ?? []) as PfsRecordRow[]
  const properties = ((propertyList.data ?? []) as PropertyRow[]).map(toProperty)
  const primaryProperty = properties.find((p) => p.propertyType === 'primary') ?? null
  const mortgages = properties
    .map((p) => p.mortgage)
    .filter((m): m is Mortgage => m !== null)
  const primary = primaryProperty?.mortgage ?? null

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
    properties,
    primaryProperty,
    mortgage: primary,
    mortgages,
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
  | { kind: 'income'; label: string; category: IncomeCategory; amount: number }
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
    category: input.category,
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
    category: input.category,
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
// Mutations — properties (the home: address, type, value, carrying costs)
// ---------------------------------------------------------------------------

export type PropertyInput = {
  label: string
  propertyType: PropertyType
  address: string | null
  marketValue: number
  propertyTaxAnnual: number | null
  homeownersInsuranceAnnual: number | null
  floodInsuranceAnnual: number | null
  hoaMonthly: number | null
  monthlyRent: number | null
  dateAcquired: string | null
  originalCost: number | null
  pctOwnership: number
}

function propertyRow(input: PropertyInput) {
  return {
    label: input.label.trim(),
    property_type: input.propertyType,
    address: input.address?.trim() || null,
    market_value: input.marketValue,
    property_tax_annual: input.propertyTaxAnnual,
    homeowners_insurance_annual: input.homeownersInsuranceAnnual,
    flood_insurance_annual: input.floodInsuranceAnnual,
    hoa_monthly: input.hoaMonthly,
    monthly_rent: input.monthlyRent,
    date_acquired: input.dateAcquired,
    original_cost: input.originalCost,
    pct_ownership: input.pctOwnership,
  }
}

export async function createProperty(input: PropertyInput): Promise<string> {
  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from('properties')
    .insert({ user_id, ...propertyRow(input) })
    .select('id')
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

export async function updateProperty(id: string, input: PropertyInput): Promise<void> {
  const { error } = await supabase.from('properties').update(propertyRow(input)).eq('id', id)
  if (error) throw error
}

export async function deleteProperty(id: string): Promise<void> {
  // The loan row (if any) cascades via the property_id FK on delete.
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
}

/**
 * Make a property the user's primary residence, demoting whichever property is
 * currently primary to 'other' first so the one-primary-per-user partial unique
 * index is never violated mid-update.
 */
export async function setPrimaryProperty(id: string): Promise<void> {
  const user_id = await currentUserId()
  const demote = await supabase
    .from('properties')
    .update({ property_type: 'other' })
    .eq('user_id', user_id)
    .eq('property_type', 'primary')
    .neq('id', id)
  if (demote.error) throw demote.error
  const promote = await supabase
    .from('properties')
    .update({ property_type: 'primary' })
    .eq('id', id)
  if (promote.error) throw promote.error
}

// ---------------------------------------------------------------------------
// Mutations — mortgages (the loan secured by a property)
// ---------------------------------------------------------------------------

export type LoanInput = {
  balance: number
  ratePct: number
  termMonthsRemaining: number
  firstPaymentDate: string | null
  monthlyPayment: number
  extraPrincipal: number
  pmiMipMonthly: number | null
}

function loanRow(input: LoanInput) {
  return {
    balance: input.balance,
    rate_pct: input.ratePct,
    term_months_remaining: input.termMonthsRemaining,
    first_payment_date: input.firstPaymentDate,
    monthly_payment: input.monthlyPayment,
    extra_principal: input.extraPrincipal,
    pmi_mip_monthly: input.pmiMipMonthly,
  }
}

/** Create or update the loan secured by a property. `id` is the mortgage row id
 *  when editing an existing loan; omit it to attach a new loan to propertyId. */
export async function upsertMortgage(
  propertyId: string,
  input: LoanInput,
  id?: string,
): Promise<void> {
  if (id) {
    const { error } = await supabase.from('mortgages').update(loanRow(input)).eq('id', id)
    if (error) throw error
    return
  }
  const user_id = await currentUserId()
  const { error } = await supabase
    .from('mortgages')
    .insert({ user_id, property_id: propertyId, ...loanRow(input) })
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
  /** ledgerLiabilities + mortgage balance + unsecured debt — the true PFS liability total. */
  totalLiabilities: number
  netWorth: number
  homeEquity: number
  monthlyIncome: number
  /** Monthly fixed outflow: secured + unsecured debt payments + full property
   *  housing cost (PITI across every property). Thomas's "fixed expenses". */
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

/** Full monthly housing cost for a property: P+I + PMI + prorated property
 *  tax, homeowners + flood insurance, and HOA. Loan-independent — a paid-off
 *  home still carries taxes, insurance, and HOA. */
export function propertyMonthlyOutflow(p: Property): number {
  const m = p.mortgage
  return (
    (m?.monthlyPayment ?? 0) +
    (m?.pmiMipMonthly ?? 0) +
    (p.propertyTaxAnnual ?? 0) / 12 +
    (p.homeownersInsuranceAnnual ?? 0) / 12 +
    (p.floodInsuranceAnnual ?? 0) / 12 +
    (p.hoaMonthly ?? 0)
  )
}

export function totals(pfs: Pfs): Totals {
  // Real estate is owned by `properties` now (single source of truth). Exclude
  // any legacy real_estate asset rows so a home is never counted on both sides.
  const nonRealEstateAssets = pfs.assets.reduce(
    (s, a) => s + (a.category === 'real_estate' ? 0 : a.value),
    0,
  )
  const propertyValue = pfs.properties.reduce((s, p) => s + p.marketValue, 0)
  const totalAssets = nonRealEstateAssets + propertyValue

  // Rental income flows from the property — no separate income row needed.
  const rentalIncome = pfs.properties.reduce((s, p) => s + (p.monthlyRent ?? 0), 0)
  const monthlyIncome = pfs.income.reduce((s, i) => s + i.monthly, 0) + rentalIncome

  // Every property's mortgage balance feeds liabilities + equity (not just the
  // primary's), so net worth and equity stay consistent across all properties.
  const ledgerLiabilities = pfs.liabilities.reduce((s, l) => s + l.balance, 0)
  const unsecuredDebt = pfs.expenses.reduce((s, e) => s + e.balance, 0)
  const mortgageBalance = pfs.properties.reduce((s, p) => s + (p.mortgage?.balance ?? 0), 0)
  const totalLiabilities = ledgerLiabilities + mortgageBalance + unsecuredDebt

  // Cash flow: secured + unsecured debt payments + full property housing cost
  // (PITI across every property) + household spend. Carrying costs come from
  // the property so they're never re-entered under Household spending.
  const securedPayments = pfs.liabilities.reduce(
    (s, l) => s + (liabilityMonthlyOutflow(l)?.amount ?? 0),
    0,
  )
  const unsecuredPayments = pfs.expenses.reduce(
    (s, e) => s + (expenseMonthlyOutflow(e)?.amount ?? 0),
    0,
  )
  const housingPayments = pfs.properties.reduce((s, p) => s + propertyMonthlyOutflow(p), 0)
  const monthlyDebtPayments = securedPayments + unsecuredPayments + housingPayments
  const monthlyLivingExpenses = pfs.livingExpenses.reduce((s, e) => s + e.monthlyAmount, 0)
  const monthlyExpenses = monthlyDebtPayments + monthlyLivingExpenses

  return {
    totalAssets,
    ledgerLiabilities,
    unsecuredDebt,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    homeEquity: propertyValue - mortgageBalance,
    monthlyIncome,
    monthlyDebtPayments,
    monthlyLivingExpenses,
    monthlyExpenses,
    monthlyDiscretionary: monthlyIncome - monthlyDebtPayments,
    monthlyLeftover: monthlyIncome - monthlyExpenses,
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
  const flood = m.floodInsuranceAnnual ?? 0
  const pmi = m.pmiMipMonthly ?? 0
  const hoa = m.hoaMonthly ?? 0
  const piti =
    m.propertyTaxAnnual != null ||
    m.homeownersInsuranceAnnual != null ||
    m.floodInsuranceAnnual != null ||
    m.pmiMipMonthly != null ||
    m.hoaMonthly != null
  return {
    total: m.monthlyPayment + taxes / 12 + insurance / 12 + flood / 12 + pmi + hoa,
    hasPiti: piti,
  }
}
