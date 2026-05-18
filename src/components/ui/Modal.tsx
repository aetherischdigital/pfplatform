import { useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useModalDismiss } from '../../lib/useModalDismiss'

type Props = {
  open: boolean
  onClose: () => void
  /** Visible heading. Omit when the dialog manages its own header (e.g. AuthModal tab bar). */
  title?: string
  titleId?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export default function Modal({ open, onClose, title, titleId, children, size = 'md' }: Props) {
  const generatedId = useId()
  const resolvedTitleId = titleId ?? generatedId
  const cardRef = useRef<HTMLDivElement>(null)

  useModalDismiss(open, onClose, cardRef)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-surface-900/60 px-4 py-10 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        tabIndex={-1}
        className={`relative w-full ${sizeClass[size]} rounded-2xl border border-surface-200 bg-white p-7 shadow-card-lg sm:p-8`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        {title && (
          <h2 id={resolvedTitleId} className="pr-8 font-display text-xl font-semibold text-surface-900">
            {title}
          </h2>
        )}
        <div className={title ? 'mt-5' : ''}>{children}</div>
      </div>
    </div>
  )
}

