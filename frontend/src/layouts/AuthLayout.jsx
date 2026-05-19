import { Outlet, Navigate } from 'react-router-dom'
import useAuthStore from '../store/auth.store'

const AuthLayout = () => {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/app/dashboard" replace />

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Outlet />
    </div>
  )
}

export default AuthLayout
