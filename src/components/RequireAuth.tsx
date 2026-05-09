import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useAuthModal } from '../lib/authModal'

export default function RequireAuth() {
  const { session, loading } = useAuth()
  const { openModal } = useAuthModal()
  const location = useLocation()

  const unauthed = !loading && !session

  useEffect(() => {
    if (unauthed) openModal('login')
  }, [unauthed, openModal])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-50 text-sm text-surface-500">
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <Outlet />
}
