import { useState, type FormEvent } from 'react'
import Modal from '../ui/Modal'
import { formFieldClass as modalFieldClass } from '../ui/formStyles'
import { Button } from '../ui/Button'
import {
  createProperty,
  updateProperty,
  upsertMortgage,
  deleteMortgage,
  setPrimaryProperty,
  PROPERTY_TYPE_LABELS,
  type Property,
  type PropertyType,
  type PropertyInput,
  type LoanInput,
} from '../../lib/pfs'
import { formatUSD } from '../../lib/mortgage'
import { parseMoney } from '../../lib/money'

type Props = {
  open: boolean
  onClose: () => void
  /** Returns a promise so the modal can keep its saving state until the
   *  parent's refetch completes — avoids a flash of stale UI after save. */
  onSaved: () => void | Promise<void>
  existing?: Property | null
  /** Type to preselect for a new property. Parent passes 'other' when a primary
   *  already exists so we don't surprise the user by demoting it. */
  defaultType?: PropertyType
}

export default function PropertyModal({
  open,
  onClose,
  onSaved,
  existing,
  defaultType = 'primary',
}: Props) {
  const isEdit = !!existing

  // --- Property fields -------------------------------------------------------
  const [label, setLabel] = useState(existing?.label ?? 'Primary residence')
  const [propertyType, setPropertyType] = useState<PropertyType>(
    existing?.propertyType ?? defaultType,
  )
  const [address, setAddress] = useState(existing?.address ?? '')
  const [marketValue, setMarketValue] = useState(
    existing != null ? String(existing.marketValue) : '',
  )
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(
    existing?.propertyTaxAnnual != null ? String(existing.propertyTaxAnnual) : '',
  )
  const [homeownersInsuranceAnnual, setHomeownersInsuranceAnnual] = useState(
    existing?.homeownersInsuranceAnnual != null ? String(existing.homeownersInsuranceAnnual) : '',
  )
  const [floodInsuranceAnnual, setFloodInsuranceAnnual] = useState(
    existing?.floodInsuranceAnnual != null ? String(existing.floodInsuranceAnnual) : '',
  )
  const [hoaMonthly, setHoaMonthly] = useState(
    existing?.hoaMonthly != null ? String(existing.hoaMonthly) : '',
  )
  const [monthlyRent, setMonthlyRent] = useState(
    existing?.monthlyRent != null ? String(existing.monthlyRent) : '',
  )
  const [dateAcquired, setDateAcquired] = useState(existing?.dateAcquired ?? '')
  const [originalCost, setOriginalCost] = useState(
    existing?.originalCost != null ? String(existing.originalCost) : '',
  )
  const [pctOwnership, setPctOwnership] = useState(
    existing != null ? String(existing.pctOwnership) : '100',
  )

  // --- Loan sub-form (optional) ---------------------------------------------
  const loan = existing?.mortgage ?? null
  const [hasMortgage, setHasMortgage] = useState<boolean>(existing ? loan != null : true)
  const [balance, setBalance] = useState(loan ? String(loan.balance) : '')
  const [ratePct, setRatePct] = useState(loan ? String(loan.ratePct) : '')
  const [termMonthsRemaining, setTermMonthsRemaining] = useState(
    loan ? String(loan.termMonthsRemaining) : '',
  )
  const [firstPaymentDate, setFirstPaymentDate] = useState(loan?.firstPaymentDate ?? '')
  const [monthlyPayment, setMonthlyPayment] = useState(loan ? String(loan.monthlyPayment) : '')
  const [extraPrincipal, setExtraPrincipal] = useState(loan ? String(loan.extraPrincipal) : '0')
  const [pmiMipMonthly, setPmiMipMonthly] = useState(
    loan?.pmiMipMonthly != null ? String(loan.pmiMipMonthly) : '',
  )

  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    marketValue?: string
    propertyTaxAnnual?: string
    homeownersInsuranceAnnual?: string
    floodInsuranceAnnual?: string
    hoaMonthly?: string
    monthlyRent?: string
    balance?: string
    ratePct?: string
    termMonthsRemaining?: string
    monthlyPayment?: string
    extraPrincipal?: string
    pmiMipMonthly?: string
  }>({})
  const [saving, setSaving] = useState(false)

  const isRental = propertyType === 'rental'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Money fields parse leniently ($, commas ok). Optional fields stay null
    // when blank — null means "not entered", never a fabricated $0.
    const value = parseMoney(marketValue)
    const tax = parseMoney(propertyTaxAnnual)
    const hoi = parseMoney(homeownersInsuranceAnnual)
    const flood = parseMoney(floodInsuranceAnnual)
    const hoa = parseMoney(hoaMonthly)
    const rent = parseMoney(monthlyRent)

    const errs: typeof fieldErrors = {}
    if (value === null || value <= 0) errs.marketValue = 'Enter an amount greater than $0.'
    if (tax !== null && tax < 0) errs.propertyTaxAnnual = 'Enter a positive number or leave blank.'
    if (hoi !== null && hoi < 0)
      errs.homeownersInsuranceAnnual = 'Enter a positive number or leave blank.'
    if (flood !== null && flood < 0)
      errs.floodInsuranceAnnual = 'Enter a positive number or leave blank.'
    if (hoa !== null && hoa < 0) errs.hoaMonthly = 'Enter a positive number or leave blank.'
    if (rent !== null && rent < 0) errs.monthlyRent = 'Enter a positive number or leave blank.'

    // Loan fields — only validated when the property has a mortgage.
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

      if (loanBalance === null || loanBalance <= 0) errs.balance = 'Enter an amount greater than $0.'
      if (loanPayment === null || loanPayment <= 0)
        errs.monthlyPayment = 'Enter an amount greater than $0.'
      if (!Number.isFinite(loanExtra) || loanExtra < 0) errs.extraPrincipal = 'Enter $0 or more.'
      if (loanRate === null || !Number.isFinite(loanRate)) errs.ratePct = 'Enter a number.'
      else if (loanRate < 0 || loanRate > 100) errs.ratePct = 'Must be between 0 and 100.'
      if (loanTerm === null || !Number.isInteger(loanTerm))
        errs.termMonthsRemaining = 'Enter a whole number.'
      else if (loanTerm <= 0 || loanTerm > 600)
        errs.termMonthsRemaining = 'Must be between 1 and 600.'
      if (loanPmi !== null && loanPmi < 0)
        errs.pmiMipMonthly = 'Enter a positive number or leave blank.'

      // A payment that doesn't cover the first month's interest never amortizes.
      if (
        !errs.balance &&
        !errs.ratePct &&
        !errs.monthlyPayment &&
        !errs.extraPrincipal &&
        loanBalance !== null &&
        loanRate !== null &&
        loanPayment !== null
      ) {
        const firstMonthInterest = (loanBalance * loanRate) / 100 / 12
        if (loanPayment + loanExtra <= firstMonthInterest) {
          errs.monthlyPayment = `Payment must exceed the first month's interest (≈ ${formatUSD(firstMonthInterest)}).`
        }
      }
    }

    setFieldErrors(errs)
    if (Object.keys(errs).length > 0 || value === null) {
      setError('Some fields need attention.')
      return
    }

    const propertyInput: PropertyInput = {
      label,
      // Insert/update as 'other' when promoting to primary, then promote via
      // setPrimaryProperty so the one-primary-per-user index is never violated.
      propertyType: propertyType === 'primary' ? 'other' : propertyType,
      address: address.trim() === '' ? null : address,
      marketValue: value,
      propertyTaxAnnual: tax,
      homeownersInsuranceAnnual: hoi,
      floodInsuranceAnnual: flood,
      hoaMonthly: hoa,
      monthlyRent: isRental ? rent : null,
      dateAcquired: dateAcquired.trim() === '' ? null : dateAcquired,
      originalCost: parseMoney(originalCost),
      pctOwnership: Math.max(0.01, Math.min(100, Number(pctOwnership) || 100)),
    }

    setSaving(true)
    try {
      const propertyId = isEdit ? existing!.id : await createProperty(propertyInput)
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
        await upsertMortgage(propertyId, loanInput, loan?.id)
      } else if (loan) {
        // Loan was removed (e.g. paid off) — drop the row.
        await deleteMortgage(loan.id)
      }

      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`${isEdit ? 'Edit' : 'Add'} property`} size="lg">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property type" hint="Drives how we treat it in your dashboard and PFS.">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className={modalFieldClass}
            >
              {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Property label" hint="A short name for this property.">
            <input
              type="text"
              required
              maxLength={120}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={modalFieldClass}
            />
          </Field>
        </div>

        <Field
          label="Address"
          hint="Street, city, state. Optional — address lookup is coming."
        >
          <input
            type="text"
            maxLength={240}
            autoComplete="street-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Springfield, IL"
            className={modalFieldClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Home value"
            hint="Today's market value — anchors your equity."
            error={fieldErrors.marketValue}
          >
            <CurrencyInput
              value={marketValue}
              onChange={setMarketValue}
              required
              invalid={!!fieldErrors.marketValue}
            />
          </Field>
          {isRental && (
            <Field
              label="Monthly rent"
              hint="Gross rent you collect each month."
              error={fieldErrors.monthlyRent}
            >
              <CurrencyInput
                value={monthlyRent}
                onChange={setMonthlyRent}
                invalid={!!fieldErrors.monthlyRent}
              />
            </Field>
          )}
        </div>

        {/* --- Carrying costs (property-level) --- */}
        <div className="border-t border-surface-200 pt-4">
          <h3 className="font-display text-sm font-semibold text-surface-900">
            Carrying costs (optional)
          </h3>
          <p className="mt-1 text-xs text-surface-500">
            Taxes, insurance, and HOA feed your true monthly housing cost and map into your PFS.
            Leave blank if you&rsquo;re not sure.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Property tax / yr"
            hint="Annual property tax (check your tax bill or escrow statement)."
            error={fieldErrors.propertyTaxAnnual}
          >
            <CurrencyInput
              value={propertyTaxAnnual}
              onChange={setPropertyTaxAnnual}
              invalid={!!fieldErrors.propertyTaxAnnual}
            />
          </Field>
          <Field
            label="Homeowners insurance / yr"
            hint="Annual premium. Enter it even if escrowed — it's still your cost."
            error={fieldErrors.homeownersInsuranceAnnual}
          >
            <CurrencyInput
              value={homeownersInsuranceAnnual}
              onChange={setHomeownersInsuranceAnnual}
              invalid={!!fieldErrors.homeownersInsuranceAnnual}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Flood insurance / yr"
            hint="Annual flood-insurance premium, if your property requires it."
            error={fieldErrors.floodInsuranceAnnual}
          >
            <CurrencyInput
              value={floodInsuranceAnnual}
              onChange={setFloodInsuranceAnnual}
              invalid={!!fieldErrors.floodInsuranceAnnual}
            />
          </Field>
          <Field
            label="HOA / mo"
            hint="Monthly HOA, condo, or co-op fees. Blank if none."
            error={fieldErrors.hoaMonthly}
          >
            <CurrencyInput
              value={hoaMonthly}
              onChange={setHoaMonthly}
              invalid={!!fieldErrors.hoaMonthly}
            />
          </Field>
        </div>

        {/* --- Mortgage sub-form --- */}
        <label className="flex items-start gap-3 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm">
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
          <div className="space-y-4 rounded-lg border border-surface-200 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Current balance"
                hint="Today's principal balance, from your latest statement."
                error={fieldErrors.balance}
              >
                <CurrencyInput
                  value={balance}
                  onChange={setBalance}
                  required
                  invalid={!!fieldErrors.balance}
                />
              </Field>
              <Field
                label="Interest rate"
                hint="Your loan's annual rate (e.g. 6.5 for 6.5%)."
                error={fieldErrors.ratePct}
              >
                <div className="relative">
                  <input
                    type="number"
                    aria-invalid={fieldErrors.ratePct ? true : undefined}
                    inputMode="decimal"
                    step="0.001"
                    min="0"
                    value={ratePct}
                    onChange={(e) => setRatePct(e.target.value)}
                    placeholder="6.5"
                    className={`${modalFieldClass} pr-9 ${fieldErrors.ratePct ? 'border-danger-200 focus:border-danger-600' : ''}`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                    %
                  </span>
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Months remaining"
                hint="Scheduled payments left (e.g. 336 for 28 years on a 30-year loan)."
                error={fieldErrors.termMonthsRemaining}
              >
                <input
                  type="number"
                  aria-invalid={fieldErrors.termMonthsRemaining ? true : undefined}
                  inputMode="numeric"
                  step="1"
                  min="1"
                  max="600"
                  value={termMonthsRemaining}
                  onChange={(e) => setTermMonthsRemaining(e.target.value)}
                  placeholder="336"
                  className={`${modalFieldClass} ${fieldErrors.termMonthsRemaining ? 'border-danger-200 focus:border-danger-600' : ''}`}
                />
              </Field>
              <Field
                label="1st payment date"
                hint="When the first payment is/was due — anchors the schedule. Optional."
              >
                <input
                  type="date"
                  value={firstPaymentDate}
                  onChange={(e) => setFirstPaymentDate(e.target.value)}
                  className={modalFieldClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Monthly P&amp;I payment"
                hint="Principal & interest only — skip taxes and insurance."
                error={fieldErrors.monthlyPayment}
              >
                <CurrencyInput
                  value={monthlyPayment}
                  onChange={setMonthlyPayment}
                  required
                  invalid={!!fieldErrors.monthlyPayment}
                />
              </Field>
              <Field
                label="Extra principal / mo"
                hint="Optional. Extra principal you send each month to speed the payoff."
                error={fieldErrors.extraPrincipal}
              >
                <CurrencyInput
                  value={extraPrincipal}
                  onChange={setExtraPrincipal}
                  invalid={!!fieldErrors.extraPrincipal}
                />
              </Field>
            </div>

            <Field
              label="PMI / MIP / mo"
              hint="Monthly mortgage insurance — PMI on conventional, MIP on FHA. Blank once it drops off."
              error={fieldErrors.pmiMipMonthly}
            >
              <CurrencyInput
                value={pmiMipMonthly}
                onChange={setPmiMipMonthly}
                invalid={!!fieldErrors.pmiMipMonthly}
              />
            </Field>
          </div>
        )}

        {/* --- Property record (optional) --- */}
        <div className="border-t border-surface-200 pt-4">
          <h3 className="font-display text-sm font-semibold text-surface-900">
            Property record (optional)
          </h3>
          <p className="mt-1 text-xs text-surface-500">
            Acquisition details for your records. Doesn&rsquo;t affect calculations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date acquired" hint="When did you close?">
            <input
              type="date"
              value={dateAcquired}
              onChange={(e) => setDateAcquired(e.target.value)}
              className={modalFieldClass}
            />
          </Field>
          <Field label="Original cost" hint="Purchase price before appreciation.">
            <CurrencyInput value={originalCost} onChange={setOriginalCost} />
          </Field>
          <Field label="% ownership" hint="Default 100. Lower if you co-own.">
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="1"
                min="0.01"
                max="100"
                value={pctOwnership}
                onChange={(e) => setPctOwnership(e.target.value)}
                className={`${modalFieldClass} pr-9`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                %
              </span>
            </div>
          </Field>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add property'}
          </Button>
        </div>
      </form>
    </Modal>
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
  children: React.ReactNode
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
  value,
  onChange,
  required,
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  required?: boolean
  invalid?: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
        $
      </span>
      <input
        type="text"
        required={required}
        aria-invalid={invalid || undefined}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className={`${modalFieldClass} pl-7 ${invalid ? 'border-danger-200 focus:border-danger-600' : ''}`}
      />
    </div>
  )
}
