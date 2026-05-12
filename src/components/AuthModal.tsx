import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthModal, type AuthView } from '../lib/useAuthModal'
import { useAuth } from '../lib/useAuth'
import { fetchOwnProfile, homePathFor, type WaitlistInterest } from '../lib/profile'
import { BRAND } from '../config/brand'
import Modal from './ui/Modal'
import { Button } from './ui/Button'
import { formFieldClass, formFieldWithIconClass } from './ui/formStyles'

export default function AuthModal() {
  const { open, view, openModal, closeModal } = useAuthModal()

  return (
    <Modal open={open} onClose={closeModal} titleId="auth-modal-title">
      {view !== 'forgot' && (
        <div className="flex gap-1 rounded-lg bg-surface-100 p-1">
          <TabButton active={view === 'login'} onClick={() => openModal('login')}>
            Sign in
          </TabButton>
          <TabButton active={view === 'signup'} onClick={() => openModal('signup')}>
            Create account
          </TabButton>
        </div>
      )}

      <div className={view !== 'forgot' ? 'mt-6' : ''}>
        {view === 'login' ? (
          <LoginPanel />
        ) : view === 'signup' ? (
          <SignupPanel />
        ) : (
          <ForgotPanel />
        )}
      </div>
    </Modal>
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
  const { closeModal, openModal } = useAuthModal()
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
    if (error) {
      setSubmitting(false)
      setError(error)
      return
    }
    // Fetch profile inline so we can route by role on first login (the
    // AuthProvider's profile state may not be hydrated yet).
    const profile = await fetchOwnProfile().catch(() => null)
    setSubmitting(false)
    closeModal()
    navigate(homePathFor(profile?.role))
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
            className={formFieldWithIconClass}
          />
        </Field>
        <Field label="Password" icon={Lock}>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={formFieldWithIconClass}
          />
        </Field>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => openModal('forgot')}
            className="rounded text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
          >
            Forgot password?
          </button>
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </>
  )
}

function ForgotPanel() {
  const { requestPasswordReset } = useAuth()
  const { openModal } = useAuthModal()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await requestPasswordReset(email)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-100 text-accent-600">
          <CheckCircle2 size={24} />
        </div>
        <h2 id="auth-modal-title" className="mt-4 font-display text-xl font-semibold text-surface-900">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-surface-500">
          If an account exists for <strong className="text-surface-900">{email}</strong>, we sent a
          reset link. Click it to set a new password.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => openModal('login')}
          className="mt-5 w-full"
        >
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <>
      <h2 id="auth-modal-title" className="font-display text-xl font-semibold text-surface-900">
        Reset your password
      </h2>
      <p className="mt-1 text-sm text-surface-500">
        Enter the email tied to your account. We&rsquo;ll send a reset link.
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
            className={formFieldWithIconClass}
          />
        </Field>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="flex flex-col gap-2">
          <Button type="submit" variant="primary" size="md" disabled={submitting} className="w-full">
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
          <button
            type="button"
            onClick={() => openModal('login')}
            className="rounded text-center text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
          >
            Back to sign in
          </button>
        </div>
      </form>
    </>
  )
}

function SignupPanel() {
  const { signUp, resendSignupConfirmation } = useAuth()
  const { closeModal } = useAuthModal()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [waitlistInterest, setWaitlistInterest] = useState<WaitlistInterest>('none')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resendError, setResendError] = useState<string | null>(null)

  const onResend = async () => {
    if (!confirmationEmail) return
    setResendStatus('sending')
    setResendError(null)
    const { error } = await resendSignupConfirmation(confirmationEmail)
    if (error) {
      setResendStatus('error')
      setResendError(error)
    } else {
      setResendStatus('sent')
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error, needsConfirmation } = await signUp({
      email,
      password,
      fullName,
      waitlistInterest,
    })
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    if (needsConfirmation) {
      setConfirmationEmail(email)
      return
    }
    // New signups always start as homeowner (default role) — no need to fetch.
    closeModal()
    navigate(homePathFor('homeowner'))
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
        <div className="mt-5 flex flex-col gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={closeModal}
            className="w-full"
          >
            Got it
          </Button>
          {resendStatus === 'sent' ? (
            <p className="text-xs text-success-700">Sent. Check your inbox again.</p>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={resendStatus === 'sending'}
              className="rounded text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 disabled:opacity-50"
            >
              {resendStatus === 'sending' ? 'Resending…' : "Didn't get it? Resend"}
            </button>
          )}
          {resendError && (
            <p className="text-xs text-danger-700">{resendError}</p>
          )}
        </div>
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
            className={formFieldWithIconClass}
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
            className={formFieldWithIconClass}
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
            className={formFieldWithIconClass}
          />
        </Field>
        <label className="block">
          <span className="text-sm font-medium text-surface-700">
            Interested in a paid tier? <span className="font-normal text-surface-500">(optional)</span>
          </span>
          <select
            value={waitlistInterest}
            onChange={(e) => setWaitlistInterest(e.target.value as WaitlistInterest)}
            className={`${formFieldClass} mt-1`}
          >
            <option value="none">Just the free plan for now</option>
            <option value="plus">Plus — for homeowners with a living plan</option>
            <option value="pro">Pro — for realtors managing clients</option>
          </select>
          <p className="mt-1 text-xs text-surface-500">
            Pricing is TBD — we&rsquo;ll email you the moment your tier goes live.
          </p>
        </label>
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
    <div role="alert" className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
      {children}
    </div>
  )
}

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
