import api from '../../services/api.js'
import type { AuthResponse, LoginDTO } from './types.js'

export async function login(payload: LoginDTO) {
  const response = await api.post<AuthResponse>('/auth/login', payload)
  return response.data
}

export async function refreshSession() {
  const response = await api.post<AuthResponse>('/auth/refresh')
  return response.data
}

export async function hasSessionCookie() {
  try {
    const response = await api.get<{ hasSessionCookie?: boolean }>('/auth/has-session-cookie')
    const data = response.data
    return Boolean(data.hasSessionCookie)
  } catch {
    return false
  }
}

export async function logout() {
  await api.post('/auth/logout')
}
