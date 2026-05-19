import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { reservasAPI, serviciosAPI, usuariosAPI } from '../api'
import dayjs from 'dayjs'

const estadoBadge = {
  pendiente:  'bg-yellow-900 text-yellow-300',
  confirmada: 'bg-blue-900 text-blue-300',
  completada: 'bg-green-900 text-green-300',
  cancelada:  'bg-red-900 text-red-400',
}

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

const Reservas = () => {
  const [reservas,  setReservas]  = useState([])
  const [servicios, setServicios] = useState([])
  const [barberos,  setBarberos]  = useState([])
  const [estados,   setEstados]   = useState([])
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [filtros,   setFiltros]   = useState({ fecha: '', estado_id: '' })
  const [loading,   setLoading]   = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtros.fecha)    params.fecha    = filtros.fecha
      if (filtros.estado_id) params.estado_id = filtros.estado_id
      const { data } = await reservasAPI.getAll(params)
      setReservas(data.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    Promise.all([
      serviciosAPI.getAll(),
      usuariosAPI.getAll(),
      reservasAPI.getEstados(),
    ]).then(([s, u, e]) => {
      setServicios(s.data.data)
      setBarberos(u.data.data.filter((u) => u.rol === 'barbero'))
      setEstados(e.data.data)
    })
  }, [])

  useEffect(() => { fetchAll() }, [filtros])

  const openCreate = () => { setEditing(null); reset({}); setModal(true) }
  const openEdit   = (r)  => {
    setEditing(r)
    reset({
      fecha: r.fecha, hora: r.hora?.slice(0,5),
      cliente_nombre: r.cliente_nombre, cliente_telefono: r.cliente_telefono,
      notas: r.notas, servicio_id: r.servicio_id, barbero_id: r.barbero_id,
    })
    setModal(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await reservasAPI.update(editing.reserva_id, data)
      } else {
        await reservasAPI.create(data)
      }
      setModal(false)
      fetchAll()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const onDelete = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return
    try { await reservasAPI.remove(id); fetchAll() }
    catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Reservas</h2>
        <button onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition">
          + Nueva reserva
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <input type="date" value={filtros.fecha}
          onChange={(e) => setFiltros((f) => ({ ...f, fecha: e.target.value }))}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400" />
        <select value={filtros.estado_id}
          onChange={(e) => setFiltros((f) => ({ ...f, estado_id: e.target.value }))}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400">
          <option value="">Todos los estados</option>
          {estados.map((e) => <option key={e.estado_id} value={e.estado_id}>{e.descripcion_estado}</option>)}
        </select>
        <button onClick={() => setFiltros({ fecha: '', estado_id: '' })}
          className="text-sm text-gray-400 hover:text-white transition">Limpiar</button>
      </div>

      {/* Tabla */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              {['#','Fecha','Hora','Cliente','Servicio','Barbero','Estado','Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : reservas.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Sin reservas</td></tr>
            ) : reservas.map((r) => (
              <tr key={r.reserva_id} className="hover:bg-gray-800/50 transition">
                <td className="px-4 py-3 text-gray-500">{r.reserva_id}</td>
                <td className="px-4 py-3 text-white">{dayjs(r.fecha).format('DD/MM/YY')}</td>
                <td className="px-4 py-3 text-amber-400">{r.hora?.slice(0,5)}</td>
                <td className="px-4 py-3 text-white">
                  <p>{r.cliente_nombre}</p>
                  <p className="text-xs text-gray-500">{r.cliente_telefono}</p>
                </td>
                <td className="px-4 py-3 text-gray-300">{r.tipo_servicio}</td>
                <td className="px-4 py-3 text-gray-300">{r.barbero}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${estadoBadge[r.estado] || ''}`}>
                    {r.estado}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  {r.estado !== 'completada' && r.estado !== 'cancelada' && (
                    <button onClick={() => openEdit(r)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition">Editar</button>
                  )}
                  {r.estado !== 'cancelada' && r.estado !== 'completada' && (
                    <button onClick={() => onDelete(r.reserva_id)}
                      className="text-xs text-red-400 hover:text-red-300 transition">Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={editing ? 'Editar reserva' : 'Nueva reserva'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400">Fecha</label>
                <input type="date" {...register('fecha', { required: true })}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Hora</label>
                <input type="time" {...register('hora', { required: true })}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400">Nombre del cliente</label>
              <input {...register('cliente_nombre', { required: true })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Teléfono</label>
              <input {...register('cliente_telefono', { required: true })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Servicio</label>
              <select {...register('servicio_id', { required: true })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400">
                <option value="">Seleccionar...</option>
                {servicios.map((s) => (
                  <option key={s.servicio_id} value={s.servicio_id}>{s.tipo_servicio} — ${s.precio}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Barbero</label>
              <select {...register('barbero_id', { required: true })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400">
                <option value="">Seleccionar...</option>
                {barberos.map((b) => (
                  <option key={b.usuario_id} value={b.usuario_id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Notas (opcional)</label>
              <textarea {...register('notas')} rows={2}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 font-semibold py-2 rounded-lg text-sm transition">
                {isSubmitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Reservas
