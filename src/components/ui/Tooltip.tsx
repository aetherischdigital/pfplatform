import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type Props = {
  /** The plain-English definition shown in the bubble. */
  content: ReactNode
  /** Inline trigger (the term being defined). Wrapped in a focusable <button>. */
  children: ReactNode
  /**
   * Placement preference. The tooltip flips to the opposite side automatically
   * if there's not enough room. Default 'top'.
   */
  placement?: 'top' | 'bottom'
  /** Optional extra classes on the trigger button. */
  className?: string
}

/**
 * Accessible jargon tooltip — keyboard, mouse, and tap all reveal it. The
 * trigger renders as a dotted-underlined inline button; the bubble is dark
 * moss with cream text (matching the brand primary button) and connects to
 * the trigger via `aria-describedby` for screen readers.
 *
 * Always-visible to touch users: tap toggles. Esc dismisses regardless of
 * how it was opened.
 */
export default function Tooltip({
  content,
  children,
  placement = 'top',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [actualPlacement, setActualPlacement] = useState(placement)
  const tooltipId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Auto-flip placement if the preferred side would overflow the viewport.
  useEffect(() => {
    if (!open || !triggerRef.current || !bubbleRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const bubbleRect = bubbleRef.current.getBoundingClientRect()
    const margin = 12

    if (placement === 'top' && triggerRect.top - bubbleRect.height - margin < 0) {
      setActualPlacement('bottom')
    } else if (
      placement === 'bottom' &&
      triggerRect.bottom + bubbleRect.height + margin > window.innerHeight
    ) {
      setActualPlacement('top')
    } else {
      setActualPlacement(placement)
    }
  }, [open, placement])

  // Esc to dismiss + close on outside click for touch users.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.blur()
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        bubbleRef.current?.contains(e.target as Node)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className={`cursor-help rounded underline decoration-dotted decoration-surface-400 underline-offset-2 transition-colors hover:decoration-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 ${className}`}
      >
        {children}
      </button>
      {open && (
        <span
          ref={bubbleRef}
          role="tooltip"
          id={tooltipId}
          className={`pointer-events-none absolute left-1/2 z-30 w-64 -translate-x-1/2 rounded-lg bg-surface-900 px-3 py-2 text-xs font-normal leading-relaxed text-surface-50 shadow-card-lg animate-fade-in ${
            actualPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {content}
        </span>
      )}
    </span>
  )
}
