import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '../lib/profile'

/**
 * Layout-route wrapper that gates children on `profiles.role === 'admin'`.
 * Sits inside <RequireAuth>, so by the time we get here the user is signed in.
 * Non-admins get bounced to /app/dashboard. RLS still backs the gate, so this
 * is defense-in-depth, not the only check.
 */
export default function RequireAdmin() {
  const { profile, loading } = useProfile()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-50 text-sm text-surface-500">
        Loading…
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/app/dashboard" replace />
  }

  return <Outlet />
}
