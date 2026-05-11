import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  titleId?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export default function Modal({ open, onClose, title, titleId = 'modal-title', children, size = 'md' }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    lastFocusedRef.current = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    queueMicrotask(() => {
      const firstInput = cardRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button',
      )
      firstInput?.focus()
    })

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      lastFocusedRef.current?.focus()
    }
  }, [open, onClose])

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
        aria-labelledby={titleId}
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
        <h2 id={titleId} className="pr-8 font-display text-xl font-semibold text-surface-900">
          {title}
        </h2>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export const modalFieldClass =
  'w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white'
