import api from './axios'

// Each function returns the user from the backend's { success, data } response.
// Tokens are set by the backend as httpOnly cookies, so they never appear here.

export const signup = async ({ name, email, password }) => {
  const { data } = await api.post('/auth/signup', { name, email, password })
  return data.data.user
}

export const login = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data.data.user
}

export const getMe = async () => {
  const { data } = await api.get('/auth/me')
  return data.data.user
}

export const logout = async () => {
  await api.post('/auth/logout')
}
