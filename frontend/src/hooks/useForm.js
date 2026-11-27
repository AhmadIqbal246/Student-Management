import { useCallback, useState } from 'react'

/**
 * Minimal form state: values, per-field errors, and a change handler
 * that clears a field's error as soon as the user edits it.
 */
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const { [name]: _removed, ...rest } = prev
      return rest
    })
  }, [])

  const reset = useCallback((nextValues = initialValues) => {
    setValues(nextValues)
    setErrors({})
  }, [initialValues])

  return { values, errors, setErrors, handleChange, reset }
}
