import { useState, type FormEvent } from 'react'
import Modal from '../ui/Modal'
import { formFieldClass as modalFieldClass } from '../ui/formStyles'
import { Button } from '../ui/Button'
import { parseMoney } from '../../lib/money'
import {
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  createPfsRecord,
  updatePfsRecord,
  type AssetCategory,
  type LiabilityCategory,
  type ExpenseCategory,
  type PfsRecordKind,
  type Asset,
  type Liability,
  type IncomeSource,
  type Expense,
} from '../../lib/pfs'

export type ExistingRecord =
  | ({ kind: 'asset' } & Asset)
  | ({ kind: 'liability' } & Liability)
  | ({ kind: 'income' } & IncomeSource)
  | ({ kind: 'expense' } & Expense)

type Props = {
  open: boolean
  onClose: () => void
  /** Returns a promise so the modal can keep its saving state until the
   *  parent's refetch completes — avoids a flash of stale list after save. */
  onSaved: () => void | Promise<void>
  kind: PfsRecordKind
  existing?: ExistingRecord
}

/** Debts (secured liabilities + unsecured expenses) carry a balance plus an
 *  optional rate and monthly payment. Income/assets are a single amount. */
const isDebt = (kind: PfsRecordKind) => kind === 'liability' || kind === 'expense'

const kindLabels: Record<PfsRecordKind, { title: string; amount: string }> = {
  asset: { title: 'asset', amount: 'Value' },
  liability: { title: 'secured debt', amount: 'Balance' },
  income: { title: 'income source', amount: 'Monthly amount' },
  expense: { title: 'unsecured debt', amount: 'Balance' },
}

export default function PfsRecordModal({ open, onClose, onSaved, kind, existing }: Props) {
  const labels = kindLabels[kind]
  const isEdit = !!existing

  const initial = initialFormState(kind, existing)
  const [label, setLabel] = useState(initial.label)
  const [amount, setAmount] = useState(initial.amount)
  const [category, setCategory] = useState(initial.category)
  const [rate, setRate] = useState(initial.rate)
  const [monthlyPayment, setMonthlyPayment] = useState(initial.monthlyPayment)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ amount?: string; rate?: string; monthlyPayment?: string }>({})
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const amountNum = parseMoney(amount)
    const errs: { amount?: string; rate?: string; monthlyPayment?: string } = {}
    if (amountNum === null || amountNum <= 0) {
      errs.amount = 'Enter an amount greater than $0.'
    }
    const rateNum = rate.trim() === '' ? undefined : Number(rate)
    if (rate.trim() !== '' && (rateNum === undefined || !Number.isFinite(rateNum) || rateNum < 0)) {
      errs.rate = 'Rate must be a positive number (e.g. 6.5 for 6.5%).'
    }
    const paymentNum = monthlyPayment.trim() === '' ? null : parseMoney(monthlyPayment)
    if (monthlyPayment.trim() !== '' && (paymentNum === null || paymentNum < 0)) {
      errs.monthlyPayment = 'Enter a valid monthly payment, or leave it blank.'
    }
    if (Object.keys(errs).length > 0 || amountNum === null) {
      setFieldErrors(errs)
      return
    }

    setSaving(true)
    try {
      const input =
        kind === 'asset'
          ? { kind, label, category: category as AssetCategory, amount: amountNum }
          : kind === 'liability'
            ? {
                kind,
                label,
                category: category as LiabilityCategory,
                amount: amountNum,
                rate: rateNum,
                monthlyPayment: paymentNum,
              }
            : kind === 'income'
              ? { kind, label, amount: amountNum }
              : {
                  kind,
                  label,
                  category: category as ExpenseCategory,
                  amount: amountNum,
                  rate: rateNum,
                  monthlyPayment: paymentNum,
                }

      if (existing) await updatePfsRecord(existing.id, input)
      else await createPfsRecord(input)

      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const categoryOptions = categoryOptionsFor(kind)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${isEdit ? 'Edit' : 'Add'} ${labels.title}`}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Label">
          <input
            type="text"
            required
            maxLength={120}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={placeholderFor(kind)}
            className={modalFieldClass}
          />
        </Field>

        {categoryOptions && (
          <Field label="Category">
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={modalFieldClass}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field
          label={labels.amount}
          hint={isDebt(kind) ? 'The amount you currently owe. Counts toward net worth.' : undefined}
          error={fieldErrors.amount}
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
              $
            </span>
            <input
              type="text"
              required
              aria-invalid={fieldErrors.amount ? true : undefined}
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`${modalFieldClass} pl-7 ${fieldErrors.amount ? 'border-danger-200 focus:border-danger-600' : ''}`}
            />
          </div>
        </Field>

        {isDebt(kind) && (
          <>
            <Field
              label="Monthly payment (optional)"
              hint="Your recurring payment. Used in the cash-flow / discretionary-income view."
              error={fieldErrors.monthlyPayment}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                  $
                </span>
                <input
                  type="text"
                  aria-invalid={fieldErrors.monthlyPayment ? true : undefined}
                  inputMode="decimal"
                  autoComplete="off"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value)}
                  placeholder="0.00"
                  className={`${modalFieldClass} pl-7 ${fieldErrors.monthlyPayment ? 'border-danger-200 focus:border-danger-600' : ''}`}
                />
              </div>
            </Field>

            <Field
              label="Interest rate (optional)"
              hint="Annual rate (e.g. 6.5 for 6.5%). Shown as APR alongside the balance."
              error={fieldErrors.rate}
            >
              <div className="relative">
                <input
                  type="number"
                  aria-invalid={fieldErrors.rate ? true : undefined}
                  inputMode="decimal"
                  step="0.001"
                  min="0"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="6.5"
                  className={`${modalFieldClass} pr-9 ${fieldErrors.rate ? 'border-danger-200 focus:border-danger-600' : ''}`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                  %
                </span>
              </div>
            </Field>
          </>
        )}

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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add'}
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

function defaultCategory(kind: PfsRecordKind): string {
  switch (kind) {
    case 'asset':
      return 'real_estate'
    case 'liability':
      return 'auto_loan'
    case 'expense':
      return 'credit_card'
    case 'income':
      return ''
  }
}

function initialFormState(
  kind: PfsRecordKind,
  existing: ExistingRecord | undefined,
): { label: string; amount: string; category: string; rate: string; monthlyPayment: string } {
  if (!existing) {
    return { label: '', amount: '', category: defaultCategory(kind), rate: '', monthlyPayment: '' }
  }
  if (existing.kind === 'asset') {
    return { label: existing.label, amount: String(existing.value), category: existing.category, rate: '', monthlyPayment: '' }
  }
  if (existing.kind === 'liability') {
    return {
      label: existing.label,
      amount: String(existing.balance),
      category: existing.category,
      rate: existing.rate != null ? String(existing.rate) : '',
      monthlyPayment: existing.monthlyPayment != null ? String(existing.monthlyPayment) : '',
    }
  }
  if (existing.kind === 'income') {
    return { label: existing.label, amount: String(existing.monthly), category: '', rate: '', monthlyPayment: '' }
  }
  return {
    label: existing.label,
    amount: String(existing.balance),
    category: existing.category,
    rate: existing.rate != null ? String(existing.rate) : '',
    monthlyPayment: existing.monthlyPayment != null ? String(existing.monthlyPayment) : '',
  }
}

function placeholderFor(kind: PfsRecordKind): string {
  switch (kind) {
    case 'asset':
      return 'Primary residence'
    case 'liability':
      return 'Auto loan — Honda'
    case 'income':
      return 'Salary'
    case 'expense':
      return 'Visa card'
  }
}

function categoryOptionsFor(
  kind: PfsRecordKind,
): { value: string; label: string }[] | null {
  if (kind === 'asset') {
    return Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
  }
  if (kind === 'liability') {
    return Object.entries(LIABILITY_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
  }
  if (kind === 'expense') {
    return Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))
  }
  return null
}
