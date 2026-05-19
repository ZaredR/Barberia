import { useEffect, useState } from 'react'
import { reportesAPI, reservasAPI } from '../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import dayjs from 'dayjs'

const StatCard = ({ label, value, sub, color = 'amber' }) => {
  const colors = {
    amber:  'border-amber-500 text-amber-400',
    green:  'border-green-500 text-green-400',
    blue:   'border-blue-500 text-blue-400',
    red:    'border-red-500 text-red-400',
  }
  return (
    <div className={`bg-gray-900 border-l-4 ${colors[color]} rounded-xl p-5`}>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color].split(' ')[1]}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

const Dashboard = () => {
  const [resumen, setResumen] = useState(null)
  const [grafica, setGrafica] = useState([])
  const [agenda,  setAgenda]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [r, g, a] = await Promise.all([
          reportesAPI.resumenHoy(),
          reportesAPI.ventasPorDia({
            desde: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
            hasta: dayjs().format('YYYY-MM-DD'),
          }),
          reservasAPI.getAll({ fecha: dayjs().format('YYYY-MM-DD') }),
        ])
        setResumen(r.data.data)
        setGrafica(g.data.data)
        setAgenda(a.data.data)
      } catch (_) {}
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return <div className="text-gray-400 animate-pulse">Cargando dashboard...</div>

  const estadoBadge = {
    pendiente:  'bg-yellow-900 text-yellow-300',
    confirmada: 'bg-blue-900 text-blue-300',
    completada: 'bg-green-900 text-green-300',
    cancelada:  'bg-red-900 text-red-300',
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Dashboard</h2>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Citas hoy"       value={resumen?.reservas?.total ?? 0}       color="amber" />
        <StatCard label="Completadas"     value={resumen?.reservas?.completadas ?? 0} color="green" />
        <StatCard label="Ventas del día"  value={`$${Number(resumen?.ventas?.total_dia ?? 0).toFixed(2)}`} color="blue" />
        <StatCard label="Stock bajo"      value={resumen?.stockBajo?.productos_stock_bajo ?? 0} color="red" sub="productos por reponer" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica ventas 7 días */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Ventas últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={grafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="fecha" tick={{ fill: '#9ca3af', fontSize: 11 }}
                     tickFormatter={(v) => dayjs(v).format('DD/MM')} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Total']}
              />
              <Bar dataKey="total" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Agenda hoy */}
        <div className="bg-gray-900 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">
            Agenda de hoy ({agenda.length} citas)
          </h3>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {agenda.length === 0 && (
              <p className="text-gray-500 text-sm">Sin citas para hoy</p>
            )}
            {agenda.map((r) => (
              <div key={r.reserva_id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm text-white font-medium">{r.cliente_nombre}</p>
                  <p className="text-xs text-gray-400">{r.tipo_servicio} · {r.barbero}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-400">{r.hora?.slice(0,5)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${estadoBadge[r.estado] || ''}`}>
                    {r.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
