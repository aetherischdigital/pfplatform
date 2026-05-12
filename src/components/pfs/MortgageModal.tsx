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
  const [saving, setSaving] = useState(false)

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

    if (
      !Number.isFinite(input.startingHomeValue) ||
      !Number.isFinite(input.balance) ||
      !Number.isFinite(input.ratePct) ||
      !Number.isInteger(input.termMonthsRemaining) ||
      !Number.isFinite(input.monthlyPayment) ||
      !Number.isFinite(input.extraPrincipal)
    ) {
      setError('All numeric fields must be valid numbers.')
      return
    }
    if (input.termMonthsRemaining <= 0 || input.termMonthsRemaining > 600) {
      setError('Term must be between 1 and 600 months.')
      return
    }
    if (input.ratePct < 0 || input.ratePct > 100) {
      setError('Rate must be between 0 and 100 percent.')
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
          >
            <CurrencyInput value={startingHomeValue} onChange={setStartingHomeValue} required />
          </Field>
          <Field
            label="Current balance"
            hint="Today's principal balance, straight from your latest statement."
          >
            <CurrencyInput value={balance} onChange={setBalance} required />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Interest rate" hint="Your loan's annual rate (e.g. 6.5 for 6.5%).">
            <div className="relative">
              <input
                type="number"
                required
                inputMode="decimal"
                step="0.001"
                min="0"
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
                placeholder="6.5"
                className={`${modalFieldClass} pr-9`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                %
              </span>
            </div>
          </Field>
          <Field
            label="Months remaining"
            hint="How many scheduled payments are left (e.g. 336 for 28 years left on a 30-year loan)."
          >
            <input
              type="number"
              required
              inputMode="numeric"
              step="1"
              min="1"
              max="600"
              value={termMonthsRemaining}
              onChange={(e) => setTermMonthsRemaining(e.target.value)}
              placeholder="336"
              className={modalFieldClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Monthly P&amp;I payment"
            hint="Principal & interest only — the loan-payment portion of your monthly bill. Skip taxes and insurance."
          >
            <CurrencyInput value={monthlyPayment} onChange={setMonthlyPayment} required />
          </Field>
          <Field
            label="Extra principal / mo"
            hint="Optional. Extra principal you send each month to accelerate the payoff."
          >
            <CurrencyInput value={extraPrincipal} onChange={setExtraPrincipal} />
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
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-surface-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-surface-500">{hint}</p>}
    </label>
  )
}

function CurrencyInput({
  value,
  onChange,
  required,
}: {
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
        $
      </span>
      <input
        type="number"
        required={required}
        inputMode="decimal"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className={`${modalFieldClass} pl-7`}
      />
    </div>
  )
}
