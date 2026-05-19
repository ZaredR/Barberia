import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/auth.store'

const Header = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <span className="text-sm text-gray-400">
        {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </span>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-400 hover:text-red-400 transition-colors"
      >
        Cerrar sesión →
      </button>
    </header>
  )
}

export default Header
