import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useAuthStore from '../store/auth.store'

const Login = () => {
  const { login } = useAuthStore()
  const navigate   = useNavigate()
  const [err, setErr] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      setErr('')
      await login(data.username, data.password)
      navigate('/app/dashboard')
    } catch (e) {
      setErr(e.response?.data?.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <span className="text-5xl">💈</span>
          <h1 className="text-2xl font-bold text-white mt-3">Barbería</h1>
          <p className="text-gray-400 text-sm mt-1">Sistema de gestión</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Usuario</label>
            <input
              {...register('username', { required: true })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
              placeholder="tu_usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              {...register('password', { required: true })}
              type="password"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {err && (
            <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 font-semibold py-2.5 rounded-lg transition"
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
