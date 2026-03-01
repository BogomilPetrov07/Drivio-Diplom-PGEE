import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL


const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

api.get('/api/auth/refresh').then(response => {
    console.log(response);
})

// Response interceptor for session management
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // If the cookie is expired or invalid, the server returns 401
        if (error.response?.status === 401) {
            // Logic to redirect to log in or update global auth state
            const response = await api.get('/refresh');
            if (response.status === 401) {
                window.location.href = '/login';
            }
        }

        // If the user with this cookie hasn't the right privileges, the server returns 403
        if (error.response?.status === 403) {
            window.location.href = '/unauthorized';
        }
        return Promise.reject(error);
    }
);

export default api