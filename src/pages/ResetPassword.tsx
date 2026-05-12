import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react'
import Container from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { homePathFor, updateOwnPassword, type UserRole } from '../lib/profile'

type Phase = 'verifying' | 'ready' | 'no-session' | 'success'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('verifying')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      // Supabase auto-parses the recovery hash and emits PASSWORD_RECOVERY +
      // a session. Give it a tick to settle, then check.
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      setPhase(data.session ? 'ready' : 'no-session')
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPhase('ready')
    })
    void check()
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const errs: typeof fieldErrors = {}
    if (password.length < 8) errs.password = 'Must be at least 8 characters.'
    if (password !== confirmPassword) errs.confirm = 'Passwords don’t match.'
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      await updateOwnPassword(password)
      setPhase('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setSaving(false)
    }
  }

  const goHome = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .maybeSingle<{ role: UserRole }>()
    navigate(homePathFor(data?.role), { replace: true })
  }

  return (
    <Container size="md" className="py-20">
      <div className="mx-auto max-w-md rounded-2xl border border-surface-200 bg-white p-8 shadow-card">
        {phase === 'verifying' && (
          <p className="text-center text-sm text-surface-500">Verifying link…</p>
        )}

        {phase === 'no-session' && (
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-danger-50 text-danger-600">
              <AlertTriangle size={20} />
            </div>
            <h1 className="mt-4 font-display text-xl font-semibold text-surface-900">
              Reset link expired or invalid
            </h1>
            <p className="mt-2 text-sm text-surface-500">
              The link may have already been used or expired. Request a new one from the sign-in
              screen.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate('/', { replace: true })}
              className="mt-5 w-full"
            >
              Back to home
            </Button>
          </div>
        )}

        {phase === 'ready' && (
          <>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-100 text-accent-600">
              <Lock size={20} />
            </div>
            <h1 className="mt-4 text-center font-display text-xl font-semibold text-surface-900">
              Choose a new password
            </h1>
            <p className="mt-2 text-center text-sm text-surface-500">
              Pick something memorable — you&rsquo;ll use it the next time you sign in.
            </p>
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-surface-700">New password</span>
                <input
                  type="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  minLength={8}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`mt-1 w-full rounded-md border bg-surface-50 px-3 py-2.5 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:bg-white ${
                    fieldErrors.password
                      ? 'border-danger-200 focus:border-danger-600'
                      : 'border-surface-200 focus:border-surface-400'
                  }`}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs font-medium text-danger-700">
                    {fieldErrors.password}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-surface-700">Confirm password</span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  aria-invalid={fieldErrors.confirm ? true : undefined}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`mt-1 w-full rounded-md border bg-surface-50 px-3 py-2.5 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:bg-white ${
                    fieldErrors.confirm
                      ? 'border-danger-200 focus:border-danger-600'
                      : 'border-surface-200 focus:border-surface-400'
                  }`}
                />
                {fieldErrors.confirm && (
                  <p className="mt-1 text-xs font-medium text-danger-700">
                    {fieldErrors.confirm}
                  </p>
                )}
              </label>
              {error && (
                <div role="alert" className="rounded-md border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {error}
                </div>
              )}
              <Button type="submit" variant="primary" size="md" disabled={saving} className="w-full">
                {saving ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </>
        )}

        {phase === 'success' && (
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-50 text-success-600">
              <CheckCircle2 size={20} />
            </div>
            <h1 className="mt-4 font-display text-xl font-semibold text-surface-900">
              Password updated
            </h1>
            <p className="mt-2 text-sm text-surface-500">
              You&rsquo;re signed in with your new password.
            </p>
            <Button type="button" variant="primary" size="md" onClick={goHome} className="mt-5 w-full">
              Go to dashboard
            </Button>
          </div>
        )}
      </div>
    </Container>
  )
}
