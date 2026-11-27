// Client-side checks give instant feedback. The backend still validates
// everything, because client-side checks can be bypassed.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateName = (name) => {
  const value = name.trim()
  if (!value) return 'Name is required'
  if (value.length < 2 || value.length > 100) return 'Name must be between 2 and 100 characters'
  return null
}

const validateEmail = (email) => {
  const value = email.trim()
  if (!value) return 'Email is required'
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address'
  return null
}

/** Drops fields that have no error, so an empty object means the form is valid. */
const compact = (errors) => Object.fromEntries(Object.entries(errors).filter(([, msg]) => msg))

export const validateLogin = ({ email, password }) =>
  compact({
    email: validateEmail(email),
    password: password ? null : 'Password is required',
  })

export const validateSignup = ({ name, email, password, confirmPassword }) => {
  let passwordError = null
  if (!password) passwordError = 'Password is required'
  else if (password.length < 8 || password.length > 72)
    passwordError = 'Password must be between 8 and 72 characters'
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    passwordError = 'Password must contain at least one letter and one number'

  return compact({
    name: validateName(name),
    email: validateEmail(email),
    password: passwordError,
    confirmPassword: confirmPassword === password ? null : 'Passwords do not match',
  })
}

export const validateStudent = ({ name, email, age }) => {
  const ageNumber = Number(age)
  let ageError = null
  if (age === '' || age === null || age === undefined) ageError = 'Age is required'
  else if (!Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 120)
    ageError = 'Age must be a whole number between 1 and 120'

  return compact({
    name: validateName(name),
    email: validateEmail(email),
    age: ageError,
  })
}
