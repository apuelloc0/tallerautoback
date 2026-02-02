# students-back

Backend del sistema de gestión de estudiantes: Node.js, Express 5 y MongoDB.

## Requisitos

- Node.js 18+
- MongoDB (local o Atlas)

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con MONGODB_URI y JWT_SECRET
```

## Uso

```bash
# Desarrollo (recarga automática)
npm run dev

# Producción
npm start
```

Crear usuario inicial (DIRECTORA):

```bash
npm run seed
# Usuario: admin, Contraseña: admin123
```

## API

Base URL: `http://localhost:4000` (o el `PORT` de `.env`).

### Autenticación (público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (username, password) |
| GET | `/api/auth/me` | Usuario actual (requiere token) |
| POST | `/api/auth/forgot-password` | Recuperación (username, answers[]) |
| POST | `/api/auth/reset-password` | Nueva contraseña (resetToken, newPassword) |

Header para rutas protegidas: `Authorization: Bearer <token>`.

### Roles y permisos

- **DIRECTORA**: acceso total.
- **ADMINISTRADOR**: registro de pagos, solvencias, registro/modificación de estudiantes.
- **SECRETARIA**: lista de estudiantes (y documentos según configuración).

### Estudiantes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/students` | Lista (query: year, section, enrollmentType, search) |
| GET | `/api/students/quota` | Control de cupos por año/sección |
| GET | `/api/students/:id` | Detalle + documentos |
| POST | `/api/students` | Alta |
| PUT | `/api/students/:id` | Modificación |
| POST | `/api/students/:id/expedient` | Subir expediente (multipart file) |

### Documentos (C.I, notas, etc.)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/documents?studentId=&type=` | Lista |
| POST | `/api/documents` | Subir (multipart + student, type) |
| DELETE | `/api/documents/:id` | Eliminar |

### Pagos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/payments/config` | Configuración de periodo/monto |
| POST | `/api/payments/config` | Crear configuración |
| PUT | `/api/payments/config/:id` | Actualizar configuración |
| GET | `/api/payments/cutoff` | Fechas de corte |
| POST | `/api/payments/cutoff` | Crear fecha de corte |
| PUT | `/api/payments/cutoff/:id` | Actualizar corte |
| GET | `/api/payments` | Lista (studentId, cutOffId, from, to) |
| POST | `/api/payments` | Registro de pago |
| PUT | `/api/payments/:id` | Actualizar pago |
| GET | `/api/payments/history/student/:id` | Historial por estudiante |
| GET | `/api/payments/summary` | Resumen (total pagos, montos) |
| GET | `/api/payments/solvencies` | Lista de deudores (query: period) |

### Comprobantes

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/receipts` | Subir imagen (multipart + paymentIds opcional) |
| GET | `/api/receipts/:id` | Ver comprobante |

### Notas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/grades` | Lista (studentId, year, subject) |
| GET | `/api/grades/best` | Mejores notas (year, subject, limit) |
| GET | `/api/grades/:id` | Una nota |
| POST | `/api/grades` | Crear |
| PUT | `/api/grades/:id` | Actualizar |
| POST | `/api/grades/bulk` | Carga masiva (items[]) |

### Reportes y respaldo (DIRECTORA)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reports/institutional` | Reporte institucional |
| GET | `/api/backups` | Lista de respaldos |
| POST | `/api/backups` | Crear respaldo |

## Estructura

```
src/
  config/       # db, constants, upload
  controllers/
  middleware/   # auth, validate, errorHandler
  models/
  routes/
  validators/
  app.js
  server.js
scripts/
  seed-admin.js
uploads/        # expedients, documents, receipts (creado al subir)
```

## Modelos principales

- **User**: username, password, role, securityQuestions (recuperación).
- **Student**: name, ci, edad, fechaNacimiento, year, section, aula, genero, enrollmentType, paymentConfig (beca, descuento, exoneración, representante), expedientUrl.
- **PaymentConfig**: period, amountBs, amountUsd, exchangeRate.
- **CutOffDate**: period, dueDate, amountBs, amountUsd.
- **Payment**: student, cutOffDate, amountBs, amountUsd, paymentMethod, paidAt, receipt, exemption.
- **Receipt**: imageUrl, payments[].
- **Grade**: student, year, subject, corte1, corte2, corte3, average.
- **Document**: student, type, fileUrl.
- **Backup**: filename, path, createdBy.
