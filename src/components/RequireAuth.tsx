import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { useAuthModal } from '../lib/authModal'
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
      <div className="grid min-h-screen place-items-center bg-surface-50 text-sm text-surface-500">
        Loading…
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
