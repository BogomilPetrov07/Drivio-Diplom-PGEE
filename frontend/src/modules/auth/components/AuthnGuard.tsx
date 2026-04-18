import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks.js'
import SessionLoadingScreen from './SessionLoadingScreen'
import { getInitialLanguagePreference } from '../../../utils/preferences'

export default function AuthnGuard() {
  const { isAuthenticated, initialized, loading, initialize } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!initialized) {
      void initialize()
    }
  }, [initialized, initialize])

  if (!initialized || loading) {
    return <SessionLoadingScreen language={getInitialLanguagePreference()} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

