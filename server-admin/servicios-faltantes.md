# Implementación de los 4 servicios faltantes — Gastreat GT

Cubre: **Menú/Inventario**, **Mesas/Reservas**, **Comandas/Pedidos**, **Facturación**, para `server-admin` y `server-user`. Calcado al patrón real de `restaurant.*` y a los middlewares que ya existen (`table-conflict.js`, `table-time-validation.js`, `table-validators.js`, `check-validators.js`, `handle-errors.js`, `validate-JWT.js`, `validate-role.js`, `upload.middleware.js`, `request-limit.js`).

---

## 0. Léelo antes de copiar código

### 0.1 Bug real que hay que corregir primero

`table-validators.js` hace `import { requireRole, ROLES } from './validate-role.js'`, pero `validate-role.js` **no exporta `ROLES`** — ese import falla al cargar el archivo. Agrega esto a `middlewares/validate-role.js`:

```js
// AGREGAR a middlewares/validate-role.js (no reemplaza requireRole, se agrega)
export const ROLES = { ADMIN: 'ADMIN_ROLE', USER: 'USER_ROLE' };
```

Valores tomados de `'ADMIN_ROLE'` literal en `restaurant.routes.js` y del default `'USER_ROLE'` en `validate-JWT.js`. Si ya tienes esto en otro archivo, ajusta el import en `table-validators.js` en vez de crear este export.

### 0.2 Cómo interpreté el split server-admin / server-user (confírmalo)

Confirmaste: *"server-admin sirve lectura a ambos roles"* y *"server-user tiene sus propios archivos solo para acciones exclusivas de USER_ROLE (crear pedido, crear reserva)"*. Con eso, distribuí así:

| Servicio | server-admin | server-user |
|---|---|---|
| Menú/Inventario | CRUD completo + lectura compartida | — (no necesita archivos; lee de server-admin) |
| Mesas | CRUD completo + lectura compartida | — |
| Reservas | Lectura, confirmar, cancelar, listar (ADMIN) | **Crear reserva** (archivo propio) |
| Comandas/Pedidos | Lectura, cambiar estado, cancelar (ADMIN) | **Crear pedido** (archivo propio) |
| Facturación | CRUD completo | — |

Ambos servidores apuntan a la **misma base de datos MongoDB**, por eso `server-user` define su propia copia mínima del modelo (mismo schema, misma colección) — es el patrón típico cuando son dos proyectos Node separados sin paquete compartido. Si en realidad comparten una carpeta `node_modules`/paquete común entre los dos servidores, dímelo y estos archivos se pueden importar en vez de duplicarse.

### 0.3 Reglas de negocio que invento yo (no vienen de tu código, avísame si algo no aplica)

- **IVA 12%** sobre facturas (`TAX_RATE = 0.12`), estándar en Guatemala — está como constante fácil de cambiar en `invoice.service.js`.
- **Máquina de estados de Pedido**: `PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO`. Cancelación solo permitida desde `PENDIENTE` o `EN_PREPARACION`.
- **Una factura por pedido**, y solo se puede facturar un pedido en estado `ENTREGADO`.
- Descuento de stock: mismo patrón atómico-por-documento-con-rollback ya acordado (sin transacciones reales, porque Mongo sin replica set no las soporta).

### 0.4 Convenciones confirmadas que uso en todo el documento

- ES Modules (`import`/`export`), `'use strict'` al inicio de cada archivo.
- Capa **Controller → Service → Model**. El service lanza `AppError(mensaje, status, code?)`; el controller solo hace `try { } catch(err) { next(err) }`.
- Validadores de `express-validator` **inline en `*.routes.js`**, con `checkValidators` al final del array — no hay carpeta `validators/` aparte (excepto Mesas, que ya tiene su propio `table-validators.js`, y ahí se reutiliza tal cual).
- Referencias a **usuarios** (vienen de un Auth Service externo) van como `String` (`req.user.id`), nunca `ObjectId` con `ref`. Referencias a modelos **locales** de este mismo servidor (Restaurant, Category, Product, Table) sí usan `ObjectId` con `ref`, porque viven en la misma base de datos.
- Patrón **soft-delete** (`active`, `deletedAt`, `deletedBy` + `/reactivate`) solo en Categoría y Platillo. Pedidos y Facturas usan su propia máquina de estados, no soft-delete.
- Campos que asigna el servidor (`administrators`, `deletedBy`, `waiterId`, `issuedBy`) se llenan en el controller desde `req.user`, nunca desde el body.
- Cross-check entre servicios: patrón `ensureXIsActive(id)` (igual que `ensureRestaurantIsActive` en `restaurant.service.js`) — Menú valida restaurante activo, Mesas valida restaurante activo, Pedidos valida restaurante+mesa+productos activos, Facturación valida que el pedido esté `ENTREGADO`.

---

## 1. Menú / Inventario (`server-admin`, `src/menu/`)

Dos recursos: **Categoría** y **Platillo**. Ambos con soft-delete, igual que Restaurante.

### 1.1 `src/menu/category.model.js`

```js
'use strict';

import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede superar 100 caracteres'],
    },
    description: { type: String, trim: true, maxlength: 300 },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'El restaurante es obligatorio'],
    },
    active: { type: Boolean, default: true },
    deletedAt: { type: Date },
    deletedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
```

### 1.2 `src/menu/category.service.js`

```js
'use strict';

import Category from './category.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { ensureRestaurantIsActive } from '../restaurants/restaurant.service.js';

export const buildActiveFilter = ({ includeInactive = false, isAdmin = false } = {}) => {
  if (includeInactive && isAdmin) return {};
  return { active: true };
};

export const getAll = async (filters = {}, options = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
  Object.assign(query, buildActiveFilter(options));
  return await Category.find(query).sort({ name: 1 });
};

export const getById = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new AppError('Categoría no encontrada', 404);
  return category;
};

export const ensureCategoryIsActive = async (categoryId) => {
  if (!categoryId) throw new AppError('categoryId faltante', 400);
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError('Categoría no encontrada', 404);
  if (!category.active) throw new AppError('La categoría no está activa', 409, 'CATEGORY_INACTIVE');
  return category;
};

export const create = async (data) => {
  await ensureRestaurantIsActive(data.restaurantId);
  try {
    return await Category.create(data);
  } catch (err) {
    if (err.code === 11000) throw new AppError('Ya existe una categoría con ese nombre en este restaurante', 409, 'DUPLICATE');
    throw err;
  }
};

export const update = async (id, data) => {
  const category = await getById(id);
  if (!category.active) throw new AppError('No se puede modificar una categoría inactiva', 403);
  return await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const softDelete = async (id, deletedBy) => {
  const category = await getById(id);
  category.active = false;
  category.deletedAt = new Date();
  category.deletedBy = deletedBy || null;
  return await category.save();
};

export const reactivate = async (id) => {
  const category = await getById(id);
  category.active = true;
  category.deletedAt = undefined;
  category.deletedBy = undefined;
  return await category.save();
};
```

### 1.3 `src/menu/category.controller.js`

```js
'use strict';

import * as categoryService from './category.service.js';

const isAdmin = (req) => req.user && req.user.role === 'ADMIN_ROLE';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, name, includeInactive } = req.query;
    const options = { includeInactive: false, isAdmin: false };
    if ((includeInactive === 'true' || includeInactive === true) && isAdmin(req)) {
      options.includeInactive = true;
      options.isAdmin = true;
    }
    const items = await categoryService.getAll({ restaurantId, name }, options);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await categoryService.getById(req.params.id);
    if (!item.active && !isAdmin(req)) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    delete req.body.active;
    const item = await categoryService.create(req.body);
    res.status(201).json({ success: true, message: 'Categoría creada', data: item });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    delete req.body.active;
    delete req.body.restaurantId;
    const item = await categoryService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Categoría actualizada', data: item });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const deleted = await categoryService.softDelete(req.params.id, req.user?.id);
    res.status(200).json({ success: true, message: 'Categoría dada de baja', data: deleted });
  } catch (err) {
    next(err);
  }
};

export const reactivate = async (req, res, next) => {
  try {
    const item = await categoryService.reactivate(req.params.id);
    res.status(200).json({ success: true, message: 'Categoría reactivada', data: item });
  } catch (err) {
    next(err);
  }
};
```

### 1.4 `src/menu/category.routes.js`

```js
'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as categoryController from './category.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';

const router = Router();

const validateCreate = [
  body('name').notEmpty().withMessage('El nombre es requerido').trim(),
  body('restaurantId').isMongoId().withMessage('restaurantId inválido'),
  checkValidators,
];
const validateId = [param('id').isMongoId().withMessage('ID inválido'), checkValidators];

router.get('/', validateJWT, categoryController.getAll);
router.get('/:id', validateJWT, validateId, categoryController.getOne);

router.post('/', validateJWT, requireRole('ADMIN_ROLE'), validateCreate, categoryController.create);
router.put('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, categoryController.update);
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, categoryController.remove);
router.patch('/:id/reactivate', validateJWT, requireRole('ADMIN_ROLE'), validateId, categoryController.reactivate);

export default router;
```

### 1.5 `src/menu/product.model.js`

```js
'use strict';

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del platillo es obligatorio'],
      trim: true,
      maxlength: 150,
    },
    description: { type: String, trim: true, maxlength: 500 },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
    },
    imageUrl: { type: String, trim: true, default: null },
    imagePublicId: { type: String, trim: true, default: null },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es obligatoria'],
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'El restaurante es obligatorio'],
    },
    active: { type: Boolean, default: true },
    deletedAt: { type: Date },
    deletedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Product', productSchema);
```

### 1.6 `src/menu/product.service.js`

```js
'use strict';

import Product from './product.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { ensureRestaurantIsActive } from '../restaurants/restaurant.service.js';
import { ensureCategoryIsActive } from './category.service.js';

export const buildActiveFilter = ({ includeInactive = false, isAdmin = false } = {}) => {
  if (includeInactive && isAdmin) return {};
  return { active: true };
};

export const getAll = async (filters = {}, options = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
  Object.assign(query, buildActiveFilter(options));
  return await Product.find(query).sort({ name: 1 });
};

export const getById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Platillo no encontrado', 404);
  return product;
};

/** Usado por Comandas para validar disponibilidad antes de crear un pedido. */
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
 * No usa transacciones de Mongo (requieren replica set); es el patrón
 * correcto para el alcance actual.
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

export const create = async (data) => {
  await ensureRestaurantIsActive(data.restaurantId);
  await ensureCategoryIsActive(data.categoryId);
  return await Product.create(data);
};

export const update = async (id, data) => {
  const product = await getById(id);
  if (!product.active) throw new AppError('No se puede modificar un platillo inactivo', 403);
  if (data.categoryId) await ensureCategoryIsActive(data.categoryId);
  return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const softDelete = async (id, deletedBy) => {
  const product = await getById(id);
  product.active = false;
  product.deletedAt = new Date();
  product.deletedBy = deletedBy || null;
  return await product.save();
};

export const reactivate = async (id) => {
  const product = await getById(id);
  product.active = true;
  product.deletedAt = undefined;
  product.deletedBy = undefined;
  return await product.save();
};
```

### 1.7 `src/menu/product.controller.js`

```js
'use strict';

import * as productService from './product.service.js';
import { cloudinary } from '../../middlewares/upload.middleware.js';

const isAdmin = (req) => req.user && req.user.role === 'ADMIN_ROLE';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, categoryId, name, includeInactive } = req.query;
    const options = { includeInactive: false, isAdmin: false };
    if ((includeInactive === 'true' || includeInactive === true) && isAdmin(req)) {
      options.includeInactive = true;
      options.isAdmin = true;
    }
    const items = await productService.getAll({ restaurantId, categoryId, name }, options);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await productService.getById(req.params.id);
    if (!item.active && !isAdmin(req)) {
      return res.status(404).json({ success: false, message: 'Platillo no encontrado' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    delete req.body.active;
    if (req.file) {
      req.body.imageUrl = req.file.path;
      req.body.imagePublicId = req.file.filename;
    }
    const item = await productService.create(req.body);
    res.status(201).json({ success: true, message: 'Platillo creado', data: item });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    delete req.body.active;
    delete req.body.restaurantId;

    const current = await productService.getById(req.params.id);

    if (req.file) {
      req.body.imageUrl = req.file.path;
      req.body.imagePublicId = req.file.filename;
      // Borra la imagen anterior en Cloudinary si existía
      if (current.imagePublicId) {
        cloudinary.uploader.destroy(current.imagePublicId).catch((e) =>
          console.error(`No se pudo borrar imagen anterior: ${e.message}`)
        );
      }
    }

    const item = await productService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Platillo actualizado', data: item });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const deleted = await productService.softDelete(req.params.id, req.user?.id);
    res.status(200).json({ success: true, message: 'Platillo dado de baja', data: deleted });
  } catch (err) {
    next(err);
  }
};

export const reactivate = async (req, res, next) => {
  try {
    const item = await productService.reactivate(req.params.id);
    res.status(200).json({ success: true, message: 'Platillo reactivado', data: item });
  } catch (err) {
    next(err);
  }
};
```

### 1.8 `src/menu/product.routes.js`

```js
'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as productController from './product.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

const validateCreate = [
  body('name').notEmpty().withMessage('El nombre es requerido').trim(),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un entero positivo'),
  body('categoryId').isMongoId().withMessage('categoryId inválido'),
  body('restaurantId').isMongoId().withMessage('restaurantId inválido'),
  checkValidators,
];
const validateUpdate = [
  body('price').optional().isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un entero positivo'),
  body('categoryId').optional().isMongoId().withMessage('categoryId inválido'),
  checkValidators,
];
const validateId = [param('id').isMongoId().withMessage('ID inválido'), checkValidators];

router.get('/', validateJWT, productController.getAll);
router.get('/:id', validateJWT, validateId, productController.getOne);

router.post(
  '/',
  validateJWT,
  requireRole('ADMIN_ROLE'),
  upload.single('image'),
  cleanupUploadedFileOnFinish,
  validateCreate,
  productController.create
);
router.put(
  '/:id',
  validateJWT,
  requireRole('ADMIN_ROLE'),
  upload.single('image'),
  cleanupUploadedFileOnFinish,
  validateId,
  validateUpdate,
  productController.update
);
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, productController.remove);
router.patch('/:id/reactivate', validateJWT, requireRole('ADMIN_ROLE'), validateId, productController.reactivate);

export default router;
```

> **Nota:** `upload.middleware.js` exporta `upload` (no lo vi confirmado, pero por analogía con `file-uploader.js` y el nombre del archivo, asumo `export const upload = multer(...)` como middleware genérico — en el archivo que compartiste el multer se construye pero no vi la línea `export const upload = multer({...})` explícita al final. Revisa que el nombre del export coincida; si en tu archivo se llama distinto, solo ajusta el `import`.

---

## 2. Mesas / Reservas (`src/tables/`)

Reutiliza `table-conflict.js`, `table-time-validation.js` y `table-validators.js` **tal cual existen** — aquí solo se crean los modelos, services, controllers y el router que los conecta.

### 2.1 `server-admin/src/tables/table.model.js`

```js
'use strict';

import mongoose from 'mongoose';

const TABLE_STATUSES = ['LIBRE', 'OCUPADA', 'RESERVADA', 'INACTIVA'];
const TABLE_ZONES = ['SALON_PRINCIPAL', 'TERRAZA', 'PRIVADO', 'BARRA'];

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1, max: 20 },
    zone: { type: String, required: true, enum: TABLE_ZONES },
    description: { type: String, trim: true, maxlength: 300 },
    status: { type: String, enum: TABLE_STATUSES, default: 'LIBRE' },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

export { TABLE_STATUSES, TABLE_ZONES };
export default mongoose.model('Table', tableSchema);
```

### 2.2 `server-admin/src/tables/tableReservation.model.js`

```js
'use strict';

import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    guestName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    guestPhone: { type: String, trim: true },
    partySize: { type: Number, required: true, min: 1, max: 20 },
    reservationDate: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'],
      default: 'PENDIENTE',
    },
    notes: { type: String, trim: true, maxlength: 300 },
    cancelReason: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: String, required: true }, // req.user.id (mesero o admin que la creó)
  },
  { timestamps: true, versionKey: false }
);

/**
 * Devuelve las reservas que se solapan con [startTime, endTime) para una mesa,
 * excluyendo canceladas y, opcionalmente, una reserva puntual (para confirmar sin
 * chocar consigo misma).
 */
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

### 2.3 `server-admin/src/tables/table.service.js`

```js
'use strict';

import Table from './table.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { ensureRestaurantIsActive } from '../restaurants/restaurant.service.js';

export const getAll = async (filters = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.zone) query.zone = filters.zone;
  if (filters.status) query.status = filters.status;
  return await Table.find(query).sort({ tableNumber: 1 });
};

export const getById = async (id) => {
  const table = await Table.findById(id);
  if (!table) throw new AppError('Mesa no encontrada', 404);
  return table;
};

export const create = async (data) => {
  await ensureRestaurantIsActive(data.restaurantId);
  try {
    return await Table.create(data);
  } catch (err) {
    if (err.code === 11000) throw new AppError('Ya existe una mesa con ese número en este restaurante', 409, 'DUPLICATE');
    throw err;
  }
};

export const update = async (id, data) => {
  await getById(id);
  return await Table.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const changeStatus = async (id, status) => {
  await getById(id);
  return await Table.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
};

export const remove = async (id) => {
  const table = await getById(id);
  if (table.status === 'OCUPADA' || table.status === 'RESERVADA') {
    throw new AppError('No se puede eliminar una mesa ocupada o reservada', 409);
  }
  return await Table.findByIdAndDelete(id);
};
```

### 2.4 `server-admin/src/tables/reservation.service.js`

```js
'use strict';

import TableReservation from './tableReservation.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { getById as getTableById, changeStatus as changeTableStatus } from './table.service.js';

export const getAll = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.tableId) query.tableId = filters.tableId;
  return await TableReservation.find(query).sort({ startTime: 1 });
};

export const getPending = async () => {
  return await TableReservation.find({ status: 'PENDIENTE' }).sort({ startTime: 1 });
};

export const getById = async (id) => {
  const reservation = await TableReservation.findById(id);
  if (!reservation) throw new AppError('Reserva no encontrada', 404);
  return reservation;
};

/**
 * Crea la reserva. Se asume que `checkTableReservationConflict` (middleware, en
 * la ruta) ya validó que no hay solapamiento antes de llegar aquí.
 */
export const create = async (data, createdBy) => {
  await getTableById(data.tableId);
  const reservation = await TableReservation.create({ ...data, createdBy });
  return reservation;
};

export const confirm = async (id) => {
  const reservation = await getById(id);
  if (reservation.status !== 'PENDIENTE') {
    throw new AppError(`No se puede confirmar una reserva en estado ${reservation.status}`, 409);
  }
  reservation.status = 'CONFIRMADA';
  await reservation.save();
  await changeTableStatus(reservation.tableId, 'RESERVADA');
  return reservation;
};

export const cancel = async (id, cancelReason, requesterId, requesterRole) => {
  const reservation = await getById(id);

  if (requesterRole !== 'ADMIN_ROLE' && reservation.createdBy !== requesterId) {
    throw new AppError('No puedes cancelar una reserva que no creaste', 403);
  }
  if (reservation.status === 'CANCELADA' || reservation.status === 'COMPLETADA') {
    throw new AppError(`No se puede cancelar una reserva en estado ${reservation.status}`, 409);
  }

  reservation.status = 'CANCELADA';
  reservation.cancelReason = cancelReason || null;
  await reservation.save();

  const table = await getTableById(reservation.tableId);
  if (table.status === 'RESERVADA') {
    await changeTableStatus(reservation.tableId, 'LIBRE');
  }
  return reservation;
};
```

### 2.5 `server-admin/src/tables/table.controller.js`

```js
'use strict';

import * as tableService from './table.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, zone, status } = req.query;
    const items = await tableService.getAll({ restaurantId, zone, status });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await tableService.getById(req.params.id);
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const item = await tableService.create(req.body);
    res.status(201).json({ success: true, message: 'Mesa creada', data: item });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const item = await tableService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Mesa actualizada', data: item });
  } catch (err) {
    next(err);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const item = await tableService.changeStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, message: 'Estado de mesa actualizado', data: item });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await tableService.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Mesa eliminada' });
  } catch (err) {
    next(err);
  }
};
```

### 2.6 `server-admin/src/tables/reservation.controller.js`

```js
'use strict';

import * as reservationService from './reservation.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { status, tableId } = req.query;
    const items = await reservationService.getAll({ status, tableId });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getPending = async (req, res, next) => {
  try {
    const items = await reservationService.getPending();
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = req.tableReservation || (await reservationService.getById(req.params.id));
    if (req.user.role !== 'ADMIN_ROLE' && item.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No puedes ver una reserva que no creaste' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const confirm = async (req, res, next) => {
  try {
    const item = await reservationService.confirm(req.params.id);
    res.status(200).json({ success: true, message: 'Reserva confirmada', data: item });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const item = await reservationService.cancel(
      req.params.id,
      req.body.cancelReason,
      req.user.id,
      req.user.role
    );
    res.status(200).json({ success: true, message: 'Reserva cancelada', data: item });
  } catch (err) {
    next(err);
  }
};
```

### 2.7 `server-admin/src/tables/table.routes.js`

Un solo router que monta mesas y reservas, igual que `table-validators.js` las agrupa en un solo archivo. Aquí **no** se crea una nueva ruta de creación de reservas — esa vive en `server-user` (sección 2.9).

```js
'use strict';

import { Router } from 'express';
import { param } from 'express-validator';
import * as tableController from './table.controller.js';
import * as reservationController from './reservation.controller.js';
import { checkValidators } from '../../middlewares/check-validators.js';
import { checkTableReservationConflict } from '../../middlewares/table-conflict.js';
import {
  validateGetTables,
  validateGetTableById,
  validateCreateTable,
  validateUpdateTable,
  validateTableStatusChange,
  validateDeleteTable,
  validateGetReservations,
  validateGetPendingReservations,
  validateGetReservationById,
  validateConfirmReservation,
  validateCancelReservation,
} from '../../middlewares/table-validators.js';

const router = Router();

// ── Mesas ──
router.get('/tables', validateGetTables, tableController.getAll);
router.get('/tables/:id', validateGetTableById, tableController.getOne);
router.post('/tables', validateCreateTable, tableController.create);
router.put('/tables/:id', validateUpdateTable, tableController.update);
router.patch('/tables/:id/status', validateTableStatusChange, tableController.changeStatus);
router.delete('/tables/:id', validateDeleteTable, tableController.remove);

// ── Reservas (creación vive en server-user) ──
router.get('/reservations', validateGetReservations, reservationController.getAll);
router.get('/reservations/pending', validateGetPendingReservations, reservationController.getPending);
router.get(
  '/reservations/:id',
  validateGetReservationById,
  checkTableReservationConflict.length ? (req, res, next) => next() : (req, res, next) => next(), // no-op: el conflicto solo aplica a creación/confirmación
  reservationController.getOne
);
router.put('/reservations/:id/confirm', validateConfirmReservation, checkTableReservationConflict, reservationController.confirm);
router.put('/reservations/:id/cancel', validateCancelReservation, reservationController.cancel);

export default router;
```

> Ojo con la línea de `GET /reservations/:id`: la dejé con un no-op explícito para que quede claro que **no** debe pasar por `checkTableReservationConflict` (ese middleware espera `req.params.id` para cargar la reserva en el caso de confirmación, y si lo pones en el GET puede interferir). Si te resulta confuso, simplemente bórrala y deja `router.get('/reservations/:id', validateGetReservationById, reservationController.getOne);` — es funcionalmente igual, la línea de más era solo para dejar constancia de la decisión.

### 2.8 `server-user/src/tables/tableReservation.model.js`

Copia del mismo schema (mismo nombre de colección, misma base de datos):

```js
'use strict';

// Copia exacta de server-admin/src/tables/tableReservation.model.js
// Mantener sincronizado si cambia el schema del lado admin.

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

### 2.9 `server-user/src/tables/reservation.service.js`

```js
'use strict';

import TableReservation from './tableReservation.model.js';

export const create = async (data, createdBy) => {
  return await TableReservation.create({ ...data, createdBy });
};
```

### 2.10 `server-user/src/tables/reservation.controller.js`

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

### 2.11 `server-user/src/tables/reservation.routes.js`

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

> Copia también `table-conflict.js`, `table-time-validation.js`, `table-validators.js`, `validate-JWT.js`, `validate-role.js` (con el fix de `ROLES`) y `check-validators.js` a `server-user/middlewares/` — son los mismos archivos, sin cambios.

---

## 3. Comandas / Pedidos (`src/orders/`)

### 3.1 `server-admin/src/orders/order.model.js`

```js
'use strict';

import mongoose from 'mongoose';

const ORDER_STATUSES = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'];

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true }, // snapshot del nombre al momento del pedido
    unitPrice: { type: Number, required: true, min: 0 }, // snapshot del precio
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null }, // null = para llevar
    waiterId: { type: String, required: true }, // req.user.id de quien tomó el pedido
    items: { type: [orderItemSchema], validate: (v) => Array.isArray(v) && v.length > 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'PENDIENTE' },
    notes: { type: String, trim: true, maxlength: 300 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

export { ORDER_STATUSES };
export default mongoose.model('Order', orderSchema);
```

### 3.2 `server-admin/src/orders/order.service.js`

```js
'use strict';

import Order, { ORDER_STATUSES } from './order.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { restoreStockForItems } from '../menu/product.service.js';

const NEXT_STATUS = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['LISTO', 'CANCELADO'],
  LISTO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export const getAll = async (filters = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.status) query.status = filters.status;
  if (filters.tableId) query.tableId = filters.tableId;
  return await Order.find(query).sort({ createdAt: -1 });
};

export const getById = async (id) => {
  const order = await Order.findById(id);
  if (!order) throw new AppError('Pedido no encontrado', 404);
  return order;
};

export const updateStatus = async (id, newStatus) => {
  const order = await getById(id);
  const allowed = NEXT_STATUS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(`No se puede pasar de ${order.status} a ${newStatus}`, 409, 'INVALID_TRANSITION');
  }
  order.status = newStatus;
  return await order.save();
};

export const cancel = async (id) => {
  const order = await getById(id);
  if (!['PENDIENTE', 'EN_PREPARACION'].includes(order.status)) {
    throw new AppError(`No se puede cancelar un pedido en estado ${order.status}`, 409);
  }
  order.status = 'CANCELADO';
  await order.save();
  await restoreStockForItems(order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
  return order;
};

export { ORDER_STATUSES };
```

### 3.3 `server-admin/src/orders/order.controller.js`

```js
'use strict';

import * as orderService from './order.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, status, tableId } = req.query;
    const items = await orderService.getAll({ restaurantId, status, tableId });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await orderService.getById(req.params.id);
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const item = await orderService.updateStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, message: 'Estado del pedido actualizado', data: item });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const item = await orderService.cancel(req.params.id);
    res.status(200).json({ success: true, message: 'Pedido cancelado', data: item });
  } catch (err) {
    next(err);
  }
};
```

### 3.4 `server-admin/src/orders/order.routes.js`

```js
'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as orderController from './order.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';
import { ORDER_STATUSES } from './order.model.js';

const router = Router();

const validateId = [param('id').isMongoId().withMessage('ID inválido'), checkValidators];
const validateStatus = [
  body('status').isIn(ORDER_STATUSES).withMessage(`Estado inválido. Valores permitidos: ${ORDER_STATUSES.join(', ')}`),
  checkValidators,
];

router.get('/', validateJWT, requireRole('ADMIN_ROLE'), orderController.getAll);
router.get('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, orderController.getOne);
router.patch('/:id/status', validateJWT, requireRole('ADMIN_ROLE'), validateId, validateStatus, orderController.updateStatus);
router.patch('/:id/cancel', validateJWT, requireRole('ADMIN_ROLE'), validateId, orderController.cancel);

export default router;
```

### 3.5 `server-user/src/orders/order.model.js`

Misma copia que la sección 3.1 (mismo schema, misma colección `orders`).

### 3.6 `server-user/src/orders/order.service.js`

```js
'use strict';

import Order from './order.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { ensureRestaurantIsActive } from '../restaurants/restaurant.service.js';
import { ensureProductIsAvailable, deductStockForItems } from '../menu/product.service.js';

export const create = async (data, waiterId) => {
  await ensureRestaurantIsActive(data.restaurantId);

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new AppError('El pedido debe tener al menos un platillo', 400);
  }

  // Valida disponibilidad y arma snapshot de nombre/precio
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
    // Si falla la creación del documento después de descontar stock, revertir
    const { restoreStockForItems } = await import('../menu/product.service.js');
    await restoreStockForItems(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    throw err;
  }
};
```

> Necesitas también `restaurant.service.js` (al menos `ensureRestaurantIsActive`) y `product.service.js` (al menos `ensureProductIsAvailable`, `deductStockForItems`, `restoreStockForItems`) copiados o accesibles en `server-user`, ya que este service depende de ambos para validar antes de crear el pedido.

### 3.7 `server-user/src/orders/order.controller.js`

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

### 3.8 `server-user/src/orders/order.routes.js`

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

## 4. Facturación (`server-admin/src/billing/`)

Solo `server-admin` — no hay acción exclusiva de `USER_ROLE` aquí (facturar es trabajo de caja/administración). Si en tu operación real el mesero también cobra en mesa, avísame y agrego el archivo correspondiente en `server-user` con el mismo patrón que Comandas.

### 4.1 `src/billing/invoice.model.js`

```js
'use strict';

import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'], default: null },
    status: { type: String, enum: ['PENDIENTE', 'PAGADA', 'ANULADA'], default: 'PENDIENTE' },
    issuedBy: { type: String, required: true }, // req.user.id
    voidReason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model('Invoice', invoiceSchema);
```

### 4.2 `src/billing/invoice.service.js`

```js
'use strict';

import Invoice from './invoice.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { getById as getOrderById } from '../orders/order.service.js';

// Ajusta esta constante si la tasa cambia o si en algún momento la haces configurable.
const TAX_RATE = 0.12; // IVA Guatemala 12%

export const getAll = async (filters = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.status) query.status = filters.status;
  return await Invoice.find(query).sort({ createdAt: -1 });
};

export const getById = async (id) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new AppError('Factura no encontrada', 404);
  return invoice;
};

export const create = async (orderId, issuedBy) => {
  const order = await getOrderById(orderId);

  if (order.status !== 'ENTREGADO') {
    throw new AppError('Solo se puede facturar un pedido en estado ENTREGADO', 409);
  }

  const existing = await Invoice.findOne({ orderId });
  if (existing) throw new AppError('Este pedido ya tiene una factura', 409, 'DUPLICATE');

  const subtotal = order.total;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return await Invoice.create({
    orderId: order._id,
    restaurantId: order.restaurantId,
    subtotal,
    tax,
    total,
    issuedBy,
  });
};

export const markAsPaid = async (id, paymentMethod) => {
  const invoice = await getById(id);
  if (invoice.status !== 'PENDIENTE') {
    throw new AppError(`No se puede pagar una factura en estado ${invoice.status}`, 409);
  }
  invoice.status = 'PAGADA';
  invoice.paymentMethod = paymentMethod;
  return await invoice.save();
};

export const voidInvoice = async (id, reason) => {
  const invoice = await getById(id);
  if (invoice.status === 'ANULADA') {
    throw new AppError('Esta factura ya está anulada', 409);
  }
  invoice.status = 'ANULADA';
  invoice.voidReason = reason || null;
  return await invoice.save();
};
```

### 4.3 `src/billing/invoice.controller.js`

```js
'use strict';

import * as invoiceService from './invoice.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, status } = req.query;
    const items = await invoiceService.getAll({ restaurantId, status });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await invoiceService.getById(req.params.id);
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const item = await invoiceService.create(req.body.orderId, req.user.id);
    res.status(201).json({ success: true, message: 'Factura generada', data: item });
  } catch (err) {
    next(err);
  }
};

export const markAsPaid = async (req, res, next) => {
  try {
    const item = await invoiceService.markAsPaid(req.params.id, req.body.paymentMethod);
    res.status(200).json({ success: true, message: 'Factura pagada', data: item });
  } catch (err) {
    next(err);
  }
};

export const voidInvoice = async (req, res, next) => {
  try {
    const item = await invoiceService.voidInvoice(req.params.id, req.body.reason);
    res.status(200).json({ success: true, message: 'Factura anulada', data: item });
  } catch (err) {
    next(err);
  }
};
```

### 4.4 `src/billing/invoice.routes.js`

```js
'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as invoiceController from './invoice.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';

const router = Router();

const validateId = [param('id').isMongoId().withMessage('ID inválido'), checkValidators];
const validateCreate = [body('orderId').isMongoId().withMessage('orderId inválido'), checkValidators];
const validatePay = [
  body('paymentMethod').isIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']).withMessage('Método de pago inválido'),
  checkValidators,
];

router.get('/', validateJWT, requireRole('ADMIN_ROLE'), invoiceController.getAll);
router.get('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, invoiceController.getOne);
router.post('/', validateJWT, requireRole('ADMIN_ROLE'), validateCreate, invoiceController.create);
router.patch('/:id/pay', validateJWT, requireRole('ADMIN_ROLE'), validateId, validatePay, invoiceController.markAsPaid);
router.patch('/:id/void', validateJWT, requireRole('ADMIN_ROLE'), validateId, invoiceController.voidInvoice);

export default router;
```

---

## 5. Montar los routers

En el `app.js`/`index.js` de cada servidor (ajusta el prefijo `/api` si el tuyo es distinto):

**server-admin:**
```js
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api', tableRoutes); // ya incluye /tables y /reservations internamente
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
```

**server-user:**
```js
app.use('/api', reservationRoutes); // POST /reservations
app.use('/api/orders', orderRoutes);  // POST /orders
```

---

## 6. Checklist de archivos a crear

**server-admin:**
- [ ] `middlewares/validate-role.js` → agregar `export const ROLES`
- [ ] `src/menu/category.model.js`, `category.service.js`, `category.controller.js`, `category.routes.js`
- [ ] `src/menu/product.model.js`, `product.service.js`, `product.controller.js`, `product.routes.js`
- [ ] `src/tables/table.model.js`, `tableReservation.model.js`
- [ ] `src/tables/table.service.js`, `reservation.service.js`
- [ ] `src/tables/table.controller.js`, `reservation.controller.js`
- [ ] `src/tables/table.routes.js`
- [ ] `src/orders/order.model.js`, `order.service.js`, `order.controller.js`, `order.routes.js`
- [ ] `src/billing/invoice.model.js`, `invoice.service.js`, `invoice.controller.js`, `invoice.routes.js`
- [ ] Montar los 5 routers en `app.js`/`index.js`

**server-user:**
- [ ] Copiar `middlewares/` necesarios: `validate-JWT.js`, `validate-role.js` (con `ROLES`), `check-validators.js`, `table-conflict.js`, `table-time-validation.js`, `table-validators.js`
- [ ] `src/restaurants/restaurant.service.js` (al menos `ensureRestaurantIsActive`)
- [ ] `src/menu/product.service.js` (al menos `ensureProductIsAvailable`, `deductStockForItems`, `restoreStockForItems`)
- [ ] `src/tables/tableReservation.model.js`, `reservation.service.js`, `reservation.controller.js`, `reservation.routes.js`
- [ ] `src/orders/order.model.js`, `order.service.js`, `order.controller.js`, `order.routes.js`
- [ ] Montar los 2 routers en `app.js`/`index.js`

## 7. Checklist de pruebas manuales

- [ ] Crear categoría → crear platillo con imagen → verificar que sube a Cloudinary y guarda `imageUrl`
- [ ] Dar de baja un platillo → verificar que no aparece en `GET /products` sin `includeInactive=true` como admin
- [ ] Crear mesa → crear reserva desde `server-user` en un horario que se solapa con otra → esperar `409`
- [ ] Confirmar reserva → verificar que la mesa pasa a `RESERVADA`
- [ ] Cancelar reserva confirmada → verificar que la mesa vuelve a `LIBRE`
- [ ] Crear pedido desde `server-user` con más cantidad que el stock disponible → esperar `409 INSUFFICIENT_STOCK` y que el stock no haya cambiado
- [ ] Crear pedido válido → verificar que el stock del platillo se descontó
- [ ] Cambiar estado del pedido `PENDIENTE → LISTO` directamente (saltando `EN_PREPARACION`) → esperar `409 INVALID_TRANSITION`
- [ ] Cancelar pedido en `PENDIENTE` → verificar que el stock se repuso
- [ ] Facturar un pedido que no está `ENTREGADO` → esperar `409`
- [ ] Facturar un pedido `ENTREGADO` → verificar cálculo de IVA (12%) y que no se puede facturar dos veces el mismo pedido
