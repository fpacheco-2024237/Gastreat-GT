# Implementación en server-user — Gastreat GT

Documento independiente, autocontenido, solo con lo que va en **`server-user`**. Es un subconjunto del documento completo (`servicios-faltantes.md`), reorganizado para que no tengas que ir y venir entre los dos.

Recordatorio del alcance acordado: `server-user` **no duplica lecturas** (esas las sirve `server-admin` a ambos roles) — solo tiene las **acciones exclusivas de `USER_ROLE`**: crear reserva y crear pedido. Todo lo demás (mesas, menú, estados de pedido, facturación) vive únicamente en `server-admin`.

---

## 0. Antes de copiar código

- **Bug a corregir en `validate-role.js`**: `table-validators.js` importa `{ requireRole, ROLES }`, pero `ROLES` no existe en el archivo que compartiste. Agrega esto (mismo archivo, no lo reemplaces):
  ```js
  export const ROLES = { ADMIN: 'ADMIN_ROLE', USER: 'USER_ROLE' };
  ```
- `server-user` apunta a la **misma base de datos MongoDB** que `server-admin`, por eso necesita sus propias copias de los modelos `Restaurant`, `Product` y `Table` (mismo schema, misma colección) — sin esto, Mongoose no puede validar ni castear referencias contra esas colecciones desde este servidor.
- Agregué una validación de que la mesa exista antes de crear una reserva (`Table.findById`) que no estaba en la primera versión del documento — es la misma lógica que ya usas para `ensureRestaurantIsActive`, aplicada aquí para consistencia. Avísame si prefieres quitarla.

---

## 1. Middlewares — copiar tal cual desde server-admin

Sin cambios, excepto el fix de `ROLES` ya mencionado.

### 1.1 `middlewares/validate-JWT.js`
```js
import jwt from 'jsonwebtoken';

export const validateJWT = (req, res, next) => {
  const jwtConfig = {
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  };

  if (!jwtConfig.secret) {
    console.error('Error de validación JWT: JWT_SECRET no está definido');
    return res.status(500).json({
      success: false,
      message: 'Configuración del servidor inválida: falta JWT_SECRET',
    });
  }

  const token =
    req.header('x-token') ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó un token',
      error: 'MISSING_TOKEN',
    });
  }

  try {
    const verifyOptions = {};
    if (jwtConfig.issuer) verifyOptions.issuer = jwtConfig.issuer;
    if (jwtConfig.audience) verifyOptions.audience = jwtConfig.audience;

    const decoded = jwt.verify(token, jwtConfig.secret, verifyOptions);

    req.user = {
      id: decoded.sub,
      jti: decoded.jti,
      iat: decoded.iat,
      role: decoded.role || 'USER_ROLE',
    };

    next();
  } catch (error) {
    console.error('Error de validación JWT:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'El token ha expirado', error: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token inválido', error: 'INVALID_TOKEN' });
    }
    return res.status(500).json({ success: false, message: 'Error al validar el token', error: 'TOKEN_VALIDATION_ERROR' });
  }
};
```

### 1.2 `middlewares/validate-role.js`
```js
'use strict';

export const ROLES = { ADMIN: 'ADMIN_ROLE', USER: 'USER_ROLE' };

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado', error: 'UNAUTHORIZED' });
    }
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        error: 'FORBIDDEN',
        requiredRole: allowedRoles,
        yourRole: userRole,
      });
    }
    next();
  };
};
```

### 1.3 `middlewares/check-validators.js`
```js
import { validationResult } from "express-validator";

export const checkValidators = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array().map(err => ({ field: err.path || err.param, message: err.msg })),
        });
    }
    next();
}
```

### 1.4 `middlewares/handle-errors.js`
```js
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'CUSTOM_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

const sendValidationError = (res, err) => {
  const errors = Object.values(err.errors || {}).map((error) => ({ field: error.path, message: error.message }));
  return res.status(400).json({ success: false, message: 'Error de validación', errors });
};

export const errorHandler = (err, req, res, next) => {
  console.error(`Error in User Server: ${err.message}`);

  if (err.name === 'ValidationError') return sendValidationError(res, err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({ success: false, message: `${field} ya existe`, error: 'DUPLICATE_FIELD' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Formato de ID inválido', error: 'INVALID_ID' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token inválido', error: 'INVALID_TOKEN' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expirado', error: 'TOKEN_EXPIRED' });
  }

  if (err instanceof AppError || err.statusCode) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message, error: err.code || 'CUSTOM_ERROR' });
  }

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message, stack: err.stack }),
  });
};

export { AppError };
```

### 1.5 `middlewares/table-time-validation.js`, `middlewares/table-conflict.js`, `middlewares/table-validators.js`

Estos tres van **idénticos** a los que ya compartiste — cópialos sin ningún cambio (solo asegúrate de que `table-conflict.js` siga apuntando a `../src/tables/tableReservation.model.js`, que en `server-user` sí vas a crear en el paso 3).

---

## 2. Dependencias de otros módulos (copias mínimas)

`server-user` necesita registrar los modelos `Restaurant`, `Product` y `Table` para poder validar referencias, aunque no tenga su propio CRUD de esos recursos.

### 2.1 `src/restaurants/restaurant.model.js`
Copia exacta de la de `server-admin` (mismo schema, misma colección `restaurants`):
```js
'use strict';

import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 150 },
    address: { type: String, required: true, trim: true },
    taxId: { type: String, trim: true },
    openTime: { type: String, trim: true, match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ },
    closeTime: { type: String, trim: true, match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ },
    active: { type: Boolean, default: true },
    administrators: { type: [String], default: [] },
    deletedAt: { type: Date },
    deletedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Restaurant', restaurantSchema);
```

### 2.2 `src/restaurants/restaurant.service.js` (versión mínima, solo lo que usa server-user)
```js
'use strict';

import Restaurant from './restaurant.model.js';
import { AppError } from '../../middlewares/handle-errors.js';

export const ensureRestaurantIsActive = async (restaurantId) => {
  if (!restaurantId) throw new AppError('restaurantId faltante', 400);
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new AppError('Restaurante no encontrado', 404);
  if (!restaurant.active) throw new AppError('El restaurante no está activo', 409, 'RESTAURANT_INACTIVE');
  return true;
};
```

### 2.3 `src/menu/product.model.js`
Copia exacta de la de `server-admin` (mismo schema, misma colección `products`):
```js
'use strict';

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, trim: true, default: null },
    imagePublicId: { type: String, trim: true, default: null },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    active: { type: Boolean, default: true },
    deletedAt: { type: Date },
    deletedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Product', productSchema);
```

### 2.4 `src/menu/product.service.js` (versión mínima, solo lo que usa server-user)
```js
'use strict';

import Product from './product.model.js';
import { AppError } from '../../middlewares/handle-errors.js';

export const ensureProductIsAvailable = async (productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError(`Platillo no encontrado: ${productId}`, 404);
  if (!product.active) throw new AppError(`Platillo inactivo: ${product.name}`, 409, 'PRODUCT_INACTIVE');
  if (product.stock < quantity) {
    throw new AppError(`Stock insuficiente para ${product.name} (disponible: ${product.stock})`, 409, 'INSUFFICIENT_STOCK');
  }
  return product;
};

/**
 * Descuenta stock de varios productos de forma atómica por documento.
 * Si uno falla a mitad de camino, revierte los que sí se aplicaron.
 */
export const deductStockForItems = async (items) => {
  const applied = [];
  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, active: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        throw new AppError(`Stock insuficiente o platillo inactivo (${item.productId})`, 409, 'INSUFFICIENT_STOCK');
      }
      applied.push(item);
    }
  } catch (err) {
    for (const a of applied) {
      await Product.findByIdAndUpdate(a.productId, { $inc: { stock: a.quantity } });
    }
    throw err;
  }
};

export const restoreStockForItems = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
  }
};
```

### 2.5 `src/tables/table.model.js`
Copia exacta de la de `server-admin`:
```js
'use strict';

import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1, max: 20 },
    zone: { type: String, required: true, enum: ['SALON_PRINCIPAL', 'TERRAZA', 'PRIVADO', 'BARRA'] },
    description: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: ['LIBRE', 'OCUPADA', 'RESERVADA', 'INACTIVA'], default: 'LIBRE' },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  },
  { timestamps: true, versionKey: false }
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

export default mongoose.model('Table', tableSchema);
```

---

## 3. Mesas/Reservas — crear reserva

### 3.1 `src/tables/tableReservation.model.js`
```js
'use strict';

import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    guestName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    guestPhone: { type: String, trim: true },
    partySize: { type: Number, required: true, min: 1, max: 20 },
    reservationDate: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'], default: 'PENDIENTE' },
    notes: { type: String, trim: true, maxlength: 300 },
    cancelReason: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

reservationSchema.statics.findConflictingReservations = async function (tableId, startTime, endTime, excludeId = null) {
  const query = {
    tableId,
    status: { $ne: 'CANCELADA' },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return await this.find(query);
};

export default mongoose.model('TableReservation', reservationSchema);
```

### 3.2 `src/tables/reservation.service.js`
```js
'use strict';

import TableReservation from './tableReservation.model.js';
import Table from './table.model.js';
import { AppError } from '../../middlewares/handle-errors.js';

export const create = async (data, createdBy) => {
  const table = await Table.findById(data.tableId);
  if (!table) throw new AppError('Mesa no encontrada', 404);

  return await TableReservation.create({ ...data, createdBy });
};
```

### 3.3 `src/tables/reservation.controller.js`
```js
'use strict';

import * as reservationService from './reservation.service.js';

export const create = async (req, res, next) => {
  try {
    const item = await reservationService.create(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Reserva creada', data: item });
  } catch (err) {
    next(err);
  }
};
```

### 3.4 `src/tables/reservation.routes.js`
```js
'use strict';

import { Router } from 'express';
import * as reservationController from './reservation.controller.js';
import { validateCreateReservation } from '../../middlewares/table-validators.js';
import { validateTableTimes } from '../../middlewares/table-time-validation.js';
import { checkTableReservationConflict } from '../../middlewares/table-conflict.js';

const router = Router();

// validateCreateReservation ya incluye validateJWT + requireRole(ADMIN, USER) + checkValidators
router.post('/reservations', validateCreateReservation, validateTableTimes, checkTableReservationConflict, reservationController.create);

export default router;
```

---

## 4. Comandas/Pedidos — crear pedido

### 4.1 `src/orders/order.model.js`
```js
'use strict';

import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
    waiterId: { type: String, required: true },
    items: { type: [orderItemSchema], validate: (v) => Array.isArray(v) && v.length > 0 },
    status: { type: String, enum: ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'], default: 'PENDIENTE' },
    notes: { type: String, trim: true, maxlength: 300 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Order', orderSchema);
```

### 4.2 `src/orders/order.service.js`
```js
'use strict';

import Order from './order.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { ensureRestaurantIsActive } from '../restaurants/restaurant.service.js';
import { ensureProductIsAvailable, deductStockForItems, restoreStockForItems } from '../menu/product.service.js';

export const create = async (data, waiterId) => {
  await ensureRestaurantIsActive(data.restaurantId);

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new AppError('El pedido debe tener al menos un platillo', 400);
  }

  const items = [];
  for (const raw of data.items) {
    const product = await ensureProductIsAvailable(raw.productId, raw.quantity);
    items.push({
      productId: product._id,
      name: product.name,
      unitPrice: product.price,
      quantity: raw.quantity,
      subtotal: product.price * raw.quantity,
    });
  }

  await deductStockForItems(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  try {
    return await Order.create({
      restaurantId: data.restaurantId,
      tableId: data.tableId || null,
      waiterId,
      items,
      notes: data.notes,
      total,
    });
  } catch (err) {
    await restoreStockForItems(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    throw err;
  }
};
```

### 4.3 `src/orders/order.controller.js`
```js
'use strict';

import * as orderService from './order.service.js';

export const create = async (req, res, next) => {
  try {
    const item = await orderService.create(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Pedido creado', data: item });
  } catch (err) {
    next(err);
  }
};
```

### 4.4 `src/orders/order.routes.js`
```js
'use strict';

import { Router } from 'express';
import { body } from 'express-validator';
import * as orderController from './order.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole, ROLES } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';

const router = Router();

const validateCreate = [
  body('restaurantId').isMongoId().withMessage('restaurantId inválido'),
  body('tableId').optional().isMongoId().withMessage('tableId inválido'),
  body('items').isArray({ min: 1 }).withMessage('items debe ser un arreglo con al menos un elemento'),
  body('items.*.productId').isMongoId().withMessage('productId inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity debe ser un entero positivo'),
  checkValidators,
];

router.post('/', validateJWT, requireRole(ROLES.ADMIN, ROLES.USER), validateCreate, orderController.create);

export default router;
```

---

## 5. Montar los routers

```js
// app.js / index.js de server-user
app.use('/api', reservationRoutes); // expone POST /api/reservations
app.use('/api/orders', orderRoutes); // expone POST /api/orders
app.use(errorHandler); // al final, después de montar todas las rutas
```

---

## 6. Checklist de archivos — server-user

- [ ] `middlewares/validate-JWT.js`
- [ ] `middlewares/validate-role.js` (con `ROLES` agregado)
- [ ] `middlewares/check-validators.js`
- [ ] `middlewares/handle-errors.js`
- [ ] `middlewares/table-time-validation.js` (copiado tal cual)
- [ ] `middlewares/table-conflict.js` (copiado tal cual)
- [ ] `middlewares/table-validators.js` (copiado tal cual)
- [ ] `src/restaurants/restaurant.model.js`, `restaurant.service.js` (versión mínima)
- [ ] `src/menu/product.model.js`, `product.service.js` (versión mínima)
- [ ] `src/tables/table.model.js`
- [ ] `src/tables/tableReservation.model.js`, `reservation.service.js`, `reservation.controller.js`, `reservation.routes.js`
- [ ] `src/orders/order.model.js`, `order.service.js`, `order.controller.js`, `order.routes.js`
- [ ] Montar ambos routers + `errorHandler` en `app.js`/`index.js`

## 7. Checklist de pruebas — server-user

- [ ] `POST /reservations` con `tableId` inexistente → esperar `404`
- [ ] `POST /reservations` con horario que se solapa con una reserva existente → esperar `409` (via `checkTableReservationConflict`)
- [ ] `POST /reservations` fuera del horario de atención (antes de 07:00 o después de 23:00) → esperar `400` (via `validateTableTimes`)
- [ ] `POST /orders` con `restaurantId` de un restaurante inactivo → esperar `409`
- [ ] `POST /orders` con cantidad mayor al stock disponible → esperar `409 INSUFFICIENT_STOCK` y confirmar que el stock no cambió
- [ ] `POST /orders` válido → confirmar que el stock del platillo se descontó y que el pedido aparece en `server-admin` vía `GET /orders`
- [ ] Probar sin token en ambos endpoints → esperar `401 MISSING_TOKEN`
