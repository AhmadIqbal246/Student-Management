/**
 * Turns an axios error into a human-readable message.
 * The backend always responds with { success: false, message, errors? }.
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.request && !error.response) {
    return 'Cannot reach the server. Make sure the backend is running.'
  }
  return fallback
}

/**
 * Converts the backend's field errors into { [field]: message } for forms.
 * [{ field: 'email', message: '...' }] -> { email: '...' }
 */
export const getFieldErrors = (error) => {
  const errors = error?.response?.data?.errors
  if (!Array.isArray(errors)) return {}
  return Object.fromEntries(errors.map(({ field, message }) => [field, message]))
}
