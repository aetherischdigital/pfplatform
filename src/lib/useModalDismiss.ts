import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Shared modal-dismiss hook. While `open` is true:
 *   - Escape closes the modal
 *   - Tab cycles focus inside `containerRef`
 *   - body scroll is locked
 *   - the first focusable element gets initial focus
 *   - prior focus is restored when the modal closes
 *
 * The caller still renders the dialog markup; this hook only wires up the
 * keyboard + focus behavior that's identical across every modal we ship.
 */
export function useModalDismiss(
  open: boolean,
  onClose: () => void,
  containerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return

    const lastFocused = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !containerRef.current) return
      const focusables = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null)
      if (focusables.length === 0) {
        e.preventDefault()
        containerRef.current.focus()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && (active === first || !containerRef.current.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !containerRef.current.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    queueMicrotask(() => {
      // Prefer first form field over buttons — the close (X) button is first in
      // DOM order on every modal, but screen readers announcing "Close, button"
      // on every open is worse than landing on the email input.
      const field = containerRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea',
      )
      const fallback = containerRef.current?.querySelector<HTMLElement>('button:not([aria-label="Close"])')
      const target = field ?? fallback ?? containerRef.current
      target?.focus()
    })

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      lastFocused?.focus()
    }
  }, [open, onClose, containerRef])
}
