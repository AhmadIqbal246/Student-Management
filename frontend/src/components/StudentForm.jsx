import { useState } from 'react'
import { useForm } from '../hooks/useForm'
import { getErrorMessage, getFieldErrors } from '../utils/apiErrors'
import { validateStudent } from '../utils/validation'
import Alert from './Alert'
import FormField from './FormField'

const EMPTY_STUDENT = { name: '', email: '', age: '' }

const toFormValues = (student) =>
  student ? { name: student.name, email: student.email, age: String(student.age) } : EMPTY_STUDENT

/**
 * Used for both Add and Edit. Pass `student` to edit.
 * The parent should pass key={student?.id ?? 'new'} so the form resets when the target changes.
 */
export default function StudentForm({ student, onSubmit, onCancel }) {
  const isEdit = Boolean(student)
  const { values, errors, setErrors, handleChange, reset } = useForm(toFormValues(student))
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const validationErrors = validateStudent(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
        age: Number(values.age),
      })
      if (!isEdit) reset(EMPTY_STUDENT)
    } catch (error) {
      setErrors(getFieldErrors(error))
      setFormError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2 className="card-title">{isEdit ? `Edit student #${student.id}` : 'Add student'}</h2>

      <Alert type="error" onClose={() => setFormError('')}>
        {formError}
      </Alert>

      <div className="form-grid">
        <FormField
          id="name"
          label="Name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          maxLength={100}
          placeholder="e.g. Ali Khan"
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          maxLength={255}
          placeholder="ali@example.com"
        />
        <FormField
          id="age"
          label="Age"
          type="number"
          min={1}
          max={120}
          step={1}
          value={values.age}
          onChange={handleChange}
          error={errors.age}
          placeholder="e.g. 21"
        />
      </div>

      <div className="form-actions">
        {isEdit && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Update student' : 'Add student'}
        </button>
      </div>
    </form>
  )
}
