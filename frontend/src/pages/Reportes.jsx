import { useEffect, useState } from 'react'
import { reportesAPI } from '../api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts'
import dayjs from 'dayjs'

const COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#f97316']

const Reportes = () => {
  const [ventasDia,   setVentasDia]   = useState([])
  const [barberos,    setBarberos]    = useState([])
  const [serviciosTop,setServiciosTop]= useState([])
  const [desde, setDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [hasta,  setHasta]  = useState(dayjs().format('YYYY-MM-DD'))
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = { desde, hasta }
      const [v, b, s] = await Promise.all([
        reportesAPI.ventasPorDia(params),
        reportesAPI.ingresosPorBarbero(params),
        reportesAPI.serviciosMasSolicitados(params),
      ])
      setVentasDia(v.data.data)
      setBarberos(b.data.data)
      setServiciosTop(s.data.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [desde, hasta])

  const totalPeriodo = ventasDia.reduce((s, d) => s + Number(d.total), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Reportes</h2>

      {/* Filtro de fechas */}
      <div className="flex gap-3 items-center flex-wrap">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400" />
        </div>
        <div className="mt-4">
          <p className="text-xs text-gray-400">Total del período</p>
          <p className="text-2xl font-bold text-amber-400">${totalPeriodo.toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 animate-pulse">Cargando reportes...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas por día */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Ventas por día</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ventasDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="fecha" tick={{ fill: '#9ca3af', fontSize: 10 }}
                       tickFormatter={(v) => dayjs(v).format('DD/MM')} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                         formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Total']} />
                <Bar dataKey="total" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Servicios más solicitados */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Servicios más solicitados</h3>
            {serviciosTop.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-10">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={serviciosTop} dataKey="total" nameKey="tipo_servicio"
                       cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) =>
                         `${name} ${(percent*100).toFixed(0)}%`}>
                    {serviciosTop.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Ingresos por barbero */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Ingresos por barbero</h3>
            {barberos.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Sin datos para el período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 text-xs uppercase">
                    <tr>
                      {['Barbero','Citas completadas','Ingresos brutos','Comisión'].map((h) => (
                        <th key={h} className="pb-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {barberos.map((b, i) => (
                      <tr key={i}>
                        <td className="py-2 text-white font-medium">{b.barbero}</td>
                        <td className="py-2 text-gray-300">{b.total_citas}</td>
                        <td className="py-2 text-amber-400 font-semibold">${Number(b.ingresos_brutos).toFixed(2)}</td>
                        <td className="py-2 text-green-400">${Number(b.comision).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Reportes
