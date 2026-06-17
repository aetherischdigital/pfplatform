import { describe, it, expect } from 'vitest'
import { totals, propertyMonthlyOutflow, type Pfs, type Property, type Mortgage } from './pfs'

function loan(over: Partial<Mortgage>): Mortgage {
  return {
    id: 'm',
    propertyId: 'p',
    propertyLabel: 'Home',
    startingHomeValue: 0,
    balance: 0,
    ratePct: 0,
    termMonthsRemaining: 0,
    firstPaymentDate: null,
    monthlyPayment: 0,
    extraPrincipal: 0,
    propertyTaxAnnual: null,
    homeownersInsuranceAnnual: null,
    floodInsuranceAnnual: null,
    pmiMipMonthly: null,
    hoaMonthly: null,
    isPrimary: false,
    dateAcquired: null,
    originalCost: null,
    pctOwnership: 100,
    ...over,
  }
}

function prop(over: Partial<Property>): Property {
  return {
    id: 'p',
    label: 'Home',
    propertyType: 'other',
    address: null,
    marketValue: 0,
    propertyTaxAnnual: null,
    homeownersInsuranceAnnual: null,
    floodInsuranceAnnual: null,
    hoaMonthly: null,
    monthlyRent: null,
    dateAcquired: null,
    originalCost: null,
    pctOwnership: 100,
    mortgage: null,
    ...over,
  }
}

function pfsOf(over: Partial<Pfs>): Pfs {
  return {
    assets: [],
    liabilities: [],
    income: [],
    expenses: [],
    livingExpenses: [],
    properties: [],
    primaryProperty: null,
    mortgage: null,
    mortgages: [],
    ...over,
  }
}

describe('propertyMonthlyOutflow', () => {
  it('sums P&I, PMI, and prorated carrying costs', () => {
    const p = prop({
      propertyTaxAnnual: 6000, // 500/mo
      homeownersInsuranceAnnual: 1200, // 100/mo
      floodInsuranceAnnual: 600, // 50/mo
      hoaMonthly: 75,
      mortgage: loan({ monthlyPayment: 2000, pmiMipMonthly: 40 }),
    })
    expect(propertyMonthlyOutflow(p)).toBe(2000 + 40 + 500 + 100 + 50 + 75)
  })

  it('works for a paid-off home (carrying costs only)', () => {
    const p = prop({ propertyTaxAnnual: 2400, homeownersInsuranceAnnual: 1200 })
    expect(propertyMonthlyOutflow(p)).toBe(200 + 100)
  })
})

describe('totals — properties as source of truth', () => {
  const primary = prop({
    id: 'a',
    propertyType: 'primary',
    marketValue: 500_000,
    propertyTaxAnnual: 6000,
    homeownersInsuranceAnnual: 1200,
    mortgage: loan({ id: 'la', propertyId: 'a', balance: 300_000, monthlyPayment: 2000 }),
  })
  const rental = prop({
    id: 'b',
    propertyType: 'rental',
    marketValue: 200_000,
    monthlyRent: 1500,
    propertyTaxAnnual: 2400,
  })

  const pfs = pfsOf({
    // A legacy real_estate asset must be ignored (owned by properties now);
    // the cash asset still counts.
    assets: [
      { id: 'r', label: 'Old home asset', category: 'real_estate', value: 999_999 },
      { id: 'c', label: 'Cash', category: 'cash', value: 10_000 },
    ],
    liabilities: [
      { id: 'auto', label: 'Auto', category: 'auto_loan', balance: 10_000, monthlyPayment: 300 },
    ],
    income: [{ id: 'sal', label: 'Salary', category: 'salary', monthly: 5000 }],
    expenses: [
      { id: 'cc', label: 'Visa', category: 'credit_card', balance: 2000, monthlyPayment: 100 },
    ],
    livingExpenses: [{ id: 'g', label: 'Groceries', category: 'food', monthlyAmount: 800 }],
    properties: [primary, rental],
    primaryProperty: primary,
  })

  const t = totals(pfs)

  it('excludes legacy real_estate assets and counts property value', () => {
    // 10k cash + 500k + 200k — the 999,999 real_estate row is excluded.
    expect(t.totalAssets).toBe(710_000)
  })

  it('counts every mortgage balance in liabilities and equity', () => {
    expect(t.totalLiabilities).toBe(10_000 + 300_000 + 2000)
    expect(t.homeEquity).toBe(700_000 - 300_000)
  })

  it('folds rental income into monthly income', () => {
    expect(t.monthlyIncome).toBe(5000 + 1500)
  })

  it('includes full PITI for every property in fixed outflow', () => {
    // auto 300 + cc 100 + primary PITI (2000+500+100=2600) + rental tax 200
    expect(t.monthlyDebtPayments).toBe(300 + 100 + 2600 + 200)
  })

  it('derives net worth and leftover consistently', () => {
    expect(t.netWorth).toBe(710_000 - 312_000)
    expect(t.monthlyLeftover).toBe(6500 - (3200 + 800))
  })
})
