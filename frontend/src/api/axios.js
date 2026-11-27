import axios from 'axios'

/**
 * One configured axios instance; every API module uses it.
 *
 * Authentication uses httpOnly cookies set by the backend. This code never sees or stores
 * a token: `withCredentials` tells the browser to send the cookies with each request.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  timeout: 10_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// A 401 from these means "wrong credentials" or "no session". Refreshing won't help.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/logout']
const isAuthEndpoint = (url = '') => AUTH_ENDPOINTS.some((path) => url.startsWith(path))

// AuthProvider registers a handler so the UI logs out when the session can't be renewed.
let onSessionExpired = null
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler
}

// If several requests get a 401 at the same moment, they all wait for ONE refresh call.
// Sending the same refresh token twice would look like token theft to the backend.
let refreshPromise = null
const refreshSession = () => {
  refreshPromise ??= api.post('/auth/refresh').finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

/**
 * Silent refresh: when the 15-minute access token expires, a request gets a 401.
 * Get a new token pair, then retry the original request once. The user doesn't notice.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || !original || isAuthEndpoint(original.url)) {
      return Promise.reject(error)
    }

    // Already refreshed and retried, and it still failed: the session is gone.
    if (original._retried) {
      onSessionExpired?.()
      return Promise.reject(error)
    }

    original._retried = true
    try {
      await refreshSession()
    } catch {
      onSessionExpired?.()
      return Promise.reject(error)
    }
    return api(original)
  },
)

export default api
