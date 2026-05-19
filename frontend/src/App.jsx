import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import router from './router'
import useAuthStore from './store/auth.store'

function App() {
  const { token, fetchMe } = useAuthStore()

  useEffect(() => {
    if (token) fetchMe()
  }, [])

  return <RouterProvider router={router} />
}

export default App
