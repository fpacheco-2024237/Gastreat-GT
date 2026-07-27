# Research: Gestión de Menú e Inventario

## Decision 1: `restaurantId` siempre como parámetro de ruta

**Decision**: Todo endpoint de MenuItem, Category e Ingredient recibe `restaurantId` como parámetro de ruta (`/restaurants/:restaurantId/...`), nunca por query string ni por body.

**Rationale**: Un único mecanismo de transporte evita comportamiento inconsistente entre endpoints y hace trivial aplicar el guard de restaurante activo y el scoping en un solo middleware compartido.

**Alternatives considered**:
- Header custom (`X-Restaurant-Id`): rechazado porque no es visible en la URL, dificulta el testing manual y no sigue el patrón REST ya usado en el resto del proyecto.
- Body para operaciones de escritura: rechazado porque GET no tiene body y crearía dos convenciones distintas según el verbo HTTP.

## Decision 2: Categoría como colección propia, no enum

**Decision**: `Category` es un modelo Mongoose independiente (`name`, `restaurantId`, `isActive`), no un enum fijo en `MenuItem`.

**Rationale**: El ADMIN debe poder crear categorías nuevas por restaurante sin requerir un cambio de código; un enum fijo no lo permite.

**Alternatives considered**:
- Enum fijo (`Comida/Bebida/Postre/Entrada/Otro`): rechazado porque bloquea la extensibilidad que pide la historia de usuario.

## Decision 3: Descuento de inventario por venta — manual en este MVP

**Decision**: El stock de un ingrediente solo se ajusta manualmente desde el endpoint de ajuste de stock. La integración automática con el servicio de Comandas (descuento al confirmar una comanda) queda fuera de alcance de esta feature.

**Rationale**: Automatizar el descuento cruzando con Comandas crea una dependencia dura entre dos dominios que todavía no existe (Comandas es la feature 004). Resolverlo ahora obligaría a diseñar esa integración antes de tener el propio servicio de Comandas implementado.

**Alternatives considered**:
- Descuento automático vía llamada directa al modelo Order: rechazado por orden de construcción (Comandas todavía no existe) y por acoplar dos dominios prematuramente.

## Decision 4: Disponibilidad automática por stock de ingredientes

**Decision**: Cada vez que se ajusta el stock de un `Ingredient`, el servicio recalcula automáticamente el `status` de todos los `MenuItem` que lo referencian en `recipeItems`: si algún ingrediente requerido queda en 0, el platillo pasa a `Agotado`; si todos vuelven a tener stock > 0, el platillo vuelve a `Disponible`. No hay anulación manual de este cálculo en este MVP.

**Rationale**: Deja el estado del menú siempre consistente con el inventario real sin depender de que el ADMIN recuerde marcar manualmente cada platillo afectado, que es justo el tipo de inconsistencia que el requerimiento original buscaba evitar.

**Alternatives considered**:
- Confirmación manual del ADMIN: rechazada porque reintroduce el riesgo de que el menú muestre un platillo como disponible cuando ya no se puede preparar.

## Decision 5: Contrato de validación para valores negativos

**Decision**: Precio o stock negativo en creación, actualización o ajuste de stock se rechaza con `400` y el sobre `{ success: false, errors: [...] }`, reutilizando `checkValidators`/`handle-errors.js` ya existentes.

**Rationale**: Mantiene un único contrato de error en todo el proyecto; no hay razón de negocio para que este dominio responda distinto a Restaurantes.

**Alternatives considered**:
- Contrato de error propio para Menú: rechazado, viola el Principio IV (contrato de API consistente) de la constitución.

## Decision 6: Aislamiento de imágenes por dominio (Cloudinary)

**Decision**: Las imágenes de productos del menú se suben a una carpeta de Cloudinary específica (`gastreat_gt/menu`), generalizando `file-uploader.js` en vez de crear un uploader paralelo, y reutilizando `delete-file-on-error.js` para limpiar archivos temporales si la operación falla.

**Rationale**: Evita que un bug de configuración mezcle imágenes de menú con las de otros dominios (canchas/equipos, heredadas de la plantilla original), y evita archivos huérfanos en Cloudinary si la creación del producto falla a mitad de camino.

**Alternatives considered**:
- Uploader dedicado y duplicado para menú: rechazado por el Principio V (no crear uploaders duplicados por dominio).
