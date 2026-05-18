/**
 * Shown while a lazy route chunk is downloading. Single low-key spinner —
 * intentionally minimal so a fast network never sees a flash of skeleton.
 */
export default function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface-50 text-surface-400">
      <div
        role="status"
        aria-label="Loading"
        className="h-6 w-6 animate-spin rounded-full border-2 border-surface-200 border-t-accent-500"
      />
    </div>
  )
}
