import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="auth-page">
      <div className="card auth-card text-center">
        <h1 className="auth-title">404</h1>
        <p className="auth-subtitle">This page does not exist.</p>
        <Link to="/" className="btn btn-primary">
          Go home
        </Link>
      </div>
    </main>
  )
}
