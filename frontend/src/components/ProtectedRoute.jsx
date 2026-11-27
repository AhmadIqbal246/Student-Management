import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loader from './Loader'

/** Renders child routes only for logged-in users; others are sent to /login. */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <Loader label="Checking session..." fullPage />

  if (!isAuthenticated) {
    // Remember where the user was going so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
