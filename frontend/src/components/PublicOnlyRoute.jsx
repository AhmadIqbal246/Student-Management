import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loader from './Loader'

/** Login/Signup pages: logged-in users are redirected to the dashboard. */
export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Loader label="Checking session..." fullPage />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
