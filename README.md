# 💈 Barbería — Sistema de gestión

Sistema de reservas, ventas e inventario para barbería. Backend en Node.js + Express, base de datos PostgreSQL desplegada en Supabase.

## Stack

- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL (Supabase)
- **Frontend:** React + Vite + Tailwind CSS
- **Auth:** JWT + bcrypt
- **Deploy:** Render (backend) + Vercel (frontend)

## Estructura

```
barberia/
├── backend/    # API REST Node.js + Express
└── frontend/   # React + Vite
```

## Inicio rápido

### Backend
```bash
cd backend
cp .env.example .env   # Configurar DATABASE_URL y JWT_SECRET
npm install
npm run dev            # http://localhost:3000
```

### Frontend
```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev            # http://localhost:5173
```

## Credenciales de prueba

| Usuario | Password     | Rol   |
|---------|--------------|-------|
| admin   | Admin123!    | Admin |
| carlos  | Carlos123!   | Barbero |
| ana     | Ana123!      | Recepcionista |

## Módulos

- **Dashboard** — Resumen del día con gráficas
- **Agenda** — Vista de citas por día con navegación
- **Reservas** — CRUD completo de citas
- **Ventas** — Registro de ventas con carrito
- **Productos** — Inventario con alertas de stock
- **Servicios** — Catálogo de servicios
- **Reportes** — Gráficas de ingresos y estadísticas
- **Bitácora** — Log de auditoría completo (solo admin)
- **Usuarios** — Gestión de usuarios y roles (solo admin)
