import { useEffect, useState } from 'react'
import { ventasAPI, serviciosAPI, productosAPI } from '../api'
import dayjs from 'dayjs'

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

const Ventas = () => {
  const [ventas,      setVentas]      = useState([])
  const [servicios,   setServicios]   = useState([])
  const [productos,   setProductos]   = useState([])
  const [modal,       setModal]       = useState(false)
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [detalle,     setDetalle]     = useState(null)
  const [loadingDet,  setLoadingDet]  = useState(false)

  const fetchVentas = async () => {
    setLoading(true)
    try {
      const params = {}
      if (fechaFiltro) params.fecha = fechaFiltro
      const { data } = await ventasAPI.getAll(params)
      setVentas(data.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    fetchVentas()
    Promise.all([serviciosAPI.getAll(), productosAPI.getAll()])
      .then(([s, p]) => { setServicios(s.data.data); setProductos(p.data.data) })
  }, [])

  useEffect(() => { fetchVentas() }, [fechaFiltro])

  const addItem = (tipo, id, cantidad = 1) => {
    if (!id) return
    const existe = items.find((i) => i.tipo === tipo && i.id === Number(id))
    if (existe) {
      setItems(items.map((i) =>
        i.tipo === tipo && i.id === Number(id) ? { ...i, cantidad: i.cantidad + cantidad } : i
      ))
    } else {
      const catalogo = tipo === 'servicio' ? servicios : productos
      const item = catalogo.find((x) => x[tipo === 'servicio' ? 'servicio_id' : 'producto_id'] === Number(id))
      setItems([...items, { tipo, id: Number(id), nombre: item?.tipo_servicio || item?.nombre, precio: item?.precio, cantidad }])
    }
  }

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0)

  const onGuardar = async () => {
    if (!items.length) return alert('Agrega al menos un item')
    setSaving(true)
    try {
      await ventasAPI.create({
        items: items.map((i) => ({ tipo: i.tipo, id: i.id, cantidad: i.cantidad })),
      })
      setModal(false)
      setItems([])
      fetchVentas()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
    setSaving(false)
  }

  const verDetalle = async (id) => {
    setDetalle(null)
    setLoadingDet(true)
    try {
      const { data } = await ventasAPI.getById(id)
      setDetalle(data.data)
    } catch (_) {}
    setLoadingDet(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Ventas</h2>
        <button onClick={() => { setItems([]); setModal(true) }}
          className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition">
          + Nueva venta
        </button>
      </div>

      <div className="flex gap-3">
        <input type="date" value={fechaFiltro}
          onChange={(e) => setFechaFiltro(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400" />
        {fechaFiltro && (
          <button onClick={() => setFechaFiltro('')}
            className="text-sm text-gray-400 hover:text-white">Limpiar</button>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              {['#','Fecha','Cajero','Items','Total','Acciones'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : ventas.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Sin ventas</td></tr>
            ) : ventas.map((v) => (
              <tr key={v.venta_id} className="hover:bg-gray-800/50 transition">
                <td className="px-4 py-3 text-gray-500">{v.venta_id}</td>
                <td className="px-4 py-3 text-white">{dayjs(v.fecha).format('DD/MM/YY')}</td>
                <td className="px-4 py-3 text-gray-300">{v.cajero}</td>
                <td className="px-4 py-3 text-gray-400">{v.num_items}</td>
                <td className="px-4 py-3 text-amber-400 font-semibold">${Number(v.total).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => verDetalle(v.venta_id)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition">
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nueva venta */}
      {modal && (
        <Modal title="Nueva venta directa" onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Agregar servicio</label>
              <select onChange={(e) => { addItem('servicio', e.target.value); e.target.value = '' }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400">
                <option value="">Seleccionar servicio...</option>
                {servicios.map((s) => (
                  <option key={s.servicio_id} value={s.servicio_id}>
                    {s.tipo_servicio} — ${s.precio}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Agregar producto</label>
              <select onChange={(e) => { addItem('producto', e.target.value); e.target.value = '' }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400">
                <option value="">Seleccionar producto...</option>
                {productos.map((p) => (
                  <option key={p.producto_id} value={p.producto_id}>
                    {p.nombre} — ${p.precio} (stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            {items.length > 0 && (
              <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm text-white">{item.nombre}</p>
                      <p className="text-xs text-gray-400 capitalize">{item.tipo}</p>
                    </div>
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
                      <p className="text-amber-400 text-sm w-16 text-right">
                        ${(item.precio * item.cantidad).toFixed(2)}
                      </p>
                      <button onClick={() => removeItem(idx)}
                        className="text-gray-500 hover:text-red-400 text-xs">✕</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-amber-400 font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition">
                Cancelar
              </button>
              <button onClick={onGuardar} disabled={saving || !items.length}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-900 font-semibold py-2 rounded-lg text-sm transition">
                {saving ? 'Guardando...' : `Registrar $${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal detalle de venta */}
      {(detalle || loadingDet) && (
        <Modal
          title={detalle ? `Detalle — Venta #${detalle.venta_id}` : 'Cargando...'}
          onClose={() => { setDetalle(null); setLoadingDet(false) }}
        >
          {loadingDet ? (
            <p className="text-gray-400 text-sm text-center py-6 animate-pulse">Cargando...</p>
          ) : detalle && (
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{dayjs(detalle.fecha).format('DD/MM/YYYY')}</span>
                <span>Cajero: <span className="text-gray-200">{detalle.cajero}</span></span>
              </div>

              {/* Servicios */}
              {detalle.detalles?.filter(d => d.servicio_id).length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Servicios</p>
                  <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
                    {detalle.detalles.filter(d => d.servicio_id).map((d) => (
                      <div key={d.detalle_id} className="flex justify-between px-3 py-2">
                        <div>
                          <p className="text-sm text-white">{d.tipo_servicio}</p>
                          <p className="text-xs text-gray-400">x{d.cantidad} × ${Number(d.precio).toFixed(2)}</p>
                        </div>
                        <p className="text-amber-400 text-sm font-semibold">
                          ${Number(d.subtotal).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Productos */}
              {detalle.productos?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">Productos</p>
                  <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
                    {detalle.productos.map((p, i) => (
                      <div key={i} className="flex justify-between px-3 py-2">
                        <div>
                          <p className="text-sm text-white">{p.producto_nombre}</p>
                          <p className="text-xs text-gray-400">x{p.cantidad} × ${Number(p.precio).toFixed(2)}</p>
                        </div>
                        <p className="text-blue-400 text-sm font-semibold">
                          ${(Number(p.precio) * Number(p.cantidad)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="text-white font-semibold">Total</span>
                <span className="text-amber-400 text-lg font-bold">${Number(detalle.total).toFixed(2)}</span>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default Ventas
