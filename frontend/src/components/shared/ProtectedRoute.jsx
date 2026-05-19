import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/auth.store'

const ProtectedRoute = ({ children, roles = [] }) => {
  const { token, user } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />

  if (roles.length && user && !roles.includes(user.rol)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
