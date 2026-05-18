import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useAuthModal } from '../lib/useAuthModal'
import { homePathFor, type UserRole } from '../lib/profile'
import { Button } from './ui/Button'

type Props = {
  requiredRole?: UserRole
}

export default function RequireAuth({ requiredRole }: Props) {
  const { session, effectiveRole, loading, profileLoading, profileError, refreshProfile } =
    useAuth()
  const { openModal } = useAuthModal()
  const location = useLocation()

  const unauthed = !loading && !session

  useEffect(() => {
    if (unauthed) openModal('login')
  }, [unauthed, openModal])

  if (loading || (session && profileLoading)) {
    return (
      <div className="min-h-screen bg-surface-50">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
          <div className="h-10 w-1/3 animate-pulse rounded-md bg-surface-100" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-100" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-surface-100" />
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  // Profile fetch settled but failed (network / RLS). Show an explicit retry
  // rather than treating the user as role-less — otherwise a transient blip
  // would, e.g., bounce an admin out of /admin to the homeowner dashboard.
  if (profileError) {
    return <ProfileErrorState onRetry={refreshProfile} />
  }

  if (requiredRole && effectiveRole !== requiredRole) {
    return <Navigate to={homePathFor(effectiveRole)} replace />
  }

  return <Outlet />
}

function ProfileErrorState({ onRetry }: { onRetry: () => Promise<void> }) {
  const [retrying, setRetrying] = useState(false)

  const retry = async () => {
    setRetrying(true)
    try {
      await onRetry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-50 px-6 py-16 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-danger-50 text-danger-600">
          <AlertTriangle size={20} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-surface-900">
          Couldn&rsquo;t load your account
        </h1>
        <p className="mt-3 text-sm text-surface-600">
          We hit a snag fetching your profile. Check your connection and try again.
        </p>
        <Button variant="primary" size="md" onClick={retry} disabled={retrying} className="mt-6">
          {retrying ? 'Retrying…' : 'Try again'}
        </Button>
      </div>
    </div>
  )
}
