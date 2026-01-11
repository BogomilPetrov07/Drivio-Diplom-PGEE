import axios from 'axios'
import { useAuthStore } from '../modules/auth/store.js'

export const refreshAccessToken = async () => {
    const res = await axios.post(
        `${import.meta.env.VITE_API_URL}api/auth/refresh`,
        {},
        { withCredentials: true }
    )

    const { accessToken, user } = res.data

    useAuthStore.getState().setAuth({ accessToken, user })

    return accessToken
}
