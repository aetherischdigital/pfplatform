import { useState, type FormEvent } from 'react'
import Modal from '../ui/Modal'
import { formFieldClass } from '../ui/formStyles'
import { Button } from '../ui/Button'
import {
  createContingentLiability,
  updateContingentLiability,
  CONTINGENT_TYPE_LABELS,
  type ContingentLiability,
  type ContingentLiabilityInput,
  type ContingentLiabilityType,
} from '../../lib/contingentLiabilities'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void | Promise<void>
  existing?: ContingentLiability | null
}

export default function ContingentLiabilityModal({
  open,
  onClose,
  onSaved,
  existing,
}: Props) {
  const isEdit = !!existing

  const [type, setType] = useState<ContingentLiabilityType>(
    existing?.type ?? 'endorser_guarantor',
  )
  const [description, setDescription] = useState(existing?.description ?? '')
  const [estimatedAmount, setEstimatedAmount] = useState(
    existing?.estimatedAmount != null ? String(existing.estimatedAmount) : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = description.trim()
    if (trimmed.length === 0) {
      setError('Description is required.')
      return
    }
    const input: ContingentLiabilityInput = {
      type,
      description: trimmed,
      estimatedAmount:
        estimatedAmount.trim() === '' ? null : Math.max(0, Number(estimatedAmount)),
    }
    setSaving(true)
    try {
      if (existing) await updateContingentLiability(existing.id, input)
      else await createContingentLiability(input)
      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${isEdit ? 'Edit' : 'Add'} contingent liability`}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ContingentLiabilityType)}
            className={formFieldClass}
          >
            {(Object.keys(CONTINGENT_TYPE_LABELS) as ContingentLiabilityType[]).map((k) => (
              <option key={k} value={k}>
                {CONTINGENT_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Description" required hint="A line or two — what is this and to whom?">
          <textarea
            required
            maxLength={500}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Guarantor on sister's small business loan with Wells Fargo, ~$45k outstanding."
            className={`${formFieldClass} resize-y`}
          />
        </Field>

        <Field
          label="Estimated amount"
          hint="Optional. Blank if you don't have a number."
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="100"
              min="0"
              value={estimatedAmount}
              onChange={(e) => setEstimatedAmount(e.target.value)}
              placeholder="0"
              className={`${formFieldClass} pl-7`}
            />
          </div>
        </Field>

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
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-surface-700">
        {label}
        {required && <span className="ml-1 text-danger-600">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-surface-500">{hint}</p>}
    </label>
  )
}
