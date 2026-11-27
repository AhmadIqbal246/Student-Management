import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import FormField from '../components/FormField'
import { useAuth } from '../hooks/useAuth'
import { useForm } from '../hooks/useForm'
import { getErrorMessage, getFieldErrors } from '../utils/apiErrors'
import { validateSignup } from '../utils/validation'

const INITIAL_VALUES = { name: '', email: '', password: '', confirmPassword: '' }

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const { values, errors, setErrors, handleChange } = useForm(INITIAL_VALUES)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const validationErrors = validateSignup(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await signup({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrors(getFieldErrors(error))
      setFormError(getErrorMessage(error, 'Signup failed'))
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Sign up to start managing students</p>

        <Alert type="error" onClose={() => setFormError('')}>
          {formError}
        </Alert>

        <FormField
          id="name"
          label="Full name"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          maxLength={100}
          autoFocus
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          maxLength={255}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          maxLength={72}
        />
        <p className="field-hint">At least 8 characters, with a letter and a number.</p>
        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          maxLength={72}
        />

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  )
}
