import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { serviciosAPI } from '../api'
import useAuthStore from '../store/auth.store'

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
      <div className="flex items-center justify-between p-5 border-b border-gray-800">
        <h3 className="font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)

const Servicios = () => {
  const isAdmin = useAuthStore((s) => s.user?.rol === 'admin')

  const [servicios, setServicios] = useState([])
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState(null)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const fetchAll = async () => {
    const { data } = await serviciosAPI.getAll()
    setServicios(data.data)
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = () => { setEditing(null); reset({}); setModal(true) }
  const openEdit   = (s)  => { setEditing(s); reset({ tipo_servicio: s.tipo_servicio, precio: s.precio }); setModal(true) }

  const onSubmit = async (data) => {
    try {
      if (editing) await serviciosAPI.update(editing.servicio_id, data)
      else         await serviciosAPI.create(data)
      setModal(false); fetchAll()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const onDelete = async (id) => {
    if (!confirm('¿Desactivar este servicio?')) return
    try { await serviciosAPI.remove(id); fetchAll() }
    catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const inputCls = 'w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Servicios</h2>
        {isAdmin && (
          <button onClick={openCreate}
            className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition">
            + Nuevo servicio
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {servicios.map((s) => (
          <div key={s.servicio_id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">💈 {s.tipo_servicio}</p>
              <p className="text-amber-400 font-bold mt-1">${Number(s.precio).toFixed(2)}</p>
            </div>
            {isAdmin && (
              <div className="flex flex-col gap-1.5">
                <button onClick={() => openEdit(s)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition">Editar</button>
                <button onClick={() => onDelete(s.servicio_id)}
                  className="text-xs text-red-400 hover:text-red-300 transition">Desactivar</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={editing ? 'Editar servicio' : 'Nuevo servicio'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400">Tipo de servicio</label>
              <input {...register('tipo_servicio', { required: true })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Precio</label>
              <input type="number" step="0.01" {...register('precio', { required: true })} className={inputCls} />
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

export default Servicios
