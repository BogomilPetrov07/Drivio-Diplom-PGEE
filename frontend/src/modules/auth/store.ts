import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { disconnectRealtimeSocket } from '../dashboard/realtime.js'
import { login, logout, refreshSession } from './api.js'
import type { AuthUser, LoginDTO } from './types.js'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  error: string | null
  login: (payload: LoginDTO) => Promise<AuthUser>
  initialize: () => Promise<void>
  completeInitializationWithoutSession: () => void
  forceRefreshSession: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

let initializePromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      initialized: false,
      error: null,

      login: async (payload) => {
        set({ loading: true, error: null })

        try {
          const { user } = await login(payload)
          set({ user, loading: false, initialized: true })
          return user
        } catch {
          set({ loading: false, error: 'Invalid credentials' })
          throw new Error('Invalid credentials')
        }
      },

      initialize: async () => {
        if (get().initialized) return
        if (initializePromise) return initializePromise

        initializePromise = (async () => {
          set({ loading: true, error: null })
          try {
            const { user } = await refreshSession()
            set({ user, loading: false, initialized: true })
          } catch {
            set({ user: null, loading: false, initialized: true })
          }
        })().finally(() => {
          initializePromise = null
        })

        return initializePromise
      },

      completeInitializationWithoutSession: () => {
        if (get().initialized || get().loading) return
        set({ user: null, loading: false, initialized: true, error: null })
      },

      forceRefreshSession: async () => {
        if (initializePromise) return initializePromise

        initializePromise = (async () => {
          set({ loading: true, error: null })
          try {
            const { user } = await refreshSession()
            set({ user, loading: false, initialized: true })
          } catch {
            set({ user: null, loading: false, initialized: true })
          }
        })().finally(() => {
          initializePromise = null
        })

        return initializePromise
      },

      logout: async () => {
        try {
          await logout()
        } finally {
          disconnectRealtimeSocket()
          set({ user: null, initialized: true, loading: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'drivio-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
)
