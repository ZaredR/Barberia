import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { productosAPI } from '../api'

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

const Productos = () => {
  const [productos,  setProductos]  = useState([])
  const [modal,      setModal]      = useState(false)
  const [modalStock, setModalStock] = useState(null)
  const [editing,    setEditing]    = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [stockBajo,  setStockBajo]  = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()
  const { register: rStock, handleSubmit: hsStock, reset: resetStock } = useForm()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data } = await productosAPI.getAll(stockBajo ? { stock_bajo: 'true' } : {})
      setProductos(data.data)
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [stockBajo])

  const openCreate = () => { setEditing(null); reset({}); setModal(true) }
  const openEdit   = (p)  => {
    setEditing(p)
    reset({ nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, stock: p.stock, stock_min: p.stock_min })
    setModal(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editing) await productosAPI.update(editing.producto_id, data)
      else         await productosAPI.create(data)
      setModal(false)
      fetchAll()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const onAjustarStock = async (data) => {
    try {
      await productosAPI.ajustarStock(modalStock.producto_id, { cantidad: Number(data.cantidad) })
      setModalStock(null)
      fetchAll()
    } catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const onDelete = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return
    try { await productosAPI.remove(id); fetchAll() }
    catch (e) { alert(e.response?.data?.message || 'Error') }
  }

  const inputCls = 'w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Productos / Inventario</h2>
        <button onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition">
          + Nuevo producto
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
        <input type="checkbox" checked={stockBajo} onChange={(e) => setStockBajo(e.target.checked)}
          className="accent-amber-400" />
        Solo productos con stock bajo
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-400 animate-pulse col-span-3">Cargando...</p>
        ) : productos.length === 0 ? (
          <p className="text-gray-500 col-span-3 text-center py-10">Sin productos</p>
        ) : productos.map((p) => (
          <div key={p.producto_id}
            className={`bg-gray-900 border rounded-xl p-4 ${
              p.stock <= p.stock_min ? 'border-red-700' : 'border-gray-800'
            }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{p.nombre}</p>
                {p.descripcion && <p className="text-xs text-gray-400 mt-0.5">{p.descripcion}</p>}
              </div>
              <p className="text-amber-400 font-bold">${Number(p.precio).toFixed(2)}</p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Stock</p>
                <p className={`text-lg font-bold ${p.stock <= p.stock_min ? 'text-red-400' : 'text-green-400'}`}>
                  {p.stock}
                  {p.stock <= p.stock_min && <span className="text-xs ml-1">⚠️</span>}
                </p>
                <p className="text-xs text-gray-500">Mín: {p.stock_min}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => { setModalStock(p); resetStock() }}
                  className="text-xs bg-blue-800 hover:bg-blue-700 text-blue-200 px-3 py-1 rounded-lg transition">
                  Ajustar stock
                </button>
                <button onClick={() => openEdit(p)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-lg transition">
                  Editar
                </button>
                <button onClick={() => onDelete(p.producto_id)}
                  className="text-xs text-red-400 hover:text-red-300 transition text-right">
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <Modal title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Nombre</label>
              <input {...register('nombre', { required: true })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Descripción</label>
              <input {...register('descripcion')} className={inputCls} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400">Precio</label>
                <input type="number" step="0.01" {...register('precio', { required: true })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-400">Stock</label>
                <input type="number" {...register('stock')} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-400">Stock mín.</label>
                <input type="number" {...register('stock_min')} className={inputCls} />
              </div>
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

      {/* Modal ajustar stock */}
      {modalStock && (
        <Modal title={`Stock: ${modalStock.nombre}`} onClose={() => setModalStock(null)}>
          <p className="text-sm text-gray-400 mb-4">
            Stock actual: <span className="text-white font-bold">{modalStock.stock}</span>.
            Ingresa un número positivo para sumar o negativo para restar.
          </p>
          <form onSubmit={hsStock(onAjustarStock)} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400">Cantidad a ajustar</label>
              <input type="number" {...rStock('cantidad', { required: true })}
                className={inputCls} placeholder="Ej: 10 o -3" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModalStock(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition">
                Cancelar
              </button>
              <button type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold py-2 rounded-lg text-sm transition">
                Ajustar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Productos
