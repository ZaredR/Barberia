import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout    from '../layouts/MainLayout'
import AuthLayout    from '../layouts/AuthLayout'
import ProtectedRoute from '../components/shared/ProtectedRoute'

import Login      from '../pages/Login'
import Dashboard  from '../pages/Dashboard'
import Agenda     from '../pages/Agenda'
import Reservas   from '../pages/Reservas'
import Ventas     from '../pages/Ventas'
import Productos  from '../pages/Productos'
import Servicios  from '../pages/Servicios'
import Bitacora   from '../pages/Bitacora'
import Reportes   from '../pages/Reportes'
import Usuarios   from '../pages/Usuarios'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { index: true,   element: <Navigate to="/login" replace /> },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true,         element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',   element: <Dashboard /> },
      { path: 'agenda',      element: <Agenda /> },
      { path: 'reservas',    element: <Reservas /> },
      { path: 'ventas',      element: <Ventas /> },
      { path: 'productos',   element: <Productos /> },
      { path: 'servicios',   element: <Servicios /> },
      { path: 'bitacora',    element: <ProtectedRoute roles={['admin']}><Bitacora /></ProtectedRoute> },
      { path: 'reportes',    element: <ProtectedRoute roles={['admin','recepcionista']}><Reportes /></ProtectedRoute> },
      { path: 'usuarios',    element: <ProtectedRoute roles={['admin']}><Usuarios /></ProtectedRoute> },
    ],
  },
])

export default router
