# Implementation Plan: Gestión de Menú e Inventario

**Branch**: `002-menu-inventario` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-menu-inventario/spec.md`

## Summary

Implementar el módulo de menú e inventario sobre el código existente en src/menu, extendiendo el modelo de productos, agregando categorías e ingredientes con scoping por restaurantId, reutilizando el guard de restaurante activo de Restaurantes y manteniendo la arquitectura modular y el contrato de respuestas del repositorio.

## Technical Context

**Language/Version**: Node.js 18+, Express 5, MongoDB + Mongoose

**Primary Dependencies**: express, mongoose, express-validator, multer, cloudinary, multer-storage-cloudinary

**Storage**: MongoDB for menu data and inventory; Cloudinary for image uploads

**Testing**: Manual API verification and validation flow checks, since the repository currently has no dedicated test harness for these modules

**Target Platform**: Existing Node.js admin service

**Project Type**: web-service

**Performance Goals**: Support standard admin/menu browsing operations with scoped reads and simple filters

**Constraints**: Must reuse existing auth, validation, and error middleware; must avoid introducing parallel implementations; must keep all data scoping within a single restaurant.

**Scale/Scope**: Single restaurant scope per request; categories, ingredients, and products are stored per restaurant and never shared across restaurants.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The feature stays within the auth-service boundary; no new auth, login, registration, password handling, or role-management logic is introduced.
- Every new resource is scoped by restaurantId and reuses ensureRestaurantIsActive before create/update operations.
- Menu and inventory changes preserve consistency between product availability and ingredient stock, with non-negative stock and price rules.
- The feature follows the shared response envelope { success, message, data } and the existing status-code contract.
- New upload, validation, and error-handling work reuse the shared middleware and error-handler modules.

## Project Structure

### Documentation (this feature)

```text
specs/002-menu-inventario/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── api.md
├── checklists/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── menu/
│   ├── menu.model.js
│   ├── menu.service.js
│   ├── menu.controller.js
│   ├── menu.routes.js
│   ├── category.model.js
│   └── ingredient.model.js
├── restaurants/
│   └── restaurant.service.js
middlewares/
├── file-uploader.js
├── handle-errors.js
└── validate-JWT.js
```

**Structure Decision**: Extend the current src/menu module with new domain-specific files for Category and Ingredient while keeping the existing controller/service/route pattern already used by the repository.

## Phase 0: Research & Design Decisions

1. Confirm that the current menu model can be extended in place with restaurantId, category reference, recipeItems, and status handling.
2. Define the data model for Category and Ingredient with shared restaurant scoping, active flag, and inventory threshold fields.
3. Contrato de scoping por restaurante: `restaurantId` viaja siempre como parámetro de ruta (`/restaurants/:restaurantId/...`), en lecturas y escrituras por igual. Ningún endpoint acepta `restaurantId` por query, header o body — un solo mecanismo para todo el módulo, sin excepciones.
4. Confirmar dos decisiones de inventario distintas para el MVP, que no deben confundirse entre sí:
   - El **descuento de stock por venta** (al confirmarse una comanda) permanece manual en este MVP; no hay integración automática con el futuro servicio de Comandas.
   - La **disponibilidad del producto** (`Disponible`/`Agotado`) SÍ se recalcula automáticamente cada vez que cambia el stock de un ingrediente asociado, según FR-006 — esto no es manual ni requiere confirmación del ADMIN.

## Phase 1: Data Model & Contracts

### Data model

- MenuItem
  - name: String, required, trim, maxlength 100
  - description: String, optional, maxlength 300
  - price: Number, required, min 0
  - category: ObjectId ref Category, required
  - status: String enum [Disponible, Agotado], default Disponible
  - restaurantId: ObjectId ref Restaurant, required, indexed
  - image: String|null
  - imagePublicId: String|null
  - recipeItems: [{ ingredientId, quantityPerServing }]
  - timestamps, versionKey false

- Category
  - name: String, required, trim, maxlength 100
  - restaurantId: ObjectId ref Restaurant, required, indexed
  - isActive: Boolean, default true
  - timestamps, versionKey false

- Ingredient
  - name: String, required, trim, maxlength 100
  - restaurantId: ObjectId ref Restaurant, required, indexed
  - stock: Number, required, min 0
  - unit: String, required, trim, maxlength 50
  - lowStockThreshold: Number, required, min 0
  - timestamps, versionKey false

### API contracts

Todos los endpoints reciben `restaurantId` como parámetro de ruta (ver Phase 0, punto 3) — nunca por query, header o body:

- GET /restaurants/:restaurantId/menu-items?category=:categoryId
- GET /restaurants/:restaurantId/menu-items/:id
- POST /restaurants/:restaurantId/menu-items (multipart, imagen opcional)
- PATCH /restaurants/:restaurantId/menu-items/:id
- PATCH /restaurants/:restaurantId/menu-items/:id/status
- GET /restaurants/:restaurantId/categories
- POST /restaurants/:restaurantId/categories
- PATCH /restaurants/:restaurantId/categories/:id
- DELETE /restaurants/:restaurantId/categories/:id
- GET /restaurants/:restaurantId/ingredients
- POST /restaurants/:restaurantId/ingredients
- PATCH /restaurants/:restaurantId/ingredients/:id
- POST /restaurants/:restaurantId/ingredients/:id/adjust-stock

Todas las escrituras (POST/PATCH/DELETE) validan primero `ensureRestaurantIsActive(restaurantId)`; si el restaurante está inactivo, responden `409` con `El restaurante no está activo` antes de tocar la base de datos. Todo rechazo por valor negativo (precio o stock) responde `400` con el sobre `{ success: false, errors: [...] }`.

## Phase 2: Implementation Plan

1. Extend the existing menu model and add Category and Ingredient models under src/menu.
2. Update menu service logic to:
   - enforce the restaurant activation guard before create/update operations,
   - scope reads and writes by restaurantId, always transported as a route parameter,
   - validate negative price/stock values, rejecting with HTTP 400 and the shared
     { success: false, errors: [...] } envelope,
   - preserve existing image upload behavior with the shared uploader.
3. Update menu controller and routes to:
   - use the shared auth middleware and validator middleware,
   - mount the new category and ingredient endpoints under the same module,
   - enforce admin-only writes and validate input payloads.
4. Generalize the file uploader to add a menu-specific Cloudinary folder while keeping the existing structure for other domains.
5. Add documentation artifacts: research.md, data-model.md, quickstart.md, and contracts/.

## Constitution Check Reassessment

The plan remains aligned with the constitution because it reuses the restaurant activation guard, keeps the data scoped by restaurantId, and avoids new auth or cross-service inventory logic.