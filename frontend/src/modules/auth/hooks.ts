import { useMemo } from 'react'
import { useAuthStore } from './store.js'
import { getPreferredRole } from './types.js'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const initialized = useAuthStore((state) => state.initialized)
  const error = useAuthStore((state) => state.error)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const initialize = useAuthStore((state) => state.initialize)
  const completeInitializationWithoutSession = useAuthStore((state) => state.completeInitializationWithoutSession)
  const forceRefreshSession = useAuthStore((state) => state.forceRefreshSession)
  const clearError = useAuthStore((state) => state.clearError)

  return useMemo(
    () => ({
      user,
      loading,
      initialized,
      error,
      isAuthenticated: Boolean(user),
      role: getPreferredRole(user),
      roles: user?.roles ?? [],
      login,
      logout,
      initialize,
      completeInitializationWithoutSession,
      forceRefreshSession,
      clearError,
    }),
    [user, loading, initialized, error, login, logout, initialize, completeInitializationWithoutSession, forceRefreshSession, clearError],
  )
}
