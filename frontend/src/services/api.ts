import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { getAppUrl } from '../utils/app-domain'

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean
}

const API_BASE_URL = (() => {
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('localhost')) {
        return '/api'
    }
    return import.meta.env.VITE_API_URL ?? '/api'
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
                    window.location.assign(getAppUrl('/login'))
                }
                return Promise.reject(error)
            }
        }

        if (error.response?.status === 403) {
            window.location.href = getAppUrl('/unauthorized');
        }
        return Promise.reject(error);
    }
);

export default api
