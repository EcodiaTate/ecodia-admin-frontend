import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const { refreshToken, setToken, logout } = useAuthStore.getState()
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken })
          setToken(data.token)
          err.config.headers.Authorization = `Bearer ${data.token}`
          return axios(err.config)
        } catch {
          logout()
        }
      } else {
        logout()
      }
    }
    return Promise.reject(err)
  },
)

export default api
