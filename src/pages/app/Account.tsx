import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  Mail,
  User as UserIcon,
  Lock,
  AlertTriangle,
  Pencil,
  CheckCircle2,
  Cake,
  Users,
  Heart,
  Briefcase,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, ButtonLink } from '../../components/ui/Button'
import { BRAND } from '../../config/brand'
import { useAuth } from '../../lib/useAuth'
import {
  fetchOwnProfile,
  requestOwnEmailChange,
  updateOwnBirthdate,
  updateOwnDependents,
  updateOwnDisplayName,
  updateOwnPassword,
  updateOwnSpouse,
  updateOwnWaitlistInterest,
  type Profile,
  type WaitlistInterest,
} from '../../lib/profile'

export default function Account() {
  const { user, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  // Supabase's User exposes `new_email` while a change is pending confirmation
  // — we surface that under the Email field so the user knows the link is
  // waiting in their NEW inbox.
  const pendingNewEmail =
    (user as unknown as { new_email?: string | null } | null)?.new_email ?? null

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Success banner auto-dismisses after 4s; errors stick until the next action.
  useEffect(() => {
    if (!successMessage) return
    const t = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(t)
  }, [successMessage])

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [changingEmail, setChangingEmail] = useState(false)
  const [emailDraft, setEmailDraft] = useState('')
  const [emailFieldError, setEmailFieldError] = useState<string | undefined>()
  const [savingEmail, setSavingEmail] = useState(false)

  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    new?: string
    confirm?: string
  }>({})

  const [editingPersonal, setEditingPersonal] = useState(false)
  const [birthdateDraft, setBirthdateDraft] = useState('')
  const [dependentsDraft, setDependentsDraft] = useState('')
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [personalFieldErrors, setPersonalFieldErrors] = useState<{
    birthdate?: string
    dependents?: string
  }>({})

  const [editingSpouse, setEditingSpouse] = useState(false)
  const [spouseNameDraft, setSpouseNameDraft] = useState('')
  const [spouseBirthdateDraft, setSpouseBirthdateDraft] = useState('')
  const [spouseOccupationDraft, setSpouseOccupationDraft] = useState('')
  const [savingSpouse, setSavingSpouse] = useState(false)
  const [spouseFieldErrors, setSpouseFieldErrors] = useState<{
    spouseBirthdate?: string
  }>({})

  useEffect(() => {
    let cancelled = false
    fetchOwnProfile()
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const startEditingName = () => {
    setNameDraft(profile?.displayName ?? '')
    setEditingName(true)
    setError(null)
    setSuccessMessage(null)
  }

  const cancelEditingName = () => {
    setEditingName(false)
    setNameDraft('')
  }

  const saveName = async (e: FormEvent) => {
    e.preventDefault()
    setSavingName(true)
    setError(null)
    try {
      await updateOwnDisplayName(nameDraft)
      const fresh = await fetchOwnProfile()
      setProfile(fresh)
      await refreshProfile()
      setEditingName(false)
      setSuccessMessage('Name updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update name.')
    } finally {
      setSavingName(false)
    }
  }

  const startChangingPassword = () => {
    setNewPassword('')
    setConfirmPassword('')
    setChangingPassword(true)
    setError(null)
    setSuccessMessage(null)
  }

  const startChangingEmail = () => {
    setEmailDraft(profile?.email ?? '')
    setEmailFieldError(undefined)
    setChangingEmail(true)
    setError(null)
    setSuccessMessage(null)
  }

  const cancelChangingEmail = () => {
    setChangingEmail(false)
    setEmailDraft('')
    setEmailFieldError(undefined)
  }

  const saveEmail = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailFieldError(undefined)
    const next = emailDraft.trim()
    if (!next) {
      setEmailFieldError('Email is required.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(next)) {
      setEmailFieldError("Doesn't look like a valid email address.")
      return
    }
    if (next === profile?.email) {
      setEmailFieldError('Same as your current email.')
      return
    }
    setSavingEmail(true)
    try {
      await requestOwnEmailChange(next)
      cancelChangingEmail()
      setSuccessMessage(
        `Sent a confirmation link to ${next}. Click it to finish the change — until then your sign-in stays on the current email.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change email.')
    } finally {
      setSavingEmail(false)
    }
  }

  const cancelChangingPassword = () => {
    setChangingPassword(false)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordFieldErrors({})
  }

  const startEditingPersonal = () => {
    setBirthdateDraft(profile?.birthdate ?? '')
    setDependentsDraft(profile?.dependents != null ? String(profile.dependents) : '')
    setPersonalFieldErrors({})
    setEditingPersonal(true)
    setError(null)
    setSuccessMessage(null)
  }

  const cancelEditingPersonal = () => {
    setEditingPersonal(false)
    setBirthdateDraft('')
    setDependentsDraft('')
    setPersonalFieldErrors({})
  }

  const savePersonal = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const errs: typeof personalFieldErrors = {}
    const trimmedBirthdate = birthdateDraft.trim()
    const nextBirthdate = trimmedBirthdate === '' ? null : trimmedBirthdate
    if (nextBirthdate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(nextBirthdate)) {
      errs.birthdate = 'Use YYYY-MM-DD.'
    }

    const trimmedDeps = dependentsDraft.trim()
    let nextDependents: number | null = null
    if (trimmedDeps !== '') {
      const n = Number(trimmedDeps)
      if (!Number.isInteger(n) || n < 0 || n > 20) {
        errs.dependents = 'Whole number between 0 and 20.'
      } else {
        nextDependents = n
      }
    }

    setPersonalFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSavingPersonal(true)
    try {
      await Promise.all([
        updateOwnBirthdate(nextBirthdate),
        updateOwnDependents(nextDependents),
      ])
      const fresh = await fetchOwnProfile()
      setProfile(fresh)
      setEditingPersonal(false)
      setSuccessMessage('Personal details saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save personal details.')
    } finally {
      setSavingPersonal(false)
    }
  }

  const startEditingSpouse = () => {
    setSpouseNameDraft(profile?.spouseName ?? '')
    setSpouseBirthdateDraft(profile?.spouseBirthdate ?? '')
    setSpouseOccupationDraft(profile?.spouseOccupation ?? '')
    setSpouseFieldErrors({})
    setEditingSpouse(true)
    setError(null)
    setSuccessMessage(null)
  }

  const cancelEditingSpouse = () => {
    setEditingSpouse(false)
    setSpouseNameDraft('')
    setSpouseBirthdateDraft('')
    setSpouseOccupationDraft('')
    setSpouseFieldErrors({})
  }

  const saveSpouse = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedBirth = spouseBirthdateDraft.trim()
    const nextBirth = trimmedBirth === '' ? null : trimmedBirth
    if (nextBirth !== null && !/^\d{4}-\d{2}-\d{2}$/.test(nextBirth)) {
      setSpouseFieldErrors({ spouseBirthdate: 'Use YYYY-MM-DD.' })
      return
    }
    setSpouseFieldErrors({})
    setSavingSpouse(true)
    try {
      const trimmedName = spouseNameDraft.trim()
      const trimmedOcc = spouseOccupationDraft.trim()
      await updateOwnSpouse({
        spouseName: trimmedName === '' ? null : trimmedName,
        spouseBirthdate: nextBirth,
        spouseOccupation: trimmedOcc === '' ? null : trimmedOcc,
      })
      const fresh = await fetchOwnProfile()
      setProfile(fresh)
      setEditingSpouse(false)
      setSuccessMessage('Spouse details saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save spouse details.')
    } finally {
      setSavingSpouse(false)
    }
  }

  const savePassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const errs: typeof passwordFieldErrors = {}
    if (newPassword.length < 8) {
      errs.new = 'Must be at least 8 characters.'
    }
    if (newPassword !== confirmPassword) {
      errs.confirm = 'Passwords don’t match.'
    }
    setPasswordFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSavingPassword(true)
    try {
      await updateOwnPassword(newPassword)
      cancelChangingPassword()
      setSuccessMessage('Password updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-900">
          Account
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Profile, security, and subscription.
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 animate-enter">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div role="status" className="flex items-start gap-3 rounded-md border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 animate-enter">
          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="border-b border-surface-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-surface-900">Profile</h2>
        </header>
        <div className="space-y-0 p-6">
          {editingName ? (
            <form onSubmit={saveName} className="flex flex-col gap-3 border-b border-surface-100 pb-4 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="text-xs uppercase tracking-wider text-surface-500">Name</span>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={120}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Your name"
                  className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
                />
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={cancelEditingName} disabled={savingName}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingName}>
                  {savingName ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : (
            <Field
              icon={UserIcon}
              label="Name"
              value={loading ? '…' : profile?.displayName || '—'}
              action={
                !loading && (
                  <button
                    type="button"
                    onClick={startEditingName}
                    className="inline-flex items-center gap-1 rounded text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                )
              }
            />
          )}
          {changingEmail ? (
            <form
              onSubmit={saveEmail}
              className="flex flex-col gap-3 border-b border-surface-100 py-3 sm:flex-row sm:items-end"
            >
              <label className="flex-1">
                <span className="text-xs uppercase tracking-wider text-surface-500">Email</span>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  aria-invalid={emailFieldError ? true : undefined}
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  placeholder="you@example.com"
                  className={`mt-1 w-full rounded-md border bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:bg-white ${
                    emailFieldError
                      ? 'border-danger-200 focus:border-danger-600'
                      : 'border-surface-200 focus:border-surface-400'
                  }`}
                />
                {emailFieldError && (
                  <p className="mt-1 text-xs font-medium text-danger-700">{emailFieldError}</p>
                )}
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={cancelChangingEmail}
                  disabled={savingEmail}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingEmail}>
                  {savingEmail ? 'Sending…' : 'Send confirmation'}
                </Button>
              </div>
            </form>
          ) : (
            <Field
              icon={Mail}
              label="Email"
              value={loading ? '…' : profile?.email ?? '—'}
              sub={
                pendingNewEmail
                  ? `Pending change to ${pendingNewEmail} — confirm via the link we sent.`
                  : undefined
              }
              subTone="warning"
              action={
                !loading && (
                  <button
                    type="button"
                    onClick={startChangingEmail}
                    className="inline-flex items-center gap-1 rounded text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                  >
                    <Pencil size={12} /> Change
                  </button>
                )
              }
            />
          )}
          {editingPersonal ? (
            <form
              onSubmit={savePersonal}
              className="flex flex-col gap-3 border-b border-surface-100 py-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-surface-500">
                    Birthdate
                  </span>
                  <input
                    type="date"
                    autoFocus
                    aria-invalid={personalFieldErrors.birthdate ? true : undefined}
                    value={birthdateDraft}
                    onChange={(e) => setBirthdateDraft(e.target.value)}
                    className={`mt-1 w-full rounded-md border bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none focus:bg-white ${
                      personalFieldErrors.birthdate
                        ? 'border-danger-200 focus:border-danger-600'
                        : 'border-surface-200 focus:border-surface-400'
                    }`}
                  />
                  {personalFieldErrors.birthdate && (
                    <p className="mt-1 text-xs font-medium text-danger-700">
                      {personalFieldErrors.birthdate}
                    </p>
                  )}
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-surface-500">
                    Dependents
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    max="20"
                    aria-invalid={personalFieldErrors.dependents ? true : undefined}
                    value={dependentsDraft}
                    onChange={(e) => setDependentsDraft(e.target.value)}
                    placeholder="0"
                    className={`mt-1 w-full rounded-md border bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:bg-white ${
                      personalFieldErrors.dependents
                        ? 'border-danger-200 focus:border-danger-600'
                        : 'border-surface-200 focus:border-surface-400'
                    }`}
                  />
                  {personalFieldErrors.dependents && (
                    <p className="mt-1 text-xs font-medium text-danger-700">
                      {personalFieldErrors.dependents}
                    </p>
                  )}
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={cancelEditingPersonal}
                  disabled={savingPersonal}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingPersonal}>
                  {savingPersonal ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <Field
                icon={Cake}
                label="Birthdate"
                value={loading ? '…' : formatBirthdate(profile?.birthdate)}
                sub={
                  !loading && profile?.birthdate
                    ? yearsToRetirementText(profile.birthdate)
                    : undefined
                }
                action={
                  !loading && (
                    <button
                      type="button"
                      onClick={startEditingPersonal}
                      className="inline-flex items-center gap-1 rounded text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                      aria-label="Edit birthdate and dependents"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  )
                }
              />
              <Field
                icon={Users}
                label="Dependents"
                value={
                  loading
                    ? '…'
                    : profile?.dependents != null
                      ? String(profile.dependents)
                      : '—'
                }
                action={
                  !loading && (
                    <button
                      type="button"
                      onClick={startEditingPersonal}
                      className="inline-flex items-center gap-1 rounded text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                      aria-label="Edit birthdate and dependents"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  )
                }
              />
            </>
          )}
          {changingPassword ? (
            <form onSubmit={savePassword} className="flex flex-col gap-3 py-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-surface-500">New password</span>
                <input
                  type="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  minLength={8}
                  aria-invalid={passwordFieldErrors.new ? true : undefined}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`mt-1 w-full rounded-md border bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:bg-white ${
                    passwordFieldErrors.new
                      ? 'border-danger-200 focus:border-danger-600'
                      : 'border-surface-200 focus:border-surface-400'
                  }`}
                />
                {passwordFieldErrors.new && (
                  <p className="mt-1 text-xs font-medium text-danger-700">
                    {passwordFieldErrors.new}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-surface-500">Confirm new password</span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  aria-invalid={passwordFieldErrors.confirm ? true : undefined}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`mt-1 w-full rounded-md border bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:bg-white ${
                    passwordFieldErrors.confirm
                      ? 'border-danger-200 focus:border-danger-600'
                      : 'border-surface-200 focus:border-surface-400'
                  }`}
                />
                {passwordFieldErrors.confirm && (
                  <p className="mt-1 text-xs font-medium text-danger-700">
                    {passwordFieldErrors.confirm}
                  </p>
                )}
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={cancelChangingPassword} disabled={savingPassword}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingPassword}>
                  {savingPassword ? 'Saving…' : 'Update password'}
                </Button>
              </div>
            </form>
          ) : (
            <Field
              icon={Lock}
              label="Password"
              value="••••••••••"
              action={
                <button
                  type="button"
                  onClick={startChangingPassword}
                  className="inline-flex items-center gap-1 text-xs font-medium text-surface-500 hover:text-surface-900"
                >
                  <Pencil size={12} /> Change
                </button>
              }
            />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="border-b border-surface-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-surface-900">Session</h2>
        </header>
        <div className="flex flex-col items-stretch gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 truncate text-sm text-surface-600">
            Signed in as{' '}
            <span className="font-medium text-surface-900">{profile?.email ?? '…'}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleSignOut}
            className="flex-shrink-0"
          >
            <LogOut size={14} />
            Sign out
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="border-b border-surface-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-surface-900">
            Spouse / co-applicant
          </h2>
          <p className="mt-1 text-xs text-surface-500">
            Optional. Useful joint-planning context — names, ages, occupation.
          </p>
        </header>
        <div className="p-6">
          {editingSpouse ? (
            <form onSubmit={saveSpouse} className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-surface-500">Name</span>
                <input
                  type="text"
                  autoFocus
                  maxLength={120}
                  value={spouseNameDraft}
                  onChange={(e) => setSpouseNameDraft(e.target.value)}
                  placeholder="Spouse's name"
                  className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-surface-500">
                    Birthdate
                  </span>
                  <input
                    type="date"
                    aria-invalid={spouseFieldErrors.spouseBirthdate ? true : undefined}
                    value={spouseBirthdateDraft}
                    onChange={(e) => setSpouseBirthdateDraft(e.target.value)}
                    className={`mt-1 w-full rounded-md border bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none focus:bg-white ${
                      spouseFieldErrors.spouseBirthdate
                        ? 'border-danger-200 focus:border-danger-600'
                        : 'border-surface-200 focus:border-surface-400'
                    }`}
                  />
                  {spouseFieldErrors.spouseBirthdate && (
                    <p className="mt-1 text-xs font-medium text-danger-700">
                      {spouseFieldErrors.spouseBirthdate}
                    </p>
                  )}
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-surface-500">
                    Occupation
                  </span>
                  <input
                    type="text"
                    maxLength={120}
                    value={spouseOccupationDraft}
                    onChange={(e) => setSpouseOccupationDraft(e.target.value)}
                    placeholder="e.g. Teacher"
                    className="mt-1 w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-surface-400 focus:bg-white"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={cancelEditingSpouse}
                  disabled={savingSpouse}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={savingSpouse}>
                  {savingSpouse ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <Field
                icon={Heart}
                label="Name"
                value={loading ? '…' : profile?.spouseName || '—'}
                action={
                  !loading && (
                    <button
                      type="button"
                      onClick={startEditingSpouse}
                      className="inline-flex items-center gap-1 rounded text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                      aria-label="Edit spouse details"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  )
                }
              />
              <Field
                icon={Cake}
                label="Birthdate"
                value={loading ? '…' : formatBirthdate(profile?.spouseBirthdate)}
                action={
                  !loading && (
                    <button
                      type="button"
                      onClick={startEditingSpouse}
                      className="inline-flex items-center gap-1 rounded text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                      aria-label="Edit spouse details"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  )
                }
              />
              <Field
                icon={Briefcase}
                label="Occupation"
                value={loading ? '…' : profile?.spouseOccupation || '—'}
                action={
                  !loading && (
                    <button
                      type="button"
                      onClick={startEditingSpouse}
                      className="inline-flex items-center gap-1 rounded text-xs font-medium text-surface-500 transition-colors hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                      aria-label="Edit spouse details"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  )
                }
              />
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="border-b border-surface-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-surface-900">Subscription</h2>
        </header>
        <div className="flex flex-col items-start gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-surface-600">
            <div className="flex items-center gap-2">
              <span className="font-medium text-surface-900">Free plan</span>
              <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                Current
              </span>
            </div>
            <div className="mt-0.5 text-surface-500">
              Plus and Pro tiers land in the next release.
            </div>
          </div>
          <ButtonLink to="/pricing" variant="secondary" size="sm" className="flex-shrink-0">
            See plans
          </ButtonLink>
        </div>
        <div className="border-t border-surface-100 px-6 py-5">
          <WaitlistInterestRow
            profile={profile}
            onSaved={async (interest) => {
              await updateOwnWaitlistInterest(interest)
              setProfile((p) => (p ? { ...p, waitlistInterest: interest } : p))
              setSuccessMessage('Saved your tier interest.')
            }}
            onError={(msg) => setError(msg)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-200 bg-white shadow-card">
        <header className="border-b border-surface-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-surface-900">Help</h2>
        </header>
        <div className="px-6 py-5 text-sm text-surface-600">
          Stuck or have feedback? Email{' '}
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="font-medium text-accent-600 underline underline-offset-2 transition-colors hover:text-accent-500"
          >
            {BRAND.supportEmail}
          </a>{' '}
          — we read every message.
        </div>
      </section>

    </div>
  )
}

function WaitlistInterestRow({
  profile,
  onSaved,
  onError,
}: {
  profile: Profile | null
  onSaved: (interest: WaitlistInterest) => Promise<void>
  onError: (msg: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const current = profile?.waitlistInterest ?? 'none'

  const onChange = async (next: WaitlistInterest) => {
    if (next === current || saving) return
    setSaving(true)
    try {
      await onSaved(next)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save tier interest.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-surface-500">
        Paid-tier interest
      </span>
      <select
        value={current}
        disabled={saving || !profile}
        onChange={(e) => onChange(e.target.value as WaitlistInterest)}
        className="mt-1 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none transition-colors focus:border-surface-400 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-md"
      >
        <option value="none">Just the free plan for now</option>
        <option value="plus">Plus — for homeowners with a living plan</option>
        <option value="pro">Pro — for realtors managing clients</option>
      </select>
      <p className="mt-1 text-xs text-surface-500">
        Pricing is TBD. We&rsquo;ll email when your selected tier goes live.
      </p>
    </label>
  )
}

/**
 * "X years until typical retirement age (65)" string, or null if the user
 * is past 65 or the birthdate is unparseable. Lightweight derived stat —
 * the only consumer of `profile.birthdate` so far.
 */
function yearsToRetirementText(iso: string): string | undefined {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return undefined
  const today = new Date()
  const dob = new Date(y, m - 1, d)
  let age = today.getFullYear() - dob.getFullYear()
  const beforeBirthday =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  if (beforeBirthday) age -= 1
  const yearsToRetirement = 65 - age
  if (yearsToRetirement <= 0) return 'Past typical retirement age.'
  if (yearsToRetirement === 1) return '1 year until typical retirement age (65).'
  return `${yearsToRetirement} years until typical retirement age (65).`
}

function formatBirthdate(iso: string | null | undefined): string {
  if (!iso) return '—'
  // ISO date is YYYY-MM-DD; render as "Mon D, YYYY" without TZ drift.
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function Field({
  icon: Icon,
  label,
  value,
  sub,
  subTone = 'neutral',
  action,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  subTone?: 'neutral' | 'warning'
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-4 border-b border-surface-100 py-3 last:border-b-0">
      <Icon size={16} className="text-surface-400" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-surface-500">{label}</div>
        <div className="truncate text-sm font-medium text-surface-900">{value}</div>
        {sub && (
          <div
            className={`mt-0.5 text-xs ${subTone === 'warning' ? 'text-warning-700' : 'text-surface-500'}`}
          >
            {sub}
          </div>
        )}
      </div>
      {action}
    </div>
  )
}
