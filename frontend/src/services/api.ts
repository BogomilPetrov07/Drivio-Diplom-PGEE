import axios from 'axios'
import { useAuthStore } from '../modules/auth/store.js'
import { refreshAccessToken } from './auth-refresh.js'

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}api`,
    withCredentials: true
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null) => {
    failedQueue.forEach(p => {
        if (error) p.reject(error)
        else p.resolve(token)
    })
    failedQueue = []
}

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return api(originalRequest)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const newToken = await refreshAccessToken()
                processQueue(null, newToken)
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return api(originalRequest)
            } catch (err) {
                processQueue(err, null)
                useAuthStore.getState().clearAuth()
                window.location.href = '/login'
                return Promise.reject(err)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default api