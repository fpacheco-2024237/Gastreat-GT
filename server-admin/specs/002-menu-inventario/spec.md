# Feature Specification: Gestión de Menú e Inventario

**Feature Branch**: `002-menu-inventario`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Gestión de Menú e Inventario"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin manages the restaurant menu catalog (Priority: P1)

Como administrador, quiero crear, editar, visualizar y desactivar productos del menú de mi restaurante para mantener el catálogo actualizado y alineado con lo que realmente puedo preparar.

**Why this priority**: This is the core value of the feature because it enables day-to-day menu administration and directly impacts what customers can see.

**Independent Test**: An admin can create a product, update its price and availability, and see it reflected in the restaurant menu view without affecting other restaurants.

**Acceptance Scenarios**:

1. **Given** a restaurant is active, **When** an admin creates a new product with name, description, price, category, image, and availability, **Then** the product is stored under that restaurant and is available for later retrieval.
2. **Given** a product already exists, **When** an admin updates only its price or availability, **Then** the change is saved without forcing a full product replacement.
3. **Given** a product is no longer available, **When** the admin changes its status to unavailable, **Then** the product is no longer presented as available to users.

---

### User Story 2 - Admin manages categories and ingredient inventory (Priority: P1)

Como administrador, quiero gestionar categorías propias de mi restaurante y llevar un inventario básico de ingredientes para asegurar que el menú se mantenga consistente con la capacidad real de preparación.

**Why this priority**: Categories and inventory are foundational for correct menu organization and operational control.

**Independent Test**: An admin can create categories, create ingredients with stock and unit, adjust stock manually, and associate ingredients to a product.

**Acceptance Scenarios**:

1. **Given** a restaurant is active, **When** an admin creates a new category for that restaurant, **Then** the category is stored only for that restaurant and can be reused by products.
2. **Given** a category has active products associated, **When** an admin tries to delete it, **Then** the deletion is blocked and the category remains available.
3. **Given** an ingredient exists with stock, **When** an admin adjusts the stock manually, **Then** the new stock value is saved and the product can be evaluated against it.

---

### User Story 3 - User browses the available menu (Priority: P2)

Como cliente, quiero ver los productos disponibles de un restaurante elegido, filtrados por categoría, para tomar una decisión rápida y clara.

**Why this priority**: This provides direct user value by making the menu visible and usable without exposing unavailable or cross-restaurant items.

**Independent Test**: A user can select a restaurant and see only the products marked as available for that restaurant, filtered by category.

**Acceptance Scenarios**:

1. **Given** a restaurant has available products, **When** a user requests the menu, **Then** only products marked as available are returned.
2. **Given** a user applies a category filter, **When** the menu is requested, **Then** the results include only products from the selected category and restaurant.
3. **Given** a product is marked as unavailable, **When** a user browses the menu, **Then** the product is not shown as available.

---

### Edge Cases

- Un ADMIN que intenta crear o actualizar un producto, categoría o ingrediente contra un restaurante inactivo recibe `409` con el mensaje `El restaurante no está activo`, antes de que la operación toque la base de datos (reutilizando el guard `ensureRestaurantIsActive` del servicio de Restaurantes).
- Un precio o stock negativo, en cualquier operación de creación, actualización o ajuste, se rechaza con `400` y el sobre estándar `{ success: false, errors: [...] }`; el cambio no se persiste.
- Si se intenta eliminar una categoría con productos activos asociados, la operación se rechaza con `409` y la categoría permanece sin cambios.
- Si falla la subida de imagen durante la creación o actualización de un producto, la operación completa se rechaza — no se persisten datos parciales del producto — y cualquier archivo temporal se limpia.

## Functional Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an admin to create, read, update, and deactivate products within a single restaurant context, with every product scoped to that restaurant.
- **FR-002**: The system MUST allow an admin to create, rename, and deactivate categories for a restaurant, and MUST prevent deletion of a category when active products are still associated with it, rejecting the attempt with HTTP 409.
- **FR-003**: The system MUST allow an admin to create, read, update, and delete ingredients for a restaurant, including current stock, unit of measure, and low-stock threshold.
- **FR-004**: The system MUST allow an admin to manually adjust ingredient stock through entry and exit operations without allowing negative values; any attempt to set a negative value MUST be rejected with HTTP 400 and the shared { success: false, errors: [...] } envelope.
- **FR-005**: The system MUST allow an admin to associate ingredients to a product by portion and to keep that relationship attached to the product for inventory evaluation.
- **FR-006**: El sistema DEBE recalcular automáticamente la disponibilidad de un platillo cada vez que cambie el stock de cualquiera de sus ingredientes asociados. Si algún ingrediente asociado llega a stock 0, el platillo DEBE pasar automáticamente a Agotado. Si posteriormente todos sus ingredientes vuelven a tener stock > 0, el platillo DEBE volver automáticamente a Disponible. No existe una anulación manual de este cálculo en este MVP.
- **FR-007**: The system MUST allow price and availability to be updated independently from the rest of the product data.
- **FR-008**: The system MUST expose a user-facing menu view that returns only available products for the selected restaurant and supports filtering by category.
- **FR-009**: The system MUST reject create or update operations for products, categories, or ingredients when the referenced restaurant is inactive, returning HTTP 409 with the message "El restaurante no está activo" via the shared ensureRestaurantIsActive guard, before any persistence occurs.
- **FR-010**: The system MUST reject any price or stock change that would create a negative value, returning HTTP 400 with the shared { success: false, errors: [...] } envelope, consistent with the rest of the project.

### Key Entities *(include if feature involves data)*

- **Product**: Represents a menu item or beverage offered by a restaurant, including name, description, price, availability, category, image, and restaurant scoping.
- **Category**: Represents a menu grouping created by an admin for a specific restaurant and reused by products.
- **Ingredient**: Represents a consumable item tracked by the restaurant, including current stock, unit, low-stock threshold, and restaurant scoping.
- **Recipe Item**: Represents the quantity of an ingredient consumed by one serving of a product.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can create or update a product, category, or ingredient and have the change reflected in the restaurant’s menu view without cross-restaurant leakage.
- **SC-002**: At least 95% of menu and inventory management actions completed by admins are successful on the first attempt without validation errors.
- **SC-003**: Users can find and filter available products for a restaurant in under 5 seconds in normal conditions.
- **SC-004**: No product, category, or ingredient operation allows a negative price or negative stock value.
- **SC-005**: Restaurant creation and update flows reject duplicate names and
missing required fields (name, address); taxId remains optional and is
not subject to format validation.

## Assumptions

- Categories are managed per restaurant and are not shared globally across the platform.
- Automatic stock deduction during order creation is out of scope for this MVP and remains a future cross-service enhancement.
- The active-restaurant guard provided by the restaurants service is reused for all create and update operations.
- The feature focuses on administrative management and user-facing menu visibility, not on authentication or order lifecycle handling.