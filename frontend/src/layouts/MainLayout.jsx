import { Outlet } from 'react-router-dom'
import Sidebar from '../components/shared/Sidebar'
import Header  from '../components/shared/Header'

const MainLayout = () => (
  <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
    <Sidebar />
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  </div>
)

export default MainLayout
