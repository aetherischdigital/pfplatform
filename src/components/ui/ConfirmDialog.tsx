import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import { Button } from './Button'

type Variant = 'danger' | 'default'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex items-start gap-3">
        {variant === 'danger' && (
          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-danger-50 text-danger-600">
            <AlertTriangle size={18} />
          </div>
        )}
        <p className="text-sm leading-relaxed text-surface-600">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="md"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
