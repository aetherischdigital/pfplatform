import { useState, type FormEvent } from 'react'
import Modal from '../ui/Modal'
import { formFieldClass as modalFieldClass } from '../ui/formStyles'
import { Button } from '../ui/Button'
import { upsertMortgage, type Mortgage, type MortgageInput } from '../../lib/pfs'
import { formatUSD } from '../../lib/mortgage'
import { parseMoney } from '../../lib/money'

type Props = {
  open: boolean
  onClose: () => void
  /** Returns a promise so the modal can keep its saving state until the
   *  parent's refetch completes — avoids a flash of stale UI after save. */
  onSaved: () => void | Promise<void>
  existing?: Mortgage | null
  /** When creating a new mortgage, whether to default the "primary" toggle on.
   *  Parent passes false when a primary already exists, so we don't violate
   *  the partial unique index on commit. */
  defaultIsPrimary?: boolean
}

export default function MortgageModal({
  open,
  onClose,
  onSaved,
  existing,
  defaultIsPrimary = true,
}: Props) {
  const isEdit = !!existing

  const [propertyLabel, setPropertyLabel] = useState(
    existing?.propertyLabel ?? 'Primary residence',
  )
  const [startingHomeValue, setStartingHomeValue] = useState(
    existing ? String(existing.startingHomeValue) : '',
  )
  const [balance, setBalance] = useState(existing ? String(existing.balance) : '')
  const [ratePct, setRatePct] = useState(existing ? String(existing.ratePct) : '')
  const [termMonthsRemaining, setTermMonthsRemaining] = useState(
    existing ? String(existing.termMonthsRemaining) : '',
  )
  const [monthlyPayment, setMonthlyPayment] = useState(
    existing ? String(existing.monthlyPayment) : '',
  )
  const [extraPrincipal, setExtraPrincipal] = useState(
    existing ? String(existing.extraPrincipal) : '0',
  )
  // PITI extras. Persisted as nullable in the DB; the UI surfaces empty as null
  // so we never silently fabricate "$0 of property tax" for users who haven't
  // looked it up yet.
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(
    existing?.propertyTaxAnnual != null ? String(existing.propertyTaxAnnual) : '',
  )
  const [homeownersInsuranceAnnual, setHomeownersInsuranceAnnual] = useState(
    existing?.homeownersInsuranceAnnual != null ? String(existing.homeownersInsuranceAnnual) : '',
  )
  const [hoaMonthly, setHoaMonthly] = useState(
    existing?.hoaMonthly != null ? String(existing.hoaMonthly) : '',
  )
  const [floodInsuranceAnnual, setFloodInsuranceAnnual] = useState(
    existing?.floodInsuranceAnnual != null ? String(existing.floodInsuranceAnnual) : '',
  )
  const [pmiMipMonthly, setPmiMipMonthly] = useState(
    existing?.pmiMipMonthly != null ? String(existing.pmiMipMonthly) : '',
  )
  const [firstPaymentDate, setFirstPaymentDate] = useState(existing?.firstPaymentDate ?? '')
  // Schedule C extras (overdelivery)
  const [dateAcquired, setDateAcquired] = useState(existing?.dateAcquired ?? '')
  const [originalCost, setOriginalCost] = useState(
    existing?.originalCost != null ? String(existing.originalCost) : '',
  )
  const [pctOwnership, setPctOwnership] = useState(
    existing != null ? String(existing.pctOwnership) : '100',
  )
  const [isPrimary, setIsPrimary] = useState<boolean>(existing?.isPrimary ?? defaultIsPrimary)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    startingHomeValue?: string
    balance?: string
    ratePct?: string
    termMonthsRemaining?: string
    monthlyPayment?: string
    extraPrincipal?: string
    propertyTaxAnnual?: string
    homeownersInsuranceAnnual?: string
    floodInsuranceAnnual?: string
    pmiMipMonthly?: string
    hoaMonthly?: string
  }>({})
  const [saving, setSaving] = useState(false)

  // Money fields are parsed leniently ($, commas ok); a blank field is `null`
  // (not 0) so an empty input is a validation error rather than a silent $0.
  // The optional PITI extras stay null when blank — null means "not entered",
  // never a fabricated $0.
  type Parsed = {
    startingHomeValue: number | null
    balance: number | null
    monthlyPayment: number | null
    extraPrincipal: number
    ratePct: number | null
    termMonthsRemaining: number | null
    propertyTaxAnnual: number | null
    homeownersInsuranceAnnual: number | null
    floodInsuranceAnnual: number | null
    pmiMipMonthly: number | null
    hoaMonthly: number | null
  }

  const validate = (p: Parsed): typeof fieldErrors => {
    const errs: typeof fieldErrors = {}
    if (p.startingHomeValue === null || p.startingHomeValue <= 0)
      errs.startingHomeValue = 'Enter an amount greater than $0.'
    if (p.balance === null || p.balance <= 0)
      errs.balance = 'Enter an amount greater than $0.'
    if (p.monthlyPayment === null || p.monthlyPayment <= 0)
      errs.monthlyPayment = 'Enter an amount greater than $0.'
    if (!Number.isFinite(p.extraPrincipal) || p.extraPrincipal < 0)
      errs.extraPrincipal = 'Enter $0 or more.'
    if (p.ratePct === null || !Number.isFinite(p.ratePct)) {
      errs.ratePct = 'Enter a number.'
    } else if (p.ratePct < 0 || p.ratePct > 100) {
      errs.ratePct = 'Must be between 0 and 100.'
    }
    if (p.termMonthsRemaining === null || !Number.isInteger(p.termMonthsRemaining)) {
      errs.termMonthsRemaining = 'Enter a whole number.'
    } else if (p.termMonthsRemaining <= 0 || p.termMonthsRemaining > 600) {
      errs.termMonthsRemaining = 'Must be between 1 and 600.'
    }
    // Optional PITI extras: blank (null) is fine; a negative number is not.
    if (p.propertyTaxAnnual !== null && p.propertyTaxAnnual < 0)
      errs.propertyTaxAnnual = 'Enter a positive number or leave blank.'
    if (p.homeownersInsuranceAnnual !== null && p.homeownersInsuranceAnnual < 0)
      errs.homeownersInsuranceAnnual = 'Enter a positive number or leave blank.'
    if (p.hoaMonthly !== null && p.hoaMonthly < 0)
      errs.hoaMonthly = 'Enter a positive number or leave blank.'
    if (p.floodInsuranceAnnual !== null && p.floodInsuranceAnnual < 0)
      errs.floodInsuranceAnnual = 'Enter a positive number or leave blank.'
    if (p.pmiMipMonthly !== null && p.pmiMipMonthly < 0)
      errs.pmiMipMonthly = 'Enter a positive number or leave blank.'
    // A payment that doesn't cover the first month's interest never amortizes —
    // the dashboard would otherwise render a blank "—" payoff with no clue why.
    if (
      !errs.balance &&
      !errs.ratePct &&
      !errs.monthlyPayment &&
      !errs.extraPrincipal &&
      p.balance !== null &&
      p.ratePct !== null &&
      p.monthlyPayment !== null
    ) {
      const firstMonthInterest = (p.balance * p.ratePct) / 100 / 12
      if (p.monthlyPayment + p.extraPrincipal <= firstMonthInterest) {
        errs.monthlyPayment = `Payment must exceed the first month's interest (≈ ${formatUSD(firstMonthInterest)}).`
      }
    }
    return errs
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsed: Parsed = {
      startingHomeValue: parseMoney(startingHomeValue),
      balance: parseMoney(balance),
      monthlyPayment: parseMoney(monthlyPayment),
      extraPrincipal: parseMoney(extraPrincipal) ?? 0,
      ratePct: ratePct.trim() === '' ? null : Number(ratePct),
      termMonthsRemaining:
        termMonthsRemaining.trim() === '' ? null : Number(termMonthsRemaining),
      // Optional PITI extras — parseMoney returns null for blank/invalid, which
      // the DB stores as "not entered" rather than a fabricated $0.
      propertyTaxAnnual: parseMoney(propertyTaxAnnual),
      homeownersInsuranceAnnual: parseMoney(homeownersInsuranceAnnual),
      floodInsuranceAnnual: parseMoney(floodInsuranceAnnual),
      pmiMipMonthly: parseMoney(pmiMipMonthly),
      hoaMonthly: parseMoney(hoaMonthly),
    }

    const errs = validate(parsed)
    setFieldErrors(errs)
    if (
      Object.keys(errs).length > 0 ||
      parsed.startingHomeValue === null ||
      parsed.balance === null ||
      parsed.monthlyPayment === null ||
      parsed.ratePct === null ||
      parsed.termMonthsRemaining === null
    ) {
      setError('Some fields need attention.')
      return
    }

    const input: MortgageInput = {
      propertyLabel,
      startingHomeValue: parsed.startingHomeValue,
      balance: parsed.balance,
      ratePct: parsed.ratePct,
      termMonthsRemaining: parsed.termMonthsRemaining,
      firstPaymentDate: firstPaymentDate.trim() === '' ? null : firstPaymentDate,
      monthlyPayment: parsed.monthlyPayment,
      extraPrincipal: parsed.extraPrincipal,
      propertyTaxAnnual: parsed.propertyTaxAnnual,
      homeownersInsuranceAnnual: parsed.homeownersInsuranceAnnual,
      floodInsuranceAnnual: parsed.floodInsuranceAnnual,
      pmiMipMonthly: parsed.pmiMipMonthly,
      hoaMonthly: parsed.hoaMonthly,
      dateAcquired: dateAcquired.trim() === '' ? null : dateAcquired,
      originalCost: parseMoney(originalCost),
      pctOwnership: Math.max(0.01, Math.min(100, Number(pctOwnership) || 100)),
      isPrimary,
    }

    setSaving(true)
    try {
      await upsertMortgage(input, existing?.id)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`${isEdit ? 'Edit' : 'Add'} mortgage`} size="lg">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Property label" hint="How this property is named in your dashboard.">
          <input
            type="text"
            required
            maxLength={120}
            value={propertyLabel}
            onChange={(e) => setPropertyLabel(e.target.value)}
            className={modalFieldClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Starting home value"
            hint="The home's market value at purchase or refinance — anchors the equity projection."
            error={fieldErrors.startingHomeValue}
          >
            <CurrencyInput
              value={startingHomeValue}
              onChange={setStartingHomeValue}
              required
              invalid={!!fieldErrors.startingHomeValue}
            />
          </Field>
          <Field
            label="Current balance"
            hint="Today's principal balance, straight from your latest statement."
            error={fieldErrors.balance}
          >
            <CurrencyInput
              value={balance}
              onChange={setBalance}
              required
              invalid={!!fieldErrors.balance}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Interest rate"
            hint="Your loan's annual rate (e.g. 6.5 for 6.5%)."
            error={fieldErrors.ratePct}
          >
            <div className="relative">
              <input
                type="number"
                required
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
          <Field
            label="Months remaining"
            hint="How many scheduled payments are left (e.g. 336 for 28 years left on a 30-year loan)."
            error={fieldErrors.termMonthsRemaining}
          >
            <input
              type="number"
              required
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
        </div>

        <Field
          label="1st payment date"
          hint="When the first scheduled payment is or was due — anchors the numbered schedule to real dates. Optional."
        >
          <input
            type="date"
            value={firstPaymentDate}
            onChange={(e) => setFirstPaymentDate(e.target.value)}
            className={modalFieldClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Monthly P&amp;I payment"
            hint="Principal & interest only — the loan-payment portion of your monthly bill. Skip taxes and insurance."
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
            hint="Optional. Extra principal you send each month to accelerate the payoff."
            error={fieldErrors.extraPrincipal}
          >
            <CurrencyInput
              value={extraPrincipal}
              onChange={setExtraPrincipal}
              invalid={!!fieldErrors.extraPrincipal}
            />
          </Field>
        </div>

        <div className="border-t border-surface-200 pt-4">
          <h3 className="font-display text-sm font-semibold text-surface-900">
            Property costs (optional)
          </h3>
          <p className="mt-1 text-xs text-surface-500">
            For true PITI math. Leave blank if you&rsquo;re not sure — we&rsquo;ll show just P&amp;I.
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
            hint="Annual premium. Skip if rolled into your mortgage payment escrow."
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
            label="PMI / MIP / mo"
            hint="Monthly mortgage insurance — PMI on conventional, MIP on FHA. Skip once it drops off."
            error={fieldErrors.pmiMipMonthly}
          >
            <CurrencyInput
              value={pmiMipMonthly}
              onChange={setPmiMipMonthly}
              invalid={!!fieldErrors.pmiMipMonthly}
            />
          </Field>
        </div>

        <Field
          label="HOA / mo"
          hint="Monthly HOA, condo, or co-op fees. Zero or blank if none."
          error={fieldErrors.hoaMonthly}
        >
          <CurrencyInput
            value={hoaMonthly}
            onChange={setHoaMonthly}
            invalid={!!fieldErrors.hoaMonthly}
          />
        </Field>

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
          <Field label="Original cost" hint="Purchase price before any appreciation.">
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

        <label className="flex items-start gap-3 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium text-surface-900">Primary residence</span>
            <span className="ml-2 text-xs text-surface-500">
              Drives the dashboard&rsquo;s headline equity and payoff cards. Only one property can be primary.
            </span>
          </span>
        </label>

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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add mortgage'}
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
