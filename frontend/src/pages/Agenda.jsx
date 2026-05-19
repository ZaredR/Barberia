import { useEffect, useState } from 'react'
import { reservasAPI } from '../api'
import dayjs from 'dayjs'

const estadoBadge = {
  pendiente:  'bg-yellow-900 text-yellow-300 border-yellow-700',
  confirmada: 'bg-blue-900 text-blue-300 border-blue-700',
  completada: 'bg-green-900 text-green-300 border-green-700',
  cancelada:  'bg-red-900 text-red-300 border-red-700',
}

const Agenda = () => {
  const [fecha,    setFecha]   = useState(dayjs().format('YYYY-MM-DD'))
  const [reservas, setReservas] = useState([])
  const [loading,  setLoading]  = useState(false)

  const fetchAgenda = async (f) => {
    setLoading(true)
    try {
      const { data } = await reservasAPI.getAll({ fecha: f })
      setReservas(data.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { fetchAgenda(fecha) }, [fecha])

  const cambiarDia = (delta) => {
    const nueva = dayjs(fecha).add(delta, 'day').format('YYYY-MM-DD')
    setFecha(nueva)
  }

  const cerrarReserva = async (id) => {
    if (!confirm('¿Cerrar esta reserva y generar la venta?')) return
    try {
      await reservasAPI.cerrar(id)
      fetchAgenda(fecha)
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const cancelarReserva = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return
    try {
      await reservasAPI.remove(id)
      fetchAgenda(fecha)
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  return (
    <div className="space-y-5">
      {/* Navegación de fecha */}
      <div className="flex items-center gap-4">
        <button onClick={() => cambiarDia(-1)}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition">←</button>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold text-white capitalize">
            {dayjs(fecha).format('dddd, D [de] MMMM [de] YYYY')}
          </h2>
          {fecha !== dayjs().format('YYYY-MM-DD') && (
            <button onClick={() => setFecha(dayjs().format('YYYY-MM-DD'))}
              className="text-xs text-amber-400 hover:underline mt-0.5">
              Ir a hoy
            </button>
          )}
        </div>
        <button onClick={() => cambiarDia(1)}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition">→</button>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Lista de reservas */}
      {loading ? (
        <div className="text-gray-400 animate-pulse">Cargando agenda...</div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">📅</p>
          <p>Sin reservas para este día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r) => (
            <div key={r.reserva_id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
              {/* Hora */}
              <div className="text-center w-16 shrink-0">
                <p className="text-lg font-bold text-amber-400">{r.hora?.slice(0,5)}</p>
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="font-semibold text-white">{r.cliente_nombre}</p>
                <p className="text-sm text-gray-400">{r.tipo_servicio} · {r.barbero}</p>
                <p className="text-xs text-gray-500">{r.cliente_telefono}</p>
                {r.notas && <p className="text-xs text-gray-400 italic mt-1">"{r.notas}"</p>}
              </div>

              {/* Precio */}
              <div className="text-right shrink-0">
                <p className="text-amber-400 font-semibold">${Number(r.precio_servicio).toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${estadoBadge[r.estado] || ''}`}>
                  {r.estado}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 shrink-0">
                {(r.estado === 'pendiente' || r.estado === 'confirmada') && (
                  <button
                    onClick={() => cerrarReserva(r.reserva_id)}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition"
                  >
                    ✓ Completar
                  </button>
                )}
                {r.estado !== 'cancelada' && r.estado !== 'completada' && (
                  <button
                    onClick={() => cancelarReserva(r.reserva_id)}
                    className="text-xs bg-gray-700 hover:bg-red-700 text-gray-300 px-3 py-1.5 rounded-lg transition"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Agenda
