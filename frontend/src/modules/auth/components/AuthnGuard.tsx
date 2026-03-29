import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks.js'

export default function AuthnGuard() {
  const { isAuthenticated, initialized, loading, initialize } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!initialized) {
      void initialize()
    }
  }, [initialized, initialize])

  if (!initialized || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-base-200">
        <p className="text-base-content/70">Loading your session...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

