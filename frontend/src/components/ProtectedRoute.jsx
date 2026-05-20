import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loader while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Admin-only route check
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}