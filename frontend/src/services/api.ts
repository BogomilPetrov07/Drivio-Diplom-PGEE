import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { getDomainAwareUrl } from '../utils/app-domain'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean
}

function normalizeApiBaseUrl(rawValue: string | undefined) {
    const fallback = '/api'
    if (!rawValue) return fallback

    const value = rawValue.trim()
    if (!value) return fallback
    if (value.startsWith('/')) return value
    if (value.startsWith('http://') || value.startsWith('https://')) return value

    // If env contains host-like value without protocol (e.g. staging.api.drivio-bg.com/api),
    // force absolute URL so it cannot be appended as a path to current origin.
    return `https://${value}`
}

const API_BASE_URL = (() => {
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('localhost')) {
        return '/api'
    }

    return normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
})()
let isRefreshing = false
let refreshPromise: Promise<unknown> | null = null

const api = axios.create({
    baseURL: `${API_BASE_URL}`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Response interceptor for session management
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetriableRequestConfig | undefined

        if (error.response?.status === 401 && originalRequest && originalRequest.url !== '/auth/refresh' && !originalRequest._retry) {
            originalRequest._retry = true

            if (!isRefreshing) {
                isRefreshing = true
                refreshPromise = api.get('/auth/refresh')
                    .finally(() => {
                        isRefreshing = false
                        refreshPromise = null
                    })
            }

            try {
                await refreshPromise
                return api(originalRequest)
            } catch {
                localStorage.removeItem('drivio-auth')
                if (window.location.pathname.startsWith('/dashboard')) {
                    window.location.assign(getDomainAwareUrl('/login'))
                }
                return Promise.reject(error)
            }
        }

        if (error.response?.status === 403) {
            window.location.href = getDomainAwareUrl('/unauthorized');
        }
        return Promise.reject(error);
    }
);

export default api
