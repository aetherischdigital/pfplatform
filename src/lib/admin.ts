import { supabase } from './supabase'
import type { UserRole, WaitlistInterest } from './profile'
import type {
  Asset,
  AssetCategory,
  Expense,
  ExpenseCategory,
  IncomeCategory,
  IncomeSource,
  Liability,
  LiabilityCategory,
  Mortgage,
} from './pfs'
import type { BusinessVenture } from './businessVentures'
import type { ContingentLiability, ContingentLiabilityType } from './contingentLiabilities'

export type AdminUser = {
  id: string
  email: string | null
  role: UserRole
  displayName: string | null
  isActive: boolean
  waitlistInterest: WaitlistInterest
  createdAt: string
}

type Row = {
  id: string
  email: string | null
  role: UserRole
  display_name: string | null
  is_active: boolean
  waitlist_interest: WaitlistInterest | null
  created_at: string
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw error
  return (data as Row[]).map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    displayName: r.display_name,
    isActive: r.is_active,
    waitlistInterest: r.waitlist_interest ?? 'none',
    createdAt: r.created_at,
  }))
}

export async function updateUserRole(targetId: string, newRole: UserRole): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user_role', {
    target_id: targetId,
    new_role: newRole,
  })
  if (error) throw error
}

export async function setUserActive(targetId: string, active: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_active', {
    target_id: targetId,
    active,
  })
  if (error) throw error
}

// ---------------------------------------------------------------------------
// admin_user_summary — full PFS drill-in for one user
// ---------------------------------------------------------------------------

export type AdminUserSummary = {
  profile: {
    id: string
    email: string | null
    displayName: string | null
    role: UserRole
    isActive: boolean
    waitlistInterest: WaitlistInterest
    birthdate: string | null
    dependents: number | null
    spouseName: string | null
    spouseBirthdate: string | null
    spouseOccupation: string | null
    createdAt: string
  }
  mortgages: Mortgage[]
  assets: Asset[]
  liabilities: Liability[]
  income: IncomeSource[]
  expenses: Expense[]
  businessVentures: BusinessVenture[]
  contingentLiabilities: ContingentLiability[]
  snapshots: Array<{ snapshotDate: string; netWorth: number }>
}

type RawSummary = {
  profile: {
    id: string
    email: string | null
    display_name: string | null
    role: UserRole
    is_active: boolean
    waitlist_interest: WaitlistInterest | null
    birthdate: string | null
    dependents: number | null
    spouse_name: string | null
    spouse_birthdate: string | null
    spouse_occupation: string | null
    created_at: string
  }
  properties: Array<{
    id: string
    label: string
    property_type: string
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
  }>
  mortgages: Array<{
    id: string
    property_id: string
    balance: string | number
    rate_pct: string | number
    term_months_remaining: number
    first_payment_date: string | null
    monthly_payment: string | number
    extra_principal: string | number
    pmi_mip_monthly: string | number | null
  }>
  pfs_records: Array<{
    id: string
    kind: 'asset' | 'liability' | 'income' | 'expense'
    label: string
    category: string | null
    amount: string | number
    rate: string | number | null
    monthly_payment?: string | number | null
  }>
  business_ventures: Array<{
    id: string
    name: string
    address: string | null
    pct_ownership: string | number | null
    position_title: string | null
    business_assets: string | number | null
    line_of_business: string | null
    years_in_business: number | null
  }>
  contingent_liabilities: Array<{
    id: string
    type: ContingentLiabilityType
    description: string
    estimated_amount: string | number | null
  }>
  net_worth_snapshots: Array<{
    snapshot_date: string
    net_worth: string | number
  }>
}

const n = (v: string | number): number => (typeof v === 'string' ? Number(v) : v)
const nN = (v: string | number | null): number | null =>
  v === null ? null : typeof v === 'string' ? Number(v) : v

export async function fetchUserSummary(userId: string): Promise<AdminUserSummary> {
  const { data, error } = await supabase.rpc('admin_user_summary', { p_user_id: userId })
  if (error) throw error
  const raw = data as RawSummary

  // Loans live on mortgages; the home (label, value, carrying costs) lives on
  // properties. Join them into the fat Mortgage the admin modal renders. A
  // paid-off property (no loan) simply produces no row here.
  const propsById = new Map(raw.properties.map((p) => [p.id, p]))
  const mortgages: Mortgage[] = raw.mortgages.map((m) => {
    const p = propsById.get(m.property_id)
    return {
      id: m.id,
      propertyId: m.property_id,
      propertyLabel: p?.label ?? 'Property',
      startingHomeValue: p ? n(p.market_value) : 0,
      balance: n(m.balance),
      ratePct: n(m.rate_pct),
      termMonthsRemaining: m.term_months_remaining,
      firstPaymentDate: m.first_payment_date,
      monthlyPayment: n(m.monthly_payment),
      extraPrincipal: n(m.extra_principal),
      propertyTaxAnnual: p ? nN(p.property_tax_annual) : null,
      homeownersInsuranceAnnual: p ? nN(p.homeowners_insurance_annual) : null,
      floodInsuranceAnnual: p ? nN(p.flood_insurance_annual) : null,
      pmiMipMonthly: nN(m.pmi_mip_monthly),
      hoaMonthly: p ? nN(p.hoa_monthly) : null,
      isPrimary: p?.property_type === 'primary',
      dateAcquired: p?.date_acquired ?? null,
      originalCost: p ? nN(p.original_cost) : null,
      pctOwnership: p ? n(p.pct_ownership) : 100,
    }
  })

  const assets: Asset[] = []
  const liabilities: Liability[] = []
  const income: IncomeSource[] = []
  const expenses: Expense[] = []
  for (const r of raw.pfs_records) {
    const amount = n(r.amount)
    const rate = r.rate === null ? undefined : n(r.rate)
    if (r.kind === 'asset') {
      assets.push({
        id: r.id,
        label: r.label,
        category: (r.category ?? 'other') as AssetCategory,
        value: amount,
      })
    } else if (r.kind === 'liability') {
      liabilities.push({
        id: r.id,
        label: r.label,
        category: (r.category ?? 'other') as LiabilityCategory,
        balance: amount,
        rate,
        monthlyPayment: nN(r.monthly_payment ?? null),
      })
    } else if (r.kind === 'income') {
      income.push({
        id: r.id,
        label: r.label,
        category: (r.category ?? 'other') as IncomeCategory,
        monthly: amount,
      })
    } else {
      expenses.push({
        id: r.id,
        label: r.label,
        category: (r.category ?? 'other') as ExpenseCategory,
        balance: amount,
        rate,
        monthlyPayment: nN(r.monthly_payment ?? null),
      })
    }
  }

  return {
    profile: {
      id: raw.profile.id,
      email: raw.profile.email,
      displayName: raw.profile.display_name,
      role: raw.profile.role,
      isActive: raw.profile.is_active,
      waitlistInterest: raw.profile.waitlist_interest ?? 'none',
      birthdate: raw.profile.birthdate,
      dependents: raw.profile.dependents,
      spouseName: raw.profile.spouse_name,
      spouseBirthdate: raw.profile.spouse_birthdate,
      spouseOccupation: raw.profile.spouse_occupation,
      createdAt: raw.profile.created_at,
    },
    mortgages,
    assets,
    liabilities,
    income,
    expenses,
    businessVentures: raw.business_ventures.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      pctOwnership: nN(b.pct_ownership),
      positionTitle: b.position_title,
      businessAssets: nN(b.business_assets),
      lineOfBusiness: b.line_of_business,
      yearsInBusiness: b.years_in_business,
    })),
    contingentLiabilities: raw.contingent_liabilities.map((c) => ({
      id: c.id,
      type: c.type,
      description: c.description,
      estimatedAmount: nN(c.estimated_amount),
    })),
    snapshots: raw.net_worth_snapshots.map((s) => ({
      snapshotDate: s.snapshot_date,
      netWorth: n(s.net_worth),
    })),
  }
}
