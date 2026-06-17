import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Home,
  Tent,
  KeyRound,
  Building2,
  ChevronDown,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import StatementPanel from '../../components/ui/StatementPanel'
import { formFieldClass } from '../../components/ui/formStyles'
import {
  fetchPfs,
  createProperty,
  updateProperty,
  upsertMortgage,
  deleteMortgage,
  setPrimaryProperty,
  type PropertyType,
  type PropertyInput,
  type LoanInput,
} from '../../lib/pfs'
import { formatUSD } from '../../lib/mortgage'
import { parseMoney } from '../../lib/money'

const TYPE_OPTIONS: { value: PropertyType; label: string; icon: LucideIcon }[] = [
  { value: 'primary', label: 'Primary', icon: Home },
  { value: 'vacation', label: 'Vacation', icon: Tent },
  { value: 'rental', label: 'Rental', icon: KeyRound },
  { value: 'other', label: 'Other', icon: Building2 },
]

type Errors = Record<string, string | undefined>

export default function PropertyForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [loadingEdit, setLoadingEdit] = useState(isEdit)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Property fields
  const [label, setLabel] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>('primary')
  const [address, setAddress] = useState('')
  const [marketValue, setMarketValue] = useState('')
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState('')
  const [homeownersInsuranceAnnual, setHomeownersInsuranceAnnual] = useState('')
  const [floodInsuranceAnnual, setFloodInsuranceAnnual] = useState('')
  const [hoaMonthly, setHoaMonthly] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [dateAcquired, setDateAcquired] = useState('')
  const [originalCost, setOriginalCost] = useState('')
  const [pctOwnership, setPctOwnership] = useState('100')

  // Loan sub-form
  const [hasMortgage, setHasMortgage] = useState(true)
  const [existingLoanId, setExistingLoanId] = useState<string | null>(null)
  const [balance, setBalance] = useState('')
  const [ratePct, setRatePct] = useState('')
  const [termMonthsRemaining, setTermMonthsRemaining] = useState('')
  const [firstPaymentDate, setFirstPaymentDate] = useState('')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [extraPrincipal, setExtraPrincipal] = useState('0')
  const [pmiMipMonthly, setPmiMipMonthly] = useState('')

  const [showRecords, setShowRecords] = useState(false)
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load existing property for edit; learn whether a primary already exists so
  // a new non-primary entry doesn't silently demote it.
  useEffect(() => {
    let cancelled = false
    fetchPfs()
      .then((pfs) => {
        if (cancelled) return
        if (isEdit) {
          const p = pfs.properties.find((x) => x.id === id)
          if (!p) {
            setLoadError('Property not found.')
            setLoadingEdit(false)
            return
          }
          setLabel(p.label)
          setPropertyType(p.propertyType)
          setAddress(p.address ?? '')
          setMarketValue(String(p.marketValue))
          setPropertyTaxAnnual(p.propertyTaxAnnual != null ? String(p.propertyTaxAnnual) : '')
          setHomeownersInsuranceAnnual(
            p.homeownersInsuranceAnnual != null ? String(p.homeownersInsuranceAnnual) : '',
          )
          setFloodInsuranceAnnual(
            p.floodInsuranceAnnual != null ? String(p.floodInsuranceAnnual) : '',
          )
          setHoaMonthly(p.hoaMonthly != null ? String(p.hoaMonthly) : '')
          setMonthlyRent(p.monthlyRent != null ? String(p.monthlyRent) : '')
          setDateAcquired(p.dateAcquired ?? '')
          setOriginalCost(p.originalCost != null ? String(p.originalCost) : '')
          setPctOwnership(String(p.pctOwnership))
          if (p.dateAcquired || p.originalCost != null || p.pctOwnership !== 100) {
            setShowRecords(true)
          }
          const loan = p.mortgage
          setHasMortgage(loan != null)
          setExistingLoanId(loan?.id ?? null)
          if (loan) {
            setBalance(String(loan.balance))
            setRatePct(String(loan.ratePct))
            setTermMonthsRemaining(String(loan.termMonthsRemaining))
            setFirstPaymentDate(loan.firstPaymentDate ?? '')
            setMonthlyPayment(String(loan.monthlyPayment))
            setExtraPrincipal(String(loan.extraPrincipal))
            setPmiMipMonthly(loan.pmiMipMonthly != null ? String(loan.pmiMipMonthly) : '')
          }
          setLoadingEdit(false)
        } else if (pfs.primaryProperty) {
          // Already have a primary residence — default a new entry to "other".
          setPropertyType('other')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Could not load property.')
          setLoadingEdit(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const isRental = propertyType === 'rental'

  // --- Validation (pure, recomputed each render) ---------------------------
  const value = parseMoney(marketValue)
  const errors: Errors = {}
  if (value === null || value <= 0) errors.marketValue = 'Enter an amount greater than $0.'
  for (const [key, raw] of [
    ['propertyTaxAnnual', propertyTaxAnnual],
    ['homeownersInsuranceAnnual', homeownersInsuranceAnnual],
    ['floodInsuranceAnnual', floodInsuranceAnnual],
    ['hoaMonthly', hoaMonthly],
    ['monthlyRent', monthlyRent],
  ] as const) {
    if (raw.trim() !== '') {
      const n = parseMoney(raw)
      if (n === null || n < 0) errors[key] = 'Enter a positive number or leave blank.'
    }
  }
  let loanBalance: number | null = null
  let loanRate: number | null = null
  let loanTerm: number | null = null
  let loanPayment: number | null = null
  let loanExtra = 0
  let loanPmi: number | null = null
  if (hasMortgage) {
    loanBalance = parseMoney(balance)
    loanRate = ratePct.trim() === '' ? null : Number(ratePct)
    loanTerm = termMonthsRemaining.trim() === '' ? null : Number(termMonthsRemaining)
    loanPayment = parseMoney(monthlyPayment)
    loanExtra = parseMoney(extraPrincipal) ?? 0
    loanPmi = parseMoney(pmiMipMonthly)
    if (loanBalance === null || loanBalance <= 0) errors.balance = 'Enter an amount greater than $0.'
    if (loanPayment === null || loanPayment <= 0)
      errors.monthlyPayment = 'Enter an amount greater than $0.'
    if (!Number.isFinite(loanExtra) || loanExtra < 0) errors.extraPrincipal = 'Enter $0 or more.'
    if (loanRate === null || !Number.isFinite(loanRate)) errors.ratePct = 'Enter a number.'
    else if (loanRate < 0 || loanRate > 100) errors.ratePct = 'Must be between 0 and 100.'
    if (loanTerm === null || !Number.isInteger(loanTerm))
      errors.termMonthsRemaining = 'Enter a whole number.'
    else if (loanTerm <= 0 || loanTerm > 600)
      errors.termMonthsRemaining = 'Must be between 1 and 600.'
    if (loanPmi !== null && loanPmi < 0)
      errors.pmiMipMonthly = 'Enter a positive number or leave blank.'
    if (
      !errors.balance &&
      !errors.ratePct &&
      !errors.monthlyPayment &&
      !errors.extraPrincipal &&
      loanBalance !== null &&
      loanRate !== null &&
      loanPayment !== null
    ) {
      const firstMonthInterest = (loanBalance * loanRate) / 100 / 12
      if (loanPayment + loanExtra <= firstMonthInterest)
        errors.monthlyPayment = `Payment must exceed the first month's interest (≈ ${formatUSD(firstMonthInterest)}).`
    }
  }
  const errorKeys = Object.keys(errors)
  const show = (key: string) => (submitted || touched.has(key) ? errors[key] : undefined)
  const blur = (key: string) => setTouched((t) => new Set(t).add(key))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    setSubmitted(true)
    if (errorKeys.length > 0) {
      const el = document.getElementById(`pf-${errorKeys[0]}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus({ preventScroll: true })
      return
    }

    const propertyInput: PropertyInput = {
      label: label.trim() || (isRental ? 'Rental' : 'My home'),
      propertyType: propertyType === 'primary' ? 'other' : propertyType,
      address: address.trim() === '' ? null : address,
      marketValue: value!,
      propertyTaxAnnual: parseMoney(propertyTaxAnnual),
      homeownersInsuranceAnnual: parseMoney(homeownersInsuranceAnnual),
      floodInsuranceAnnual: parseMoney(floodInsuranceAnnual),
      hoaMonthly: parseMoney(hoaMonthly),
      monthlyRent: isRental ? parseMoney(monthlyRent) : null,
      dateAcquired: dateAcquired.trim() === '' ? null : dateAcquired,
      originalCost: parseMoney(originalCost),
      pctOwnership: Math.max(0.01, Math.min(100, Number(pctOwnership) || 100)),
    }

    setSaving(true)
    try {
      const propertyId = isEdit ? id! : await createProperty(propertyInput)
      if (isEdit) await updateProperty(propertyId, propertyInput)
      if (propertyType === 'primary') await setPrimaryProperty(propertyId)

      if (hasMortgage) {
        const loanInput: LoanInput = {
          balance: loanBalance!,
          ratePct: loanRate!,
          termMonthsRemaining: loanTerm!,
          firstPaymentDate: firstPaymentDate.trim() === '' ? null : firstPaymentDate,
          monthlyPayment: loanPayment!,
          extraPrincipal: loanExtra,
          pmiMipMonthly: loanPmi,
        }
        await upsertMortgage(propertyId, loanInput, existingLoanId ?? undefined)
      } else if (existingLoanId) {
        await deleteMortgage(existingLoanId)
      }
      navigate('/app/properties')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed.')
      setSaving(false)
    }
  }

  if (loadingEdit) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="h-8 w-44 animate-pulse rounded bg-surface-100" />
        <div className="h-40 animate-pulse rounded-lg bg-surface-100" />
        <div className="h-56 animate-pulse rounded-lg bg-surface-100" />
      </div>
    )
  }
  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => navigate('/app/properties')}
            className="ml-auto font-medium underline"
          >
            Back to Properties
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-2xl pb-28 animate-fade-in">
      {/* Header */}
      <button
        type="button"
        onClick={() => navigate('/app/properties')}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-surface-500 transition-colors hover:text-surface-900"
      >
        <ArrowLeft size={15} /> Properties
      </button>
      <div className="mb-1 flex items-center gap-3">
        <span className="h-px w-7 bg-accent-400" />
        <span className="font-label text-[12px] uppercase tracking-[0.28em] text-accent-600">
          {isEdit ? 'Edit property' : 'New property'}
        </span>
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
        {isEdit ? label || 'Your property' : 'Add a property'}
      </h1>
      <p className="mt-1 text-sm text-surface-500">
        Track equity, payoff, and the true monthly cost of ownership — with or without a mortgage.
      </p>

      {submitted && errorKeys.length > 0 && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            {errorKeys.length} {errorKeys.length === 1 ? 'field needs' : 'fields need'} attention
            before you can save.
          </span>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {/* Basics */}
        <StatementPanel label="The basics" surface="cream">
          <div className="space-y-4 p-5">
            <div>
              <span className="text-sm font-medium text-surface-700">Property type</span>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const active = propertyType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPropertyType(opt.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
                        active
                          ? 'border-accent-400 bg-accent-100/60 text-surface-900'
                          : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-accent-600' : 'text-surface-400'} />
                      <span className="font-medium">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <Field label="Label" hint="A short name for this property.">
              <input
                type="text"
                maxLength={120}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={isRental ? 'Maple St rental' : 'Primary residence'}
                className={formFieldClass}
              />
            </Field>

            <Field label="Address" hint="Street, city, state. Optional — address lookup is coming.">
              <input
                type="text"
                maxLength={240}
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Springfield, IL"
                className={formFieldClass}
              />
            </Field>
          </div>
        </StatementPanel>

        {/* Value */}
        <StatementPanel label="What it's worth" surface="cream">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field
              label="Home value"
              hint="Today's market value — anchors your equity."
              error={show('marketValue')}
            >
              <CurrencyInput
                id="pf-marketValue"
                value={marketValue}
                onChange={setMarketValue}
                onBlur={() => blur('marketValue')}
                invalid={!!show('marketValue')}
              />
            </Field>
            {isRental && (
              <Field
                label="Monthly rent"
                hint="Gross rent you collect each month."
                error={show('monthlyRent')}
              >
                <CurrencyInput
                  id="pf-monthlyRent"
                  value={monthlyRent}
                  onChange={setMonthlyRent}
                  onBlur={() => blur('monthlyRent')}
                  invalid={!!show('monthlyRent')}
                />
              </Field>
            )}
          </div>
        </StatementPanel>

        {/* Carrying costs */}
        <StatementPanel label="Carrying costs" meta="optional" surface="cream">
          <div className="p-5">
            <p className="mb-4 text-xs text-surface-500">
              Taxes, insurance, and HOA feed your true monthly housing cost and map straight into
              your PFS — so you never enter them twice.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Property tax / yr" error={show('propertyTaxAnnual')}>
                <CurrencyInput
                  id="pf-propertyTaxAnnual"
                  value={propertyTaxAnnual}
                  onChange={setPropertyTaxAnnual}
                  onBlur={() => blur('propertyTaxAnnual')}
                  invalid={!!show('propertyTaxAnnual')}
                />
              </Field>
              <Field label="Homeowners insurance / yr" error={show('homeownersInsuranceAnnual')}>
                <CurrencyInput
                  id="pf-homeownersInsuranceAnnual"
                  value={homeownersInsuranceAnnual}
                  onChange={setHomeownersInsuranceAnnual}
                  onBlur={() => blur('homeownersInsuranceAnnual')}
                  invalid={!!show('homeownersInsuranceAnnual')}
                />
              </Field>
              <Field label="Flood insurance / yr" error={show('floodInsuranceAnnual')}>
                <CurrencyInput
                  id="pf-floodInsuranceAnnual"
                  value={floodInsuranceAnnual}
                  onChange={setFloodInsuranceAnnual}
                  onBlur={() => blur('floodInsuranceAnnual')}
                  invalid={!!show('floodInsuranceAnnual')}
                />
              </Field>
              <Field label="HOA / mo" error={show('hoaMonthly')}>
                <CurrencyInput
                  id="pf-hoaMonthly"
                  value={hoaMonthly}
                  onChange={setHoaMonthly}
                  onBlur={() => blur('hoaMonthly')}
                  invalid={!!show('hoaMonthly')}
                />
              </Field>
            </div>
          </div>
        </StatementPanel>

        {/* Mortgage */}
        <StatementPanel label="Mortgage" surface="cream">
          <div className="p-5">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={hasMortgage}
                onChange={(e) => setHasMortgage(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-surface-900">This property has a mortgage</span>
                <span className="ml-2 text-xs text-surface-500">
                  Uncheck for a home you own outright.
                </span>
              </span>
            </label>

            {hasMortgage && (
              <div className="mt-4 grid gap-4 border-t border-surface-200 pt-4 sm:grid-cols-2">
                <Field
                  label="Current balance"
                  hint="From your latest statement."
                  error={show('balance')}
                >
                  <CurrencyInput
                    id="pf-balance"
                    value={balance}
                    onChange={setBalance}
                    onBlur={() => blur('balance')}
                    invalid={!!show('balance')}
                  />
                </Field>
                <Field label="Interest rate" hint="Annual, e.g. 6.5." error={show('ratePct')}>
                  <div className="relative">
                    <input
                      id="pf-ratePct"
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      min="0"
                      value={ratePct}
                      onChange={(e) => setRatePct(e.target.value)}
                      onBlur={() => blur('ratePct')}
                      placeholder="6.5"
                      aria-invalid={show('ratePct') ? true : undefined}
                      className={`${formFieldClass} pr-9 ${show('ratePct') ? 'border-danger-200 focus:border-danger-600' : ''}`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                      %
                    </span>
                  </div>
                </Field>
                <Field
                  label="Months remaining"
                  hint="e.g. 336 for 28 years left."
                  error={show('termMonthsRemaining')}
                >
                  <input
                    id="pf-termMonthsRemaining"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="1"
                    max="600"
                    value={termMonthsRemaining}
                    onChange={(e) => setTermMonthsRemaining(e.target.value)}
                    onBlur={() => blur('termMonthsRemaining')}
                    placeholder="336"
                    aria-invalid={show('termMonthsRemaining') ? true : undefined}
                    className={`${formFieldClass} ${show('termMonthsRemaining') ? 'border-danger-200 focus:border-danger-600' : ''}`}
                  />
                </Field>
                <Field label="1st payment date" hint="Anchors the schedule. Optional.">
                  <input
                    type="date"
                    value={firstPaymentDate}
                    onChange={(e) => setFirstPaymentDate(e.target.value)}
                    className={formFieldClass}
                  />
                </Field>
                <Field
                  label="Monthly P&I payment"
                  hint="Principal & interest only."
                  error={show('monthlyPayment')}
                >
                  <CurrencyInput
                    id="pf-monthlyPayment"
                    value={monthlyPayment}
                    onChange={setMonthlyPayment}
                    onBlur={() => blur('monthlyPayment')}
                    invalid={!!show('monthlyPayment')}
                  />
                </Field>
                <Field
                  label="Extra principal / mo"
                  hint="Optional — speeds the payoff."
                  error={show('extraPrincipal')}
                >
                  <CurrencyInput
                    id="pf-extraPrincipal"
                    value={extraPrincipal}
                    onChange={setExtraPrincipal}
                    onBlur={() => blur('extraPrincipal')}
                    invalid={!!show('extraPrincipal')}
                  />
                </Field>
                <Field
                  label="PMI / MIP / mo"
                  hint="Mortgage insurance, if any."
                  error={show('pmiMipMonthly')}
                >
                  <CurrencyInput
                    id="pf-pmiMipMonthly"
                    value={pmiMipMonthly}
                    onChange={setPmiMipMonthly}
                    onBlur={() => blur('pmiMipMonthly')}
                    invalid={!!show('pmiMipMonthly')}
                  />
                </Field>
              </div>
            )}
          </div>
        </StatementPanel>

        {/* Schedule C — progressive disclosure */}
        <div>
          <button
            type="button"
            onClick={() => setShowRecords((v) => !v)}
            aria-expanded={showRecords}
            className="flex w-full items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-5 py-3 text-left transition-colors hover:border-surface-300"
          >
            <span>
              <span className="font-label text-[11px] uppercase tracking-[0.24em] text-accent-600">
                For your records
              </span>
              <span className="ml-3 text-xs text-surface-500">
                Acquisition details — doesn't affect calculations
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`text-surface-400 transition-transform ${showRecords ? 'rotate-180' : ''}`}
            />
          </button>
          {showRecords && (
            <div className="mt-2 grid gap-4 rounded-lg border border-surface-200 bg-surface-50 p-5 sm:grid-cols-3">
              <Field label="Date acquired">
                <input
                  type="date"
                  value={dateAcquired}
                  onChange={(e) => setDateAcquired(e.target.value)}
                  className={formFieldClass}
                />
              </Field>
              <Field label="Original cost">
                <CurrencyInput value={originalCost} onChange={setOriginalCost} />
              </Field>
              <Field label="% ownership">
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    min="0.01"
                    max="100"
                    value={pctOwnership}
                    onChange={(e) => setPctOwnership(e.target.value)}
                    className={`${formFieldClass} pr-9`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                    %
                  </span>
                </div>
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-surface-200 bg-surface-50/95 backdrop-blur md:left-60">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-6 py-3">
          <span className="truncate text-xs text-surface-500">
            {saveError ? (
              <span className="text-danger-700">{saveError}</span>
            ) : (
              "Carrying costs and rent map into your PFS automatically."
            )}
          </span>
          <div className="flex flex-shrink-0 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => navigate('/app/properties')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add property'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-surface-700">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-danger-700">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-surface-500">{hint}</p>
      )}
    </label>
  )
}

function CurrencyInput({
  id,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  invalid?: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="0.00"
        aria-invalid={invalid || undefined}
        className={`${formFieldClass} pl-7 font-mono ${invalid ? 'border-danger-200 focus:border-danger-600' : ''}`}
      />
    </div>
  )
}
