import { useState, type FormEvent } from 'react'
import Modal from '../ui/Modal'
import { formFieldClass } from '../ui/formStyles'
import { Button } from '../ui/Button'
import {
  createBusinessVenture,
  updateBusinessVenture,
  type BusinessVenture,
  type BusinessVentureInput,
} from '../../lib/businessVentures'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void | Promise<void>
  existing?: BusinessVenture | null
}

export default function BusinessVentureModal({ open, onClose, onSaved, existing }: Props) {
  const isEdit = !!existing

  const [name, setName] = useState(existing?.name ?? '')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [pctOwnership, setPctOwnership] = useState(
    existing?.pctOwnership != null ? String(existing.pctOwnership) : '',
  )
  const [positionTitle, setPositionTitle] = useState(existing?.positionTitle ?? '')
  const [businessAssets, setBusinessAssets] = useState(
    existing?.businessAssets != null ? String(existing.businessAssets) : '',
  )
  const [lineOfBusiness, setLineOfBusiness] = useState(existing?.lineOfBusiness ?? '')
  const [yearsInBusiness, setYearsInBusiness] = useState(
    existing?.yearsInBusiness != null ? String(existing.yearsInBusiness) : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseOptionalNum = (s: string): number | null =>
    s.trim() === '' ? null : Number(s)
  const parseOptionalText = (s: string): string | null =>
    s.trim() === '' ? null : s.trim()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const input: BusinessVentureInput = {
      name: name.trim(),
      address: parseOptionalText(address),
      pctOwnership: parseOptionalNum(pctOwnership),
      positionTitle: parseOptionalText(positionTitle),
      businessAssets: parseOptionalNum(businessAssets),
      lineOfBusiness: parseOptionalText(lineOfBusiness),
      yearsInBusiness:
        yearsInBusiness.trim() === '' ? null : Math.max(0, Math.round(Number(yearsInBusiness))),
    }
    if (input.name.length === 0) {
      setError('Name is required.')
      return
    }
    setSaving(true)
    try {
      if (existing) await updateBusinessVenture(existing.id, input)
      else await createBusinessVenture(input)
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
      title={`${isEdit ? 'Edit' : 'Add'} business venture`}
      size="lg"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Name" required>
          <input
            type="text"
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ACME LLC"
            className={formFieldClass}
          />
        </Field>

        <Field label="Address">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Optional"
            className={formFieldClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Line of business" hint="e.g. Real estate, Consulting">
            <input
              type="text"
              value={lineOfBusiness}
              onChange={(e) => setLineOfBusiness(e.target.value)}
              className={formFieldClass}
            />
          </Field>
          <Field label="Your position / title" hint="e.g. Principal, Partner">
            <input
              type="text"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
              className={formFieldClass}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="% ownership">
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                max="100"
                value={pctOwnership}
                onChange={(e) => setPctOwnership(e.target.value)}
                placeholder="50"
                className={`${formFieldClass} pr-9`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                %
              </span>
            </div>
          </Field>
          <Field label="Years in business">
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              max="200"
              value={yearsInBusiness}
              onChange={(e) => setYearsInBusiness(e.target.value)}
              className={formFieldClass}
            />
          </Field>
          <Field label="Total business assets" hint="Best estimate.">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="1000"
                min="0"
                value={businessAssets}
                onChange={(e) => setBusinessAssets(e.target.value)}
                placeholder="0"
                className={`${formFieldClass} pl-7`}
              />
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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add venture'}
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
