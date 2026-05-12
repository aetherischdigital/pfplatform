import { useState, type FormEvent } from 'react'
import Modal from '../ui/Modal'
import { formFieldClass as modalFieldClass } from '../ui/formStyles'
import { Button } from '../ui/Button'
import { upsertMortgage, type Mortgage, type MortgageInput } from '../../lib/pfs'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  existing?: Mortgage | null
}

export default function MortgageModal({ open, onClose, onSaved, existing }: Props) {
  const isEdit = !!existing

  const [propertyLabel, setPropertyLabel] = useState(existing?.propertyLabel ?? 'Primary residence')
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
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    startingHomeValue?: string
    balance?: string
    ratePct?: string
    termMonthsRemaining?: string
    monthlyPayment?: string
    extraPrincipal?: string
  }>({})
  const [saving, setSaving] = useState(false)

  const validate = (input: MortgageInput): typeof fieldErrors => {
    const errs: typeof fieldErrors = {}
    if (!Number.isFinite(input.startingHomeValue))
      errs.startingHomeValue = 'Enter a number.'
    if (!Number.isFinite(input.balance)) errs.balance = 'Enter a number.'
    if (!Number.isFinite(input.monthlyPayment))
      errs.monthlyPayment = 'Enter a number.'
    if (!Number.isFinite(input.extraPrincipal))
      errs.extraPrincipal = 'Enter a number.'
    if (!Number.isFinite(input.ratePct)) {
      errs.ratePct = 'Enter a number.'
    } else if (input.ratePct < 0 || input.ratePct > 100) {
      errs.ratePct = 'Must be between 0 and 100.'
    }
    if (!Number.isInteger(input.termMonthsRemaining)) {
      errs.termMonthsRemaining = 'Enter a whole number.'
    } else if (input.termMonthsRemaining <= 0 || input.termMonthsRemaining > 600) {
      errs.termMonthsRemaining = 'Must be between 1 and 600.'
    }
    return errs
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const input: MortgageInput = {
      propertyLabel,
      startingHomeValue: Number(startingHomeValue),
      balance: Number(balance),
      ratePct: Number(ratePct),
      termMonthsRemaining: Number(termMonthsRemaining),
      monthlyPayment: Number(monthlyPayment),
      extraPrincipal: Number(extraPrincipal || '0'),
    }

    const errs = validate(input)
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) {
      setError('Some fields need attention.')
      return
    }

    setSaving(true)
    try {
      await upsertMortgage(input, existing?.id)
      onSaved()
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
        type="number"
        required={required}
        aria-invalid={invalid || undefined}
        inputMode="decimal"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className={`${modalFieldClass} pl-7 ${invalid ? 'border-danger-200 focus:border-danger-600' : ''}`}
      />
    </div>
  )
}
