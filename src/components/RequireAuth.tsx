import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { useAuthModal } from '../lib/useAuthModal'
import { homePathFor, type UserRole } from '../lib/profile'

type Props = {
  requiredRole?: UserRole
}

export default function RequireAuth({ requiredRole }: Props) {
  const { session, effectiveRole, loading, profileLoading } = useAuth()
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

  if (requiredRole && effectiveRole !== requiredRole) {
    return <Navigate to={homePathFor(effectiveRole)} replace />
  }

  return <Outlet />
}
