import { useState, type FormEvent } from 'react'
import Modal from '../ui/Modal'
import { formFieldClass as modalFieldClass } from '../ui/formStyles'
import { Button } from '../ui/Button'
import { parseMoney } from '../../lib/money'
import {
  LIVING_EXPENSE_CATEGORY_LABELS,
  createLivingExpense,
  updateLivingExpense,
  type LivingExpense,
  type LivingExpenseCategory,
} from '../../lib/pfs'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void | Promise<void>
  existing?: LivingExpense | null
}

export default function LivingExpenseModal({ open, onClose, onSaved, existing }: Props) {
  const isEdit = !!existing
  const [label, setLabel] = useState(existing?.label ?? '')
  const [category, setCategory] = useState<string>(existing?.category ?? 'housing')
  const [amount, setAmount] = useState(existing ? String(existing.monthlyAmount) : '')
  const [error, setError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setAmountError(null)
    const amountNum = parseMoney(amount)
    if (amountNum === null || amountNum <= 0) {
      setAmountError('Enter an amount greater than $0.')
      return
    }
    setSaving(true)
    try {
      const input = {
        label,
        category: category as LivingExpenseCategory,
        monthlyAmount: amountNum,
      }
      if (existing) await updateLivingExpense(existing.id, input)
      else await createLivingExpense(input)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`${isEdit ? 'Edit' : 'Add'} household expense`}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-surface-700">Label</span>
          <input
            type="text"
            required
            maxLength={120}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Auto insurance"
            className={`mt-1 ${modalFieldClass}`}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-surface-700">Category</span>
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`mt-1 ${modalFieldClass}`}
          >
            {Object.entries(LIVING_EXPENSE_CATEGORY_LABELS).map(([value, lbl]) => (
              <option key={value} value={value}>
                {lbl}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-surface-700">Monthly amount</span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
              $
            </span>
            <input
              type="text"
              required
              inputMode="decimal"
              autoComplete="off"
              aria-invalid={amountError ? true : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`${modalFieldClass} pl-7 ${amountError ? 'border-danger-200 focus:border-danger-600' : ''}`}
            />
          </div>
          {amountError && <p className="mt-1 text-xs font-medium text-danger-700">{amountError}</p>}
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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
