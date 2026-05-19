import { useEffect, useState } from 'react'
import { reservasAPI, productosAPI } from '../api'
import dayjs from 'dayjs'

const estadoBadge = {
  pendiente:  'bg-yellow-900 text-yellow-300 border-yellow-700',
  confirmada: 'bg-blue-900 text-blue-300 border-blue-700',
  completada: 'bg-green-900 text-green-300 border-green-700',
  cancelada:  'bg-red-900 text-red-300 border-red-700',
}

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
      <div className="flex items-center justify-between p-5 border-b border-gray-800">
        <h3 className="font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)

const Agenda = () => {
  const [fecha,       setFecha]       = useState(dayjs().format('YYYY-MM-DD'))
  const [reservas,    setReservas]    = useState([])
  const [loading,     setLoading]     = useState(false)
  const [productos,   setProductos]   = useState([])
  const [modalCerrar, setModalCerrar] = useState(null)
  const [items,       setItems]       = useState([])
  const [saving,      setSaving]      = useState(false)

  const fetchAgenda = async (f) => {
    setLoading(true)
    try {
      const { data } = await reservasAPI.getAll({ fecha: f })
      setReservas(data.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { fetchAgenda(fecha) }, [fecha])

  useEffect(() => {
    productosAPI.getAll().then(({ data }) => setProductos(data.data)).catch(() => {})
  }, [])

  const cambiarDia = (delta) => {
    setFecha(dayjs(fecha).add(delta, 'day').format('YYYY-MM-DD'))
  }

  const abrirModalCerrar = (reserva) => {
    setModalCerrar(reserva)
    setItems([])
  }

  const addProducto = (id) => {
    if (!id) return
    const existe = items.find(i => i.id === Number(id))
    if (existe) {
      setItems(items.map(i => i.id === Number(id) ? { ...i, cantidad: i.cantidad + 1 } : i))
    } else {
      const prod = productos.find(p => p.producto_id === Number(id))
      setItems([...items, { tipo: 'producto', id: Number(id), nombre: prod?.nombre, precio: prod?.precio, cantidad: 1 }])
    }
  }

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

  const cerrarReserva = async () => {
    if (!modalCerrar) return
    setSaving(true)
    try {
      await reservasAPI.cerrar(modalCerrar.reserva_id, items)
      setModalCerrar(null)
      setItems([])
      fetchAgenda(fecha)
    } catch (e) { alert(e.response?.data?.message || 'Error') }
    setSaving(false)
  }

  const cancelarReserva = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return
    try {
      await reservasAPI.remove(id)
      fetchAgenda(fecha)
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const totalExtras = items.reduce((s, i) => s + i.precio * i.cantidad, 0)

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
              <div className="text-center w-16 shrink-0">
                <p className="text-lg font-bold text-amber-400">{r.hora?.slice(0,5)}</p>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{r.cliente_nombre}</p>
                <p className="text-sm text-gray-400">{r.tipo_servicio} · {r.barbero}</p>
                <p className="text-xs text-gray-500">{r.cliente_telefono}</p>
                {r.notas && <p className="text-xs text-gray-400 italic mt-1">"{r.notas}"</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-amber-400 font-semibold">${Number(r.precio_servicio).toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${estadoBadge[r.estado] || ''}`}>
                  {r.estado}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                {(r.estado === 'pendiente' || r.estado === 'confirmada') && (
                  <button
                    onClick={() => abrirModalCerrar(r)}
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

      {/* Modal completar reserva */}
      {modalCerrar && (
        <Modal title="Completar reserva" onClose={() => setModalCerrar(null)}>
          <div className="space-y-4">
            {/* Resumen de la reserva */}
            <div className="bg-gray-800 rounded-lg p-3 space-y-1">
              <p className="text-white font-semibold">{modalCerrar.cliente_nombre}</p>
              <p className="text-gray-400 text-sm">{modalCerrar.tipo_servicio} · <span className="text-amber-400">${Number(modalCerrar.precio_servicio).toFixed(2)}</span></p>
              {modalCerrar.cliente_telefono && <p className="text-gray-500 text-xs">{modalCerrar.cliente_telefono}</p>}
            </div>

            {/* Agregar productos extra */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Agregar productos (opcional)</label>
              <select onChange={(e) => { addProducto(e.target.value); e.target.value = '' }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400">
                <option value="">Seleccionar producto...</option>
                {productos.map((p) => (
                  <option key={p.producto_id} value={p.producto_id}>
                    {p.nombre} — ${p.precio} (stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            {/* Carrito de productos extra */}
            {items.length > 0 && (
              <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2">
                    <p className="text-sm text-white">{item.nombre}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => item.cantidad > 1
                          ? setItems(items.map((i,j) => j===idx ? {...i, cantidad: i.cantidad-1} : i))
                          : removeItem(idx)}
                          className="w-6 h-6 bg-gray-700 rounded text-white text-xs hover:bg-gray-600">−</button>
                        <span className="text-white text-sm w-6 text-center">{item.cantidad}</span>
                        <button onClick={() => setItems(items.map((i,j) => j===idx ? {...i, cantidad: i.cantidad+1} : i))}
                          className="w-6 h-6 bg-gray-700 rounded text-white text-xs hover:bg-gray-600">+</button>
                      </div>
                      <p className="text-amber-400 text-sm w-16 text-right">${(item.precio * item.cantidad).toFixed(2)}</p>
                      <button onClick={() => removeItem(idx)} className="text-gray-500 hover:text-red-400 text-xs">✕</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-gray-400">Productos extra</span>
                  <span className="text-amber-400">+${totalExtras.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalCerrar(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition">
                Cancelar
              </button>
              <button onClick={cerrarReserva} disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition">
                {saving ? 'Cerrando...' : `Completar $${(Number(modalCerrar.precio_servicio) + totalExtras).toFixed(2)}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Agenda
