import { useEffect, useState } from 'react'
import { bitacoraAPI } from '../api'
import dayjs from 'dayjs'

const accionColor = {
  INSERT:  'bg-green-900 text-green-300',
  UPDATE:  'bg-blue-900 text-blue-300',
  DELETE:  'bg-red-900 text-red-300',
  LOGIN:   'bg-purple-900 text-purple-300',
  LOGOUT:  'bg-gray-700 text-gray-300',
  ERROR:   'bg-orange-900 text-orange-300',
}

const Bitacora = () => {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [filtros, setFiltros] = useState({ tabla: '', accion: '', limit: 100 })

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtros.tabla)  params.tabla  = filtros.tabla
      if (filtros.accion) params.accion = filtros.accion
      params.limit = filtros.limit
      const { data } = await bitacoraAPI.getAll(params)
      setLogs(data.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [filtros])

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Bitácora de movimientos</h2>

      <div className="flex gap-3 flex-wrap">
        <select value={filtros.tabla}
          onChange={(e) => setFiltros((f) => ({ ...f, tabla: e.target.value }))}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400">
          <option value="">Todas las tablas</option>
          {['reservas','ventas','usuario','producto','servicio'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select value={filtros.accion}
          onChange={(e) => setFiltros((f) => ({ ...f, accion: e.target.value }))}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400">
          <option value="">Todas las acciones</option>
          {['INSERT','UPDATE','DELETE','LOGIN','LOGOUT','ERROR'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select value={filtros.limit}
          onChange={(e) => setFiltros((f) => ({ ...f, limit: e.target.value }))}
          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400">
          {[50, 100, 200, 500].map((l) => <option key={l} value={l}>Últimos {l}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              {['Fecha/Hora','Tabla','Acción','Reg. ID','Descripción','Usuario'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Sin registros</td></tr>
            ) : logs.map((l) => (
              <tr key={l.bitacora_id}
                className="hover:bg-gray-800/50 transition cursor-pointer"
                onClick={() => setDetalle(l)}>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {dayjs(l.fecha_hora).format('DD/MM/YY HH:mm:ss')}
                </td>
                <td className="px-4 py-3 text-gray-300">{l.tabla_afectada}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${accionColor[l.accion] || ''}`}>
                    {l.accion}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{l.registro_id ?? '—'}</td>
                <td className="px-4 py-3 text-gray-300 max-w-xs truncate">{l.descripcion}</td>
                <td className="px-4 py-3 text-gray-400">{l.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detalle modal */}
      {detalle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h3 className="font-bold text-white">Detalle del registro #{detalle.bitacora_id}</h3>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-400 text-xs">Tabla</p><p className="text-white">{detalle.tabla_afectada}</p></div>
                <div><p className="text-gray-400 text-xs">Acción</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${accionColor[detalle.accion]}`}>{detalle.accion}</span>
                </div>
                <div><p className="text-gray-400 text-xs">Usuario</p><p className="text-white">{detalle.usuario} (@{detalle.username})</p></div>
                <div><p className="text-gray-400 text-xs">Fecha</p><p className="text-white">{dayjs(detalle.fecha_hora).format('DD/MM/YYYY HH:mm:ss')}</p></div>
              </div>
              <div><p className="text-gray-400 text-xs mb-1">Descripción</p><p className="text-white">{detalle.descripcion}</p></div>
              {detalle.dato_anterior && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Dato anterior</p>
                  <pre className="bg-gray-800 rounded-lg p-3 text-xs text-gray-300 overflow-auto max-h-40">
                    {JSON.stringify(detalle.dato_anterior, null, 2)}
                  </pre>
                </div>
              )}
              {detalle.dato_nuevo && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Dato nuevo</p>
                  <pre className="bg-gray-800 rounded-lg p-3 text-xs text-gray-300 overflow-auto max-h-40">
                    {JSON.stringify(detalle.dato_nuevo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Bitacora
