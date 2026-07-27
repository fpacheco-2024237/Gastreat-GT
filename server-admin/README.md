# Gastreat GT - Administration Server

> **Nota**: Este proyecto fue desarrollado con fines didácticos como parte de un curso de arquitectura de microservicios. Forma parte de una serie de servicios independientes que conforman la aplicación completa "Gastreat GT".

## Descripción

Microservicio de administración para la plataforma Gastreat GT. Este servicio maneja la gestión del menú, mesas, comandas (pedidos) y facturación de un restaurante. Proporciona una API RESTful completa para la administración de las operaciones del restaurante.

> La gestión de usuarios y autenticación es manejada por el **Auth Service (.NET)** de forma independiente.

Implementa arquitectura modular con Express.js y MongoDB como base de datos.

## Convenciones de diseño

- Multi-tenant por restaurante: cada recurso debe permanecer acotado a un restaurantId y debe reutilizar la validación de restaurante activo antes de escribir.
- Menú e inventario: disponibilidad, precio y stock deben mantenerse consistentes; las categorías no se eliminan si siguen teniendo productos activos asociados.
- API y arquitectura: todas las rutas deben seguir el mismo envelope de respuesta y los middlewares compartidos del repo. El desarrollo nuevo debe usar pnpm.

## Servicios del Sistema

| # | Servicio | Tecnología | Puerto |
|---|---|---|---|
| 1 | Auth & Usuarios | .NET + PostgreSQL | 5198 |
| 2 | Menú e Inventario | Node.js + MongoDB | 3022 |
| 3 | Mesas y Reservas | Node.js + MongoDB | 3022 |
| 4 | Comandas (Pedidos) | Node.js + MongoDB | 3022 |
| 5 | Facturación y Pagos | Node.js + MongoDB | 3022 |

Los servicios 2–5 viven en este mismo server-admin.

## Funcionalidades Principales

### Gestión del Menú
- Creación y actualización de platillos con imágenes
- Consulta de platillos por categoría y disponibilidad
- Activación/desactivación de ítems del menú
- Almacenamiento de imágenes en Cloudinary

### Gestión de Mesas
- Control del estado físico del restaurante (Libre, Ocupada, Sucia)
- Creación y actualización de mesas por zona
- Validación de conflictos de horarios en reservas
- Cambio de estado automático al abrir/cerrar comandas

### Gestión de Comandas (Pedidos)
- Apertura de órdenes por mesa
- Agregado de platillos con precio en tiempo real
- Estados: Pendiente → Preparando → Preparado → Entregado
- Vista de cocina con órdenes pendientes (FIFO)
- Cancelación de órdenes con liberación de mesa

### Gestión de Facturación
- Generación automática de factura al cerrar una comanda
- Cálculo de subtotal, IVA (12%) y propina
- Métodos de pago: Efectivo o Tarjeta
- Liberación automática de mesa al pagar

### Seguridad
- Validación JWT integrada con Auth Service (.NET)
- Rate limiting (100 req / 15 min por IP)
- Protección con Helmet
- CORS configurado
- Validación de datos con express-validator
- Manejo global de errores

## Tecnologías Utilizadas

- **Framework**: Express.js 5.x
- **Runtime**: Node.js 18+
- **Lenguaje**: JavaScript (ES Modules)
- **Base de Datos**: MongoDB + Mongoose
- **Autenticación**: JWT (emitido por Auth Service .NET)
- **Imágenes**: Cloudinary + Multer
- **Seguridad**: Helmet, CORS, express-rate-limit
- **Validación**: express-validator
- **Logging**: Morgan
- **Package Manager**: pnpm

## Endpoints API

Base URL: `http://localhost:3022/gastreatGT/Admin/v1`

### Menú (`/menu`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/menu` | Obtener todos los platillos | Token |
| `GET` | `/menu/:id` | Obtener platillo por ID | Token |
| `POST` | `/menu` | Crear platillo (con imagen) | Admin |
| `PUT` | `/menu/:id` | Actualizar platillo | Admin |
| `PATCH` | `/menu/:id/status` | Cambiar estado | Admin |
| `DELETE` | `/menu/:id` | Eliminar platillo | Admin |

### Mesas (`/tables`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/tables` | Obtener todas las mesas | Token |
| `GET` | `/tables/:id` | Obtener mesa por ID | Token |
| `POST` | `/tables` | Crear mesa | Admin |
| `PUT` | `/tables/:id` | Actualizar mesa | Admin |
| `PATCH` | `/tables/:id/status` | Cambiar estado | Token |
| `DELETE` | `/tables/:id` | Eliminar mesa | Admin |

### Comandas (`/orders`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/orders` | Obtener todas las órdenes | Token |
| `GET` | `/orders/pending` | Órdenes pendientes (cocina) | Token |
| `GET` | `/orders/:id` | Obtener orden por ID | Token |
| `POST` | `/orders` | Crear nueva orden | Staff |
| `PATCH` | `/orders/:id/status` | Cambiar estado de orden | Staff |
| `PATCH` | `/orders/:id/add-items` | Agregar platillos | Staff |
| `DELETE` | `/orders/:id` | Cancelar orden | Admin |

### Facturación (`/billing`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/billing` | Obtener todas las facturas | Admin |
| `GET` | `/billing/:orderId` | Obtener/generar factura | Token |
| `POST` | `/billing/pay` | Registrar pago | Token |

### Salud

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Estado del servicio | No |

## Estructura del Proyecto

```
server-admin/
├── configs/
│   ├── app.js                        # Configuración principal del servidor
│   ├── cors.configuration.js         # Configuración de CORS
│   ├── db.configuration.js           # Conexión a MongoDB
│   ├── helmet.configuration.js       # Configuración de Helmet
│   └── rateLimit.configuration.js    # Rate limiting
│
├── middlewares/
│   ├── auth.middleware.js            # verifyToken, isAdmin, isStaff
│   ├── check-validators.js           # Verificación de validadores
│   ├── delete-file-on-error.js       # Limpieza de archivos en errores
│   ├── file-uploader.js              # Subida de archivos a Cloudinary
│   ├── handle-errors.js              # Manejo global de errores
│   ├── table-conflict.js             # Validación de conflictos de reservas
│   ├── table-time-validation.js      # Validación de horarios de mesas
│   ├── table-validators.js           # Validadores de mesas y reservas
│   ├── upload.middleware.js          # Multer + Cloudinary para menú
│   ├── validate-JWT.js               # Validación de tokens JWT
│   ├── validate-role.js              # Validación de roles
│   └── validate.middleware.js        # validateFields general
│
├── src/
│   ├── billing/                      # Módulo de facturación
│   │   ├── billing.controller.js
│   │   ├── billing.model.js
│   │   ├── billing.routes.js
│   │   └── billing.service.js
│   │
│   ├── menu/                         # Módulo del menú
│   │   ├── menu.controller.js
│   │   ├── menu.model.js
│   │   ├── menu.routes.js
│   │   └── menu.service.js
│   │
│   ├── orders/                       # Módulo de comandas
│   │   ├── order.controller.js
│   │   ├── order.model.js
│   │   ├── order.routes.js
│   │   └── order.service.js
│   │
│   └── tables/                       # Módulo de mesas
│       ├── table.controller.js
│       ├── table.model.js
│       ├── table.routes.js
│       └── table.service.js
│
├── helpers/                          # Utilidades generales
├── .env.example                      # Plantilla de variables de entorno
├── .gitignore
├── index.js                          # Punto de entrada
├── package.json
└── README.md
```

## Configuración

### Requisitos Previos
- Node.js 18+
- pnpm 10+
- MongoDB 6+
- Auth Service (.NET) corriendo en puerto 5000
- Cuenta de Cloudinary

### Instalación

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Ejecutar en desarrollo
pnpm run dev
```

### Variables de Entorno

```env
PORT=5198
URI_MONGODB=mongodb://localhost:27017/gastreat_gt
JWT_SECRET=GastreatGTImportSecretKeyNullGet
JWT_ISSUER=GastreatGT
JWT_AUDIENCE=GastreatGT
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

## Roles y Permisos

Los tokens JWT son emitidos por el **Auth Service (.NET)** y validados aquí:

| Rol | Permisos |
|---|---|
| `ADMIN_ROLE` | CRUD completo en todos los módulos |
| `USER_ROLE` | Consulta, crear órdenes, registrar pagos |

## Manejo de Errores

| Código | Descripción |
|--------|-------------|
| `400` | Error de validación de datos |
| `401` | Token ausente, inválido o expirado |
| `403` | Rol sin permisos para el recurso |
| `404` | Recurso no encontrado |
| `409` | Conflicto (mesa duplicada, orden ya pagada) |
| `429` | Rate limit excedido |
| `500` | Error interno del servidor |

## Seguridad

-  Helmet para headers de seguridad HTTP
-  CORS configurado
-  Rate limiting: 100 peticiones / 15 minutos
-  Validación JWT con issuer y audience
-  Sanitización de entradas con express-validator
-  Límite de payload: 10mb
-  Validación de tipos de archivo (JPEG, PNG, WEBP)
-  Limpieza automática de imágenes en Cloudinary si falla la petición
-  Sin exposición de stack traces en producción

## Health Check

```bash
curl http://localhost:5198/gastreatGT/Admin/v1/health
```

```json
{
  "status": "Healthy",
  "timeStamp": "2026-05-03T17:00:00.000Z",
  "service": "Gastreat GT Admin Server"
}
```

## Contribución

- **Proyecto**: Gastreat GT
- **Curso**: Arquitectura de Microservicios - Kinal Guatemala 2026
- **Licencia**: MIT

---

**Gastreat GT** - Sistema de Gestión de Restaurante | Kinal Guatemala 2026
