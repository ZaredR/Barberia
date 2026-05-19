import { NavLink } from 'react-router-dom'
import useAuthStore from '../../store/auth.store'

const links = [
  { to: '/app/dashboard', label: '📊 Dashboard',  roles: [] },
  { to: '/app/agenda',    label: '📅 Agenda',      roles: [] },
  { to: '/app/reservas',  label: '✂️ Reservas',    roles: [] },
  { to: '/app/ventas',    label: '💰 Ventas',      roles: [] },
  { to: '/app/productos', label: '📦 Productos',   roles: [] },
  { to: '/app/servicios', label: '💈 Servicios',   roles: [] },
  { to: '/app/reportes',  label: '📈 Reportes',    roles: ['admin', 'recepcionista'] },
  { to: '/app/bitacora',  label: '🗒️ Bitácora',   roles: ['admin'] },
  { to: '/app/usuarios',  label: '👥 Usuarios',    roles: ['admin'] },
]

const Sidebar = () => {
  const user = useAuthStore((s) => s.user)

  const visible = links.filter(
    (l) => l.roles.length === 0 || (user && l.roles.includes(user.rol))
  )

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-amber-400">💈 Barbería</h1>
        <p className="text-xs text-gray-500 mt-1">Sistema de gestión</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {visible.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-amber-500 text-gray-900 font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        <p className="font-medium text-gray-300">{user?.nombre}</p>
        <p className="capitalize">{user?.rol}</p>
      </div>
    </aside>
  )
}

export default Sidebar
