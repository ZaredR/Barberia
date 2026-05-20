import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { reservasAPI, serviciosAPI, usuariosAPI } from '../api'
import useAuthStore from '../store/auth.store'
import dayjs from 'dayjs'

// Slots de 11:00 a 20:00 cada 30 minutos
const SLOTS = []
for (let h = 11; h <= 20; h++) {
  for (let m = 0; m < 60; m += 30) {
    if (h === 20 && m > 0) break
    SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

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

const inputCls = 'w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400'

const Reservas = () => {
  const user    = useAuthStore((s) => s.user)
  const isAdmin = user?.rol === 'admin'

  const [reservas,  setReservas]  = useState([])
  const [servicios, setServicios] = useState([])
  const [barberos,  setBarberos]  = useState([])
  const [estados,   setEstados]   = useState([])
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [filtros,   setFiltros]   = useState({ fecha: '', estado_id: '' })
  const [loading,   setLoading]   = useState(false)
  const [ocupadas,      setOcupadas]      = useState(new Set())
  const [fechaModal,    setFechaModal]    = useState('')
  const [barberoModal,  setBarberoModal]  = useState('')
  const [loadingHoras,  setLoadingHoras]  = useState(false)

  const { register, handleSubmit, reset, setValue, control, formState: { isSubmitting } } = useForm()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtros.fecha)     params.fecha     = filtros.fecha
      if (filtros.estado_id) params.estado_id = filtros.estado_id
      const { data } = await reservasAPI.getAll(params)
      setReservas(data.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    fetchAll()
    const loadCatalogos = async () => {
      try {
        const [s, e] = await Promise.all([
          serviciosAPI.getAll(),
          reservasAPI.getEstados(),
        ])
        setServicios(s.data.data)
        setEstados(e.data.data)
      } catch (_) {}

      if (isAdmin) {
        try {
          const u = await usuariosAPI.getAll()
          setBarberos(u.data.data.filter((b) => b.rol === 'barbero'))
        } catch (_) {}
      }
    }
    loadCatalogos()
  }, [])

  useEffect(() => { fetchAll() }, [filtros])

  const cargarOcupadas = async (fecha, barberoId, excluirId = null) => {
    if (!fecha || !barberoId) { setOcupadas(new Set()); return }
    setLoadingHoras(true)
    try {
      const { data } = await reservasAPI.getAll({ fecha })
      const set = new Set(
        (data.data || [])
          .filter(r =>
            r.estado !== 'cancelada' &&
            String(r.barbero_id) === String(barberoId) &&
            (!excluirId || r.reserva_id !== excluirId)
          )
          .map(r => r.hora?.slice(0, 5))
      )
      setOcupadas(set)
    } catch { setOcupadas(new Set()) }
    finally { setLoadingHoras(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setFechaModal('')
    setBarberoModal('')
    setOcupadas(new Set())
    reset({})
    setModal(true)
  }

  const openEdit = (r) => {
    const f = dayjs(r.fecha).format('YYYY-MM-DD')
    const barberoId = isAdmin ? r.barbero_id : user?.usuario_id
    setEditing(r)
    setFechaModal(f)
    if (isAdmin) setBarberoModal(String(r.barbero_id))
    reset({
      fecha:            f,
      hora:             r.hora?.slice(0, 5),
      cliente_nombre:   r.cliente_nombre,
      cliente_telefono: r.cliente_telefono,
      notas:            r.notas ?? '',
      servicio_id:      String(r.servicio_id),
      barbero_id:       isAdmin ? String(r.barbero_id) : String(user?.usuario_id),
    })
    cargarOcupadas(f, barberoId, r.reserva_id)
    setModal(true)
  }

  const onSubmit = async (data) => {
    try {
      const payload = { ...data }
      if (!isAdmin) payload.barbero_id = user?.usuario_id
      if (editing) {
        await reservasAPI.update(editing.reserva_id, payload)
      } else {
        await reservasAPI.create(payload)
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
                <td className="px-4 py-3 text-amber-400">{r.hora?.slice(0, 5)}</td>
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
            <div>
              <label className="text-xs text-gray-400">Fecha</label>
              <input type="date" {...register('fecha', { required: true })}
                onChange={(e) => {
                  const f = e.target.value
                  setValue('fecha', f)
                  setFechaModal(f)
                  setValue('hora', '')
                  const barberoId = isAdmin ? barberoModal : user?.usuario_id
                  cargarOcupadas(f, barberoId, editing?.reserva_id ?? null)
                }}
                className={inputCls} />
            </div>

            {fechaModal && (
              <div>
                <label className="text-xs text-gray-400">Hora disponible</label>
                {loadingHoras ? (
                  <p className="mt-1 text-sm text-gray-500 animate-pulse">Cargando horarios...</p>
                ) : (
                  <select {...register('hora', { required: true })} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {SLOTS.filter(slot => !ocupadas.has(slot)).map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400">Nombre del cliente</label>
              <input {...register('cliente_nombre', { required: true })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Teléfono</label>
              <input {...register('cliente_telefono', { required: true })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Servicio</label>
              <Controller
                name="servicio_id"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <select {...field} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {servicios.map((s) => (
                      <option key={s.servicio_id} value={String(s.servicio_id)}>
                        {s.tipo_servicio} — ${s.precio}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {isAdmin ? (
              <div>
                <label className="text-xs text-gray-400">Barbero</label>
                <select {...register('barbero_id', { required: true })}
                  onChange={(e) => {
                    const bid = e.target.value
                    setValue('barbero_id', bid)
                    setBarberoModal(bid)
                    cargarOcupadas(fechaModal, bid, editing?.reserva_id ?? null)
                  }}
                  className={inputCls}>
                  <option value="">Seleccionar...</option>
                  {barberos.map((b) => (
                    <option key={b.usuario_id} value={b.usuario_id}>{b.nombre}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs text-gray-400">Barbero</label>
                <p className="w-full mt-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-sm">
                  {user?.nombre}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400">Notas (opcional)</label>
              <textarea {...register('notas')} rows={2} className={`${inputCls} resize-none`} />
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
