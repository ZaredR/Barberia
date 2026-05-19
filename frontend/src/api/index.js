import api from './axios'

// ── Auth ────────────────────────────────────────────────────
export const authAPI = {
  login:  (data)  => api.post('/auth/login', data),
  logout: ()      => api.post('/auth/logout'),
  me:     ()      => api.get('/auth/me'),
}

// ── Usuarios ────────────────────────────────────────────────
export const usuariosAPI = {
  getAll:          ()       => api.get('/usuarios'),
  getById:         (id)     => api.get(`/usuarios/${id}`),
  getRoles:        ()       => api.get('/usuarios/roles'),
  create:          (data)   => api.post('/usuarios', data),
  update:          (id, d)  => api.put(`/usuarios/${id}`, d),
  updatePassword:  (id, d)  => api.patch(`/usuarios/${id}/password`, d),
  remove:          (id)     => api.delete(`/usuarios/${id}`),
}

// ── Reservas ────────────────────────────────────────────────
export const reservasAPI = {
  getAll:       (params)  => api.get('/reservas', { params }),
  getById:      (id)      => api.get(`/reservas/${id}`),
  getEstados:   ()        => api.get('/reservas/estados'),
  create:       (data)    => api.post('/reservas', data),
  update:       (id, d)   => api.put(`/reservas/${id}`, d),
  updateEstado: (id, d)   => api.patch(`/reservas/${id}/estado`, d),
  cerrar:       (id)      => api.post(`/reservas/${id}/cerrar`),
  remove:       (id)      => api.delete(`/reservas/${id}`),
}

// ── Ventas ──────────────────────────────────────────────────
export const ventasAPI = {
  getAll:   (params) => api.get('/ventas', { params }),
  getById:  (id)     => api.get(`/ventas/${id}`),
  create:   (data)   => api.post('/ventas', data),
  remove:   (id)     => api.delete(`/ventas/${id}`),
}

// ── Productos ───────────────────────────────────────────────
export const productosAPI = {
  getAll:       (params) => api.get('/productos', { params }),
  getById:      (id)     => api.get(`/productos/${id}`),
  create:       (data)   => api.post('/productos', data),
  update:       (id, d)  => api.put(`/productos/${id}`, d),
  ajustarStock: (id, d)  => api.patch(`/productos/${id}/stock`, d),
  remove:       (id)     => api.delete(`/productos/${id}`),
}

// ── Servicios ───────────────────────────────────────────────
export const serviciosAPI = {
  getAll:  ()       => api.get('/servicios'),
  getById: (id)     => api.get(`/servicios/${id}`),
  create:  (data)   => api.post('/servicios', data),
  update:  (id, d)  => api.put(`/servicios/${id}`, d),
  remove:  (id)     => api.delete(`/servicios/${id}`),
}

// ── Bitácora ────────────────────────────────────────────────
export const bitacoraAPI = {
  getAll: (params) => api.get('/bitacora', { params }),
}

// ── Reportes ────────────────────────────────────────────────
export const reportesAPI = {
  resumenHoy:            ()       => api.get('/reportes/hoy'),
  ventasPorDia:          (params) => api.get('/reportes/ventas-por-dia', { params }),
  ingresosPorBarbero:    (params) => api.get('/reportes/por-barbero', { params }),
  serviciosMasSolicitados:(params)=> api.get('/reportes/servicios-top', { params }),
}
