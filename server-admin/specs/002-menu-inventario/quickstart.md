# Quickstart: Validar Menú e Inventario

## Prerequisites

- Instancia de MongoDB corriendo y accesible.
- Servidor levantado con las variables de entorno del proyecto configuradas.
- Al menos un restaurante `active: true` y uno `active: false` ya creados (vía el servicio de Restaurantes).

## Validation steps

1. Levantar el servidor:
   - `pnpm dev`
2. Crear una categoría con `POST /restaurants/:restaurantId/categories` para un restaurante activo. Verificar `201`.
3. Intentar crear una categoría, producto o ingrediente contra el `restaurantId` del restaurante inactivo. Verificar `409` con el mensaje `El restaurante no está activo`.
4. Crear un ingrediente con `stock: 5` y un `MenuItem` que lo referencie en `recipeItems`. Verificar que el producto queda `Disponible`.
5. Ajustar el stock del ingrediente a `0`. Verificar que el `MenuItem` pasa automáticamente a `Agotado` sin ninguna llamada adicional.
6. Volver a subir el stock del ingrediente por encima de `0`. Verificar que el `MenuItem` vuelve automáticamente a `Disponible`.
7. Intentar crear un producto con `price: -10` o ajustar un ingrediente a `stock: -1`. Verificar `400` con el sobre `{ success: false, errors: [...] }`.
8. Intentar eliminar una categoría que tenga productos activos asociados. Verificar `409`.
9. Consultar `GET /restaurants/:restaurantId/menu-items` autenticado como `USER_ROLE` y confirmar que solo aparecen productos `Disponible` y del `restaurantId` solicitado (nunca de otro restaurante).

## Expected outcomes

- Ninguna operación de escritura contra un restaurante inactivo llega a persistir datos.
- La disponibilidad de un producto siempre refleja el stock real de sus ingredientes, sin intervención manual.
- Ningún endpoint mezcla datos entre restaurantes distintos.
- Los errores de validación de valores negativos siguen el mismo contrato que el resto del proyecto.
