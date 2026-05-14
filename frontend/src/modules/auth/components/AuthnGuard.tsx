import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { disconnectRealtimeSocket } from '../../dashboard/realtime.js'
import { useAuth } from '../hooks.js'

export default function AuthnGuard() {
  const { isAuthenticated, initialized, loading, initialize } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!initialized) {
      void initialize()
    }
  }, [initialized, initialize])

  useEffect(() => {
    if (initialized && !loading && !isAuthenticated) {
      disconnectRealtimeSocket()
    }
  }, [initialized, isAuthenticated, loading])

  if (!initialized || loading) {
    return <div className="min-h-screen bg-base-100" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
