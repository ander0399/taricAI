# TaricAI — Arranque Rápido

## Requisitos
- Node.js 18+
- PostgreSQL 14+

---

## 1. Base de datos
```sql
CREATE DATABASE taricai_db;
```

---

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL y SMTP
npm run dev
```

El servidor arranca en `http://localhost:5000`  
En modo desarrollo, Sequelize sincroniza los modelos automáticamente (`sync({ alter: true })`).

---

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

La app arranca en `http://localhost:3000`

---

## Endpoints disponibles

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register-owner` | Crear empresa + owner | — |
| POST | `/api/auth/login` | Login | — |
| POST | `/api/auth/forgot-password` | Solicitar reset | — |
| POST | `/api/auth/reset-password` | Cambiar contraseña | — |
| POST | `/api/invitations/send` | Enviar invitación | owner, admin |
| GET  | `/api/invitations/validate` | Validar token | — |
| POST | `/api/invitations/accept` | Aceptar invitación | — |
| GET  | `/api/users` | Listar equipo | owner, admin |
| PATCH | `/api/users/:id/role` | Cambiar rol | owner |
| DELETE | `/api/users/:id` | Desactivar usuario | owner |
| POST | `/api/users/transfer-ownership` | Transferir propiedad | owner |
| POST | `/api/classifications` | Registrar clasificación | todos |
| GET  | `/api/classifications` | Historial paginado | todos |
| GET  | `/api/classifications/usage` | Resumen de uso mensual | todos |
| GET  | `/health` | Health check | — |

---

## Rutas del frontend

| Ruta | Descripción |
|------|-------------|
| `/register` | Registro de empresa + owner |
| `/login` | Inicio de sesión |
| `/forgot-password` | Recuperar contraseña |
| `/reset-password?token=...` | Nueva contraseña |
| `/accept-invite?token=...` | Aceptar invitación |
| `/dashboard` | Panel principal (protegido) |
| `/team` | Gestión de equipo (owner/admin) |
