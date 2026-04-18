import api from '../../services/api.js'
import type { AuthResponse, LoginDTO } from './types.js'

export async function login(payload: LoginDTO) {
  const response = await api.post<AuthResponse>('/auth/login', payload)
  return response.data
}

export async function refreshSession() {
  const response = await api.get<AuthResponse>('/auth/refresh')
  return response.data
}

export async function logout() {
  await api.get('/auth/logout')
}
