import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.api'
import { setSessionExpiredHandler } from '../api/axios'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // httpOnly cookies can't be read by JavaScript, so on page load we ask the API
  // whether there's a session. Until it answers, the app shows a loader.
  const [isLoading, setIsLoading] = useState(true)

  const clearUser = useCallback(() => setUser(null), [])

  // The axios interceptor calls this when the session can't be refreshed.
  useEffect(() => {
    setSessionExpiredHandler(clearUser)
    return () => setSessionExpiredHandler(null)
  }, [clearUser])

  // Restore the session on page load. If the access token has expired, the interceptor
  // refreshes it and retries /auth/me automatically.
  useEffect(() => {
    let cancelled = false
    authApi
      .getMe()
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setIsLoading(false))

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    setUser(await authApi.login(credentials))
  }, [])

  const signup = useCallback(async (details) => {
    setUser(await authApi.signup(details))
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout() // revokes the refresh token and clears the cookies
    } catch {
      // Even if the request fails, log out locally.
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, signup, logout }),
    [user, isLoading, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
