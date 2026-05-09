import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Mail, Lock, User, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthModal, type AuthView } from '../lib/authModal'
import { useAuth } from '../lib/auth'
import { BRAND } from '../config/brand'
import { Button } from './ui/Button'

export default function AuthModal() {
  const { open, view, openModal, closeModal } = useAuthModal()
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
  const { signIn } = useAuth()
  const { closeModal } = useAuthModal()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn({ email, password })
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    closeModal()
    navigate('/app/dashboard')
  }

  return (
    <>
      <h2 id="auth-modal-title" className="font-display text-xl font-semibold text-surface-900">
        Welcome back
      </h2>
      <p className="mt-1 text-sm text-surface-500">
        Sign in to your {BRAND.name} account.
      </p>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <Field label="Email" icon={Mail}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldClass}
          />
        </Field>
        <Field label="Password" icon={Lock}>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </Field>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </>
  )
}

function SignupPanel() {
  const { signUp } = useAuth()
  const { closeModal } = useAuthModal()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error, needsConfirmation } = await signUp({ email, password, fullName })
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (needsConfirmation) {
      setConfirmationEmail(email)
      return
    }
    closeModal()
    navigate('/app/dashboard')
  }

  if (confirmationEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-100 text-accent-600">
          <CheckCircle2 size={24} />
        </div>
        <h2 id="auth-modal-title" className="mt-4 font-display text-xl font-semibold text-surface-900">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-surface-500">
          We sent a confirmation link to <strong className="text-surface-900">{confirmationEmail}</strong>.
          Click it to activate your account.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={closeModal}
          className="mt-5 w-full"
        >
          Got it
        </Button>
      </div>
    )
  }

  return (
    <>
      <h2 id="auth-modal-title" className="font-display text-xl font-semibold text-surface-900">
        Create your account
      </h2>
      <p className="mt-1 text-sm text-surface-500">
        Free to start. No card required.
      </p>

      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <Field label="Full name" icon={User}>
          <input
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className={fieldClass}
          />
        </Field>
        <Field label="Email" icon={Mail}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={fieldClass}
          />
        </Field>
        <Field label="Password" icon={Lock}>
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={fieldClass}
          />
        </Field>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </>
  )
}

function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </div>
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

export function AuthModalRedirect({ view }: { view: AuthView }) {
  const { openModal } = useAuthModal()
  const navigate = useNavigate()
  useEffect(() => {
    openModal(view)
    navigate('/', { replace: true })
  }, [view, openModal, navigate])
  return null
}
