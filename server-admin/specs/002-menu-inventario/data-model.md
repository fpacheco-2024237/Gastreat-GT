# Data Model: Gestión de Menú e Inventario

## Entity: MenuItem

**Purpose**: Representa un platillo o bebida del catálogo de un restaurante.

### Fields

- `id`: identificador único
- `restaurantId`: ObjectId, ref `Restaurant`, required, indexado
- `name`: string, required
- `description`: string, opcional
- `price`: number, required, mínimo 0
- `category`: ObjectId, ref `Category`, required
- `image` / `imagePublicId`: string, opcionales (Cloudinary)
- `status`: enum `["Disponible", "Agotado"]`, default `"Disponible"`
- `recipeItems`: array de `{ ingredientId: ObjectId (ref Ingredient), quantityPerServing: number }`
- `createdAt` / `updatedAt`

### Validation rules

- `restaurantId`, `name`, `price`, `category` son obligatorios.
- `price` no puede ser negativo.
- `restaurantId` debe corresponder a un restaurante activo al crear o actualizar (validado vía `ensureRestaurantIsActive`).
- `category` debe pertenecer al mismo `restaurantId` que el `MenuItem`.
- Cada `ingredientId` en `recipeItems` debe pertenecer al mismo `restaurantId`.

### State transitions

- `status` se recalcula automáticamente (ver Decision 4 en `research.md`): pasa a `Agotado` si algún ingrediente de `recipeItems` tiene stock 0; vuelve a `Disponible` cuando todos los ingredientes de `recipeItems` tienen stock > 0.
- `price` y `status` pueden actualizarse de forma independiente del resto del producto (endpoint específico), sin afectar los demás campos.

## Entity: Category

**Purpose**: Agrupa productos del menú dentro de un restaurante.

### Fields

- `id`: identificador único
- `restaurantId`: ObjectId, ref `Restaurant`, required, indexado
- `name`: string, required
- `isActive`: boolean, default `true`

### Validation rules

- `name` único por `restaurantId` (no globalmente).
- No se puede eliminar una categoría que tenga `MenuItem` activos asociados — se rechaza con `409`.

## Entity: Ingredient

**Purpose**: Representa un insumo con control básico de inventario.

### Fields

- `id`: identificador único
- `restaurantId`: ObjectId, ref `Restaurant`, required, indexado
- `name`: string, required
- `stock`: number, required, mínimo 0
- `unit`: string, required
- `lowStockThreshold`: number, opcional (solo informativo; no bloquea operaciones)

### Validation rules

- `stock` no puede ser negativo en ningún momento (ni en creación ni en ajuste).
- El ajuste de stock es siempre manual en este MVP (ver Decision 3 en `research.md`).
- Cada ajuste de stock dispara el recálculo de disponibilidad de los `MenuItem` que referencian este ingrediente (Decision 4).

## Relationships

- `MenuItem.category` → `Category` (misma `restaurantId`).
- `MenuItem.recipeItems[].ingredientId` → `Ingredient` (misma `restaurantId`).
- Todas las entidades dependen de `Restaurant` vía `restaurantId` y deben validar que el restaurante esté activo antes de cualquier escritura (`ensureRestaurantIsActive`).

## Service-level invariants

- Ninguna query de lectura o escritura cruza `restaurantId`: todo endpoint recibe `restaurantId` como parámetro de ruta y filtra por él (Decision 1).
- Toda escritura (crear/actualizar/ajustar stock/eliminar) valida primero que el restaurante esté activo; si no lo está, se rechaza con `409` y el mensaje `El restaurante no está activo` antes de tocar la base de datos.
- Toda validación de valores negativos responde `400` con el sobre `{ success: false, errors: [...] }`.
