import { useEffect, useState } from 'react'
import { reportesAPI } from '../api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

const COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#f97316','#06b6d4']

const KpiCard = ({ label, value, sub, color = 'text-amber-400' }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
)

const Card = ({ title, children, span = '' }) => (
  <div className={`bg-gray-900 rounded-xl p-5 border border-gray-800 ${span}`}>
    <h3 className="text-sm font-semibold text-gray-400 mb-4">{title}</h3>
    {children}
  </div>
)

const Empty = () => <p className="text-gray-500 text-sm text-center py-10">Sin datos para el período</p>

const Reportes = () => {
  const [ventasDia,    setVentasDia]    = useState([])
  const [barberos,     setBarberos]     = useState([])
  const [serviciosTop, setServiciosTop] = useState([])
  const [productosTop, setProductosTop] = useState([])
  const [resumen,      setResumen]      = useState(null)
  const [desde, setDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [hasta,  setHasta]  = useState(dayjs().format('YYYY-MM-DD'))
  const [loading, setLoading] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = { desde, hasta }
      const [v, b, s, p, r] = await Promise.all([
        reportesAPI.ventasPorDia(params),
        reportesAPI.ingresosPorBarbero(params),
        reportesAPI.serviciosMasSolicitados(params),
        reportesAPI.productosVendidos(params),
        reportesAPI.resumenPeriodo(params),
      ])
      setVentasDia(v.data.data)
      setBarberos(b.data.data)
      setServiciosTop((s.data.data || []).map(x => ({ ...x, total: Number(x.total) })))
      setProductosTop(p.data.data)
      setResumen(r.data.data)
    } catch (e) { console.error('Error al cargar reportes:', e) }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [desde, hasta])

  const aplicarRango = (tipo) => {
    const hoy = dayjs()
    if (tipo === 'mes')      { setDesde(hoy.startOf('month').format('YYYY-MM-DD')); setHasta(hoy.format('YYYY-MM-DD')) }
    if (tipo === 'semana')   { setDesde(hoy.startOf('week').format('YYYY-MM-DD'));  setHasta(hoy.format('YYYY-MM-DD')) }
    if (tipo === 'anterior') { setDesde(hoy.subtract(1,'month').startOf('month').format('YYYY-MM-DD')); setHasta(hoy.subtract(1,'month').endOf('month').format('YYYY-MM-DD')) }
  }

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new()
    const fmt = (n) => Number(Number(n).toFixed(2))

    // Hoja 1: Resumen
    const wsResumen = XLSX.utils.aoa_to_sheet([
      ['REPORTE DE BARBERÍA'],
      [`Período: ${desde}  al  ${hasta}`],
      ['Generado:', new Date().toLocaleString('es-MX')],
      [],
      ['MÉTRICAS DEL PERÍODO'],
      ['Indicador', 'Valor'],
      ['Total Ingresos', fmt(resumen?.ventas?.total_ingresos ?? 0)],
      ['Número de Ventas', Number(resumen?.ventas?.num_ventas ?? 0)],
      ['Ticket Promedio', fmt(resumen?.ventas?.ticket_promedio ?? 0)],
      ['Venta Máxima', fmt(resumen?.ventas?.venta_maxima ?? 0)],
      [],
      ['Total Reservas', Number(resumen?.reservas?.total_reservas ?? 0)],
      ['Completadas', Number(resumen?.reservas?.completadas ?? 0)],
      ['Canceladas', Number(resumen?.reservas?.canceladas ?? 0)],
      ['Pendientes', Number(resumen?.reservas?.pendientes ?? 0)],
    ])
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    // Hoja 2: Ventas por día
    const wsVentas = XLSX.utils.aoa_to_sheet([
      ['Fecha', 'Total ($)', 'Núm. Ventas'],
      ...ventasDia.map(v => [v.fecha, fmt(v.total), Number(v.num_ventas)]),
      [],
      ['TOTAL', fmt(ventasDia.reduce((s,v) => s + Number(v.total), 0)), ventasDia.reduce((s,v) => s + Number(v.num_ventas), 0)],
    ])
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas por Día')

    // Hoja 3: Ingresos por barbero
    const wsBarberos = XLSX.utils.aoa_to_sheet([
      ['Barbero', 'Citas Completadas', 'Ingresos Brutos ($)', 'Comisión ($)'],
      ...barberos.map(b => [b.barbero, Number(b.total_citas), fmt(b.ingresos_brutos), fmt(b.comision)]),
    ])
    XLSX.utils.book_append_sheet(wb, wsBarberos, 'Por Barbero')

    // Hoja 4: Servicios más solicitados
    const wsServicios = XLSX.utils.aoa_to_sheet([
      ['Servicio', 'Veces Solicitado'],
      ...serviciosTop.map(s => [s.tipo_servicio, Number(s.total)]),
    ])
    XLSX.utils.book_append_sheet(wb, wsServicios, 'Servicios')

    // Hoja 5: Productos más vendidos
    if (productosTop.length > 0) {
      const wsProductos = XLSX.utils.aoa_to_sheet([
        ['Producto', 'Unidades Vendidas', 'Total Ingresos ($)'],
        ...productosTop.map(p => [p.nombre, Number(p.unidades), fmt(p.total)]),
      ])
      XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos')
    }

    XLSX.writeFile(wb, `Reporte_Barberia_${desde}_${hasta}.xlsx`)
  }

  const totalPeriodo  = resumen ? Number(resumen.ventas?.total_ingresos ?? 0) : 0
  const numVentas     = resumen ? Number(resumen.ventas?.num_ventas ?? 0) : 0
  const ticketProm    = resumen ? Number(resumen.ventas?.ticket_promedio ?? 0) : 0
  const tasaCompletadas = resumen && Number(resumen.reservas?.total_reservas) > 0
    ? ((Number(resumen.reservas.completadas) / Number(resumen.reservas.total_reservas)) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Reportes</h2>
        <button
          onClick={exportarExcel}
          disabled={loading || !resumen}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          ⬇ Exportar Excel
        </button>
      </div>

      {/* Filtros de fecha */}
      <div className="flex gap-3 items-end flex-wrap">
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
        <div className="flex gap-2">
          {[['semana','Esta semana'],['mes','Este mes'],['anterior','Mes anterior']].map(([k,l]) => (
            <button key={k} onClick={() => aplicarRango(k)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition">
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 animate-pulse">Cargando reportes...</p>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Ingresos del período" value={`$${totalPeriodo.toFixed(2)}`} sub={`${numVentas} ventas`} />
            <KpiCard label="Ticket promedio" value={`$${ticketProm.toFixed(2)}`} color="text-blue-400" />
            <KpiCard label="Tasa de completadas" value={`${tasaCompletadas}%`}
              sub={`${resumen?.reservas?.completadas ?? 0} de ${resumen?.reservas?.total_reservas ?? 0} reservas`}
              color="text-green-400" />
            <KpiCard label="Reservas canceladas" value={resumen?.reservas?.canceladas ?? 0}
              sub="en el período" color="text-red-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas por día */}
            <Card title="Ventas por día">
              {ventasDia.length === 0 ? <Empty /> : (
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
              )}
            </Card>

            {/* Servicios más solicitados */}
            <Card title="Servicios más solicitados">
              {serviciosTop.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={serviciosTop} dataKey="total" nameKey="tipo_servicio"
                         cx="50%" cy="42%" outerRadius={70}
                         label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                         labelLine={false}>
                      {serviciosTop.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [v, n]}
                      contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Ingresos por barbero — gráfica */}
            <Card title="Ingresos por barbero">
              {barberos.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barberos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }}
                           tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="barbero" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                             formatter={(v, n) => [`$${Number(v).toFixed(2)}`, n === 'ingresos_brutos' ? 'Ingresos' : 'Comisión']} />
                    <Bar dataKey="ingresos_brutos" name="Ingresos" fill="#f59e0b" radius={[0,4,4,0]} />
                    <Bar dataKey="comision" name="Comisión" fill="#10b981" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Productos más vendidos */}
            <Card title="Productos más vendidos">
              {productosTop.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={productosTop} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis type="category" dataKey="nombre" tick={{ fill: '#9ca3af', fontSize: 10 }} width={90} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                             formatter={(v) => [v, 'Unidades']} />
                    <Bar dataKey="unidades" fill="#8b5cf6" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Tabla barberos */}
            <Card title="Detalle por barbero" span="lg:col-span-2">
              {barberos.length === 0 ? <Empty /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400 text-xs uppercase border-b border-gray-800">
                      <tr>
                        {['Barbero','Citas','Ingresos brutos','Comisión','% Eficiencia'].map(h => (
                          <th key={h} className="pb-2 text-left pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {barberos.map((b, i) => {
                        const pct = Number(b.ingresos_brutos) > 0
                          ? ((Number(b.comision) / Number(b.ingresos_brutos)) * 100).toFixed(1)
                          : 0
                        return (
                          <tr key={i} className="hover:bg-gray-800/40">
                            <td className="py-2 text-white font-medium pr-4">{b.barbero}</td>
                            <td className="py-2 text-gray-300 pr-4">{b.total_citas}</td>
                            <td className="py-2 text-amber-400 font-semibold pr-4">${Number(b.ingresos_brutos).toFixed(2)}</td>
                            <td className="py-2 text-green-400 pr-4">${Number(b.comision).toFixed(2)}</td>
                            <td className="py-2 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                                  <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-gray-400 text-xs w-10">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default Reportes
