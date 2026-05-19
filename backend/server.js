require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const errorMiddleware  = require('./middlewares/error.middleware');
const loggerMiddleware = require('./middlewares/logger.middleware');

// Rutas
const authRoutes      = require('./modules/auth/auth.routes');
const usuariosRoutes  = require('./modules/usuarios/usuarios.routes');
const reservasRoutes  = require('./modules/reservas/reservas.routes');
const ventasRoutes    = require('./modules/ventas/ventas.routes');
const productosRoutes = require('./modules/productos/productos.routes');
const serviciosRoutes = require('./modules/servicios/servicios.routes');
const bitacoraRoutes  = require('./modules/bitacora/bitacora.routes');
const reportesRoutes  = require('./modules/reportes/reportes.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(loggerMiddleware);

// ── Rutas ───────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/usuarios',  usuariosRoutes);
app.use('/api/reservas',  reservasRoutes);
app.use('/api/ventas',    ventasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/bitacora',  bitacoraRoutes);
app.use('/api/reportes',  reportesRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Manejo de errores (debe ir al final) ────────────────────
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
