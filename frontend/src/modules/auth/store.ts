import { create } from 'zustand'
import type { User } from './types'

interface AuthState {
    accessToken: string | null
    user: User | null
    setAuth: (data: { accessToken: string; user: User }) => void
    clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    user: null,

    setAuth: (data) =>
        set({
            accessToken: data.accessToken,
            user: data.user
        }),

    clearAuth: () =>
        set({
            accessToken: null,
            user: null
        })
}))