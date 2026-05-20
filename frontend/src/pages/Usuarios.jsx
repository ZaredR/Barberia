import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { usuariosAPI } from '../api'

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
      <div className="flex items-center justify-between p-5 border-b border-gray-800">
        <h3 className="font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)

const rolColor = {
  admin:   'bg-amber-900 text-amber-300',
  barbero: 'bg-blue-900 text-blue-300',
}

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [roles,    setRoles]    = useState([])
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [loading,  setLoading]  = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([usuariosAPI.getAll(), usuariosAPI.getRoles()])
      setUsuarios(u.data.data)
      setRoles(r.data.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => { setEditing(null); reset({}); setModal(true) }
  const openEdit   = (u)  => {
    setEditing(u)
    reset({ nombre: u.nombre, gmail: u.gmail, porcentaje_ganancia: u.porcentaje_ganancia,
            activo: u.activo, rol_id: u.rol_id })
    setModal(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editing) await usuariosAPI.update(editing.usuario_id, data)
      else         await usuariosAPI.create(data)
      setModal(false); fetchAll()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const onToggle = async (u) => {
    try { await usuariosAPI.update(u.usuario_id, { activo: !u.activo }); fetchAll() }
    catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const inputCls = 'w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Usuarios</h2>
        <button onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition">
          + Nuevo usuario
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              {['Nombre','Username','Email','Rol','% Ganancia','Estado','Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : usuarios.map((u) => (
              <tr key={u.usuario_id} className={`hover:bg-gray-800/50 transition ${!u.activo ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 text-white font-medium">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-400">@{u.username}</td>
                <td className="px-4 py-3 text-gray-400">{u.gmail}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${rolColor[u.rol] || ''}`}>{u.rol}</span>
                </td>
                <td className="px-4 py-3 text-gray-300">{u.porcentaje_ganancia}%</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-3">
                  <button onClick={() => openEdit(u)} className="text-xs text-blue-400 hover:text-blue-300 transition">
                    Editar
                  </button>
                  <button onClick={() => onToggle(u)} className="text-xs text-gray-400 hover:text-amber-400 transition">
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={editing ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Nombre completo</label>
              <input {...register('nombre', { required: true })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Gmail</label>
              <input type="email" {...register('gmail', { required: true })} className={inputCls} />
            </div>
            {!editing && (
              <>
                <div>
                  <label className="text-xs text-gray-400">Username</label>
                  <input {...register('username', { required: true })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Contraseña</label>
                  <input type="password" {...register('password', { required: !editing })} className={inputCls} />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Rol</label>
                <select {...register('rol_id', { required: true })} className={inputCls}>
                  <option value="">Seleccionar...</option>
                  {roles.map((r) => <option key={r.rol_id} value={r.rol_id}>{r.descripcion_rol}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">% Ganancia del barbero</label>
                <input type="number" step="0.01" min="0" max="100"
                  {...register('porcentaje_ganancia')} className={inputCls} defaultValue={0} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)}
                className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-sm">Cancelar</button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 bg-amber-500 text-gray-900 font-semibold py-2 rounded-lg text-sm disabled:opacity-50">
                {isSubmitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Usuarios
