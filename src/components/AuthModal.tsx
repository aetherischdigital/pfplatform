import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuthModal, type AuthView } from '../lib/authModal'
import { BRAND } from '../config/brand'
import { Button } from './ui/Button'

export default function AuthModal() {
  const { open, view, openModal, closeModal } = useAuthModal()
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    lastFocusedRef.current = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    queueMicrotask(() => {
      const firstInput = cardRef.current?.querySelector<HTMLElement>('input, button')
      firstInput?.focus()
    })

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      lastFocusedRef.current?.focus()
    }
  }, [open, closeModal])

  if (!open) return null

  const goToDemo = () => {
    closeModal()
    navigate('/app/dashboard')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-surface-900/60 px-4 py-10 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal()
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-surface-200 bg-white p-7 shadow-card-lg sm:p-8"
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-3 top-3 rounded-md p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex gap-1 rounded-lg bg-surface-100 p-1">
          <TabButton active={view === 'login'} onClick={() => openModal('login')}>
            Sign in
          </TabButton>
          <TabButton active={view === 'signup'} onClick={() => openModal('signup')}>
            Create account
          </TabButton>
        </div>

        <div className="mt-6">
          {view === 'login' ? <LoginPanel /> : <SignupPanel />}
        </div>

        <div className="mt-5 flex items-center gap-3 text-xs text-surface-400">
          <div className="h-px flex-1 bg-surface-200" />
          <span>Auth wires up next</span>
          <div className="h-px flex-1 bg-surface-200" />
        </div>

        <div className="mt-4 rounded-xl border border-accent-200 bg-accent-100 p-4">
          <div className="text-sm font-medium text-surface-900">Skip ahead</div>
          <p className="mt-1 text-xs text-surface-600">
            Auth isn't wired yet. Jump into the dashboard with sample data.
          </p>
          <Button
            type="button"
            onClick={goToDemo}
            variant="primary"
            size="sm"
            className="mt-3 w-full"
          >
            View demo dashboard <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-surface-900 shadow-card'
          : 'text-surface-500 hover:text-surface-900'
      }`}
    >
      {children}
    </button>
  )
}

function LoginPanel() {
  return (
    <>
      <h2 id="auth-modal-title" className="font-display text-xl font-semibold text-surface-900">
        Welcome back
      </h2>
      <p className="mt-1 text-sm text-surface-500">
        Sign in to your {BRAND.name} account.
      </p>

      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Email" icon={Mail}>
          <input
            type="email"
            disabled
            placeholder="you@example.com"
            className={fieldClass}
          />
        </Field>
        <Field label="Password" icon={Lock}>
          <input type="password" disabled className={fieldClass} />
        </Field>
        <Button type="submit" variant="primary" size="md" disabled className="w-full">
          Sign in
        </Button>
      </form>
    </>
  )
}

function SignupPanel() {
  return (
    <>
      <h2 id="auth-modal-title" className="font-display text-xl font-semibold text-surface-900">
        Create your account
      </h2>
      <p className="mt-1 text-sm text-surface-500">
        Free to start. No card required.
      </p>

      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Full name" icon={User}>
          <input type="text" disabled placeholder="Your name" className={fieldClass} />
        </Field>
        <Field label="Email" icon={Mail}>
          <input
            type="email"
            disabled
            placeholder="you@example.com"
            className={fieldClass}
          />
        </Field>
        <Field label="Password" icon={Lock}>
          <input
            type="password"
            disabled
            placeholder="At least 8 characters"
            className={fieldClass}
          />
        </Field>
        <Button type="submit" variant="primary" size="md" disabled className="w-full">
          Create account
        </Button>
      </form>
    </>
  )
}

const fieldClass =
  'w-full rounded-md border border-surface-200 bg-surface-50 py-2.5 pl-9 pr-3 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white'

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-surface-700">{label}</span>
      <div className="relative mt-1">
        <Icon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
        />
        {children}
      </div>
    </label>
  )
}

/**
 * Helper component used by /login and /signup routes to redirect to / and
 * pop the modal — keeps deep-links and old CTAs working without the
 * separate auth screen.
 */
export function AuthModalRedirect({ view }: { view: AuthView }) {
  const { openModal } = useAuthModal()
  const navigate = useNavigate()
  useEffect(() => {
    openModal(view)
    navigate('/', { replace: true })
  }, [view, openModal, navigate])
  return null
}
