import api from '../../services/api.js'
import type { AuthResponse, LoginDTO } from './types.js'
import { getAppHostname } from '../../utils/app-domain'

export async function login(payload: LoginDTO) {
  const response = await api.post<AuthResponse>('/auth/login', payload)
  return response.data
}

export async function refreshSession() {
  const response = await api.get<AuthResponse>('/auth/refresh')
  return response.data
}

export async function hasSessionCookie() {
  if (typeof window === 'undefined') return false

  const url = new URL('/api/auth/has-session-cookie', window.location.origin)
  url.hostname = getAppHostname(window.location.hostname)

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) return false
    const data = await response.json() as { hasSessionCookie?: boolean }
    return Boolean(data.hasSessionCookie)
  } catch {
    return false
  }
}

export async function logout() {
  await api.get('/auth/logout')
}
