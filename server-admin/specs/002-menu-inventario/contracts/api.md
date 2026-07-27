# API Contracts: Gestión de Menú e Inventario

Todos los endpoints reciben `restaurantId` como parámetro de ruta — nunca por query, header o body. Este es el único mecanismo de scoping para todo el módulo (ver `research.md`, Decision 1).

## MenuItem

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/menu-items` | validateJWT | Filtra por `category` opcional vía query. USER solo ve `status: "Disponible"`. |
| GET | `/restaurants/:restaurantId/menu-items/:id` | validateJWT | 404 si no existe o pertenece a otro restaurante. |
| POST | `/restaurants/:restaurantId/menu-items` | validateJWT + requireRole('ADMIN_ROLE') | multipart/form-data, imagen opcional. 409 si el restaurante está inactivo. |
| PATCH | `/restaurants/:restaurantId/menu-items/:id` | validateJWT + requireRole('ADMIN_ROLE') | 409 si el restaurante está inactivo. |
| PATCH | `/restaurants/:restaurantId/menu-items/:id/status` | validateJWT + requireRole('ADMIN_ROLE') | Cambio de disponibilidad manual (independiente del recálculo automático de FR-006). |

## Category

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/categories` | validateJWT | |
| POST | `/restaurants/:restaurantId/categories` | validateJWT + requireRole('ADMIN_ROLE') | 409 si el restaurante está inactivo. |
| PATCH | `/restaurants/:restaurantId/categories/:id` | validateJWT + requireRole('ADMIN_ROLE') | |
| DELETE | `/restaurants/:restaurantId/categories/:id` | validateJWT + requireRole('ADMIN_ROLE') | 409 si tiene productos activos asociados. |

## Ingredient

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| GET | `/restaurants/:restaurantId/ingredients` | validateJWT + requireRole('ADMIN_ROLE') | |
| POST | `/restaurants/:restaurantId/ingredients` | validateJWT + requireRole('ADMIN_ROLE') | 409 si el restaurante está inactivo. |
| PATCH | `/restaurants/:restaurantId/ingredients/:id` | validateJWT + requireRole('ADMIN_ROLE') | |
| POST | `/restaurants/:restaurantId/ingredients/:id/adjust-stock` | validateJWT + requireRole('ADMIN_ROLE') | Rechaza stock negativo con 400. Dispara el recálculo automático de disponibilidad (FR-006) sobre todo MenuItem que referencie este ingrediente en `recipeItems`. |

## Contrato de errores común

- Restaurante inactivo en cualquier escritura: `409` + `{ success: false, message: "El restaurante no está activo" }`.
- Precio o stock negativo: `400` + `{ success: false, errors: [...] }`.
- Categoría con productos activos al eliminar: `409` + `{ success: false, message: "..." }`.
- Recurso no encontrado o de otro restaurante: `404`.
