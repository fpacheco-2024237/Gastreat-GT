# Feature Specification: Gestión de Restaurantes

**Feature Branch**: `001-restaurants-active-filter`

**Created**: 2026-07-17

**Status**: Draft

**Input**: Gestión de Restaurantes (entidad raíz de la plataforma Gastreat GT).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear y administrar restaurantes (Priority: P1)

Como administrador, quiero crear, editar y administrar restaurantes para que cada establecimiento funcione como una entidad independiente dentro de la plataforma.

**Why this priority**: Este flujo es la base operativa del dominio y permite que los demás servicios dependientes se apoyen en una entidad válida.

**Independent Test**: Un administrador autenticado puede crear un restaurante con nombre y dirección, y luego editarlo o reactivarlo.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea un restaurante con nombre y dirección (con `taxId`, `openTime`, `closeTime` y administradores opcionales), **Then** el restaurante queda persistido con estado activo y los datos requeridos.
2. **Given** un administrador autenticado, **When** actualiza un restaurante existente, **Then** los cambios se aplican y el recurso queda disponible para operaciones posteriores.
3. **Given** un administrador autenticado, **When** reactiva un restaurante previamente dado de baja, **Then** el estado cambia a activo y vuelve a estar disponible para los flujos normales.

---

### User Story 2 - Listado y detalle para usuarios y administradores (Priority: P1)

Como usuario, quiero ver únicamente restaurantes activos y, como administrador, poder incluir los inactivos cuando sea necesario, para poder navegar o auditar los establecimientos sin exponer información innecesaria.

**Why this priority**: El comportamiento por defecto debe proteger la visibilidad del sistema y evitar que los usuarios vean recursos inactivos, mientras los administradores conservan capacidad de auditoría.

**Independent Test**: Un usuario obtiene solo restaurantes activos; un administrador puede pedir explícitamente los inactivos con un parámetro claro.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado, **When** consulta el listado general de restaurantes, **Then** solo aparecen los restaurantes con `active: true`.
2. **Given** un administrador autenticado, **When** consulta el listado con `?includeInactive=true`, **Then** también se incluyen los restaurantes con `active: false`.
3. **Given** un usuario autenticado, **When** intenta consultar el detalle de un restaurante inactivo, **Then** el sistema responde `404` con el mensaje `Restaurante no encontrado`.

---

### User Story 3 - Protección del dominio frente a recursos inactivos (Priority: P2)

Como administrador o servicio dependiente, quiero que cualquier operación que apunte a un restaurante inactivo se rechace explícitamente, para preservar la integridad del dominio y evitar que se creen datos sobre un establecimiento dado de baja.

**Why this priority**: Esto evita inconsistencias operativas y garantiza que los servicios dependientes no actúen sobre entidades inválidas.

**Independent Test**: Un servicio dependiente que intente crear o modificar datos con un `restaurantId` inactivo recibe `409` con el mensaje `El restaurante no está activo`.

**Acceptance Scenarios**:

1. **Given** un restaurante inactivo, **When** un servicio dependiente intenta crear o modificar datos contra ese `restaurantId`, **Then** la operación es rechazada con `409` y el mensaje indicado.
2. **Given** un administrador autenticado,
   **When** elimina lógicamente un restaurante que tiene menú, mesas o comandas activas,
   **Then** el restaurante cambia a estado inactivo, los recursos dependientes permanecen almacenados en modo de solo lectura y cualquier operación de escritura posterior debe responder HTTP 409.

---

### Edge Cases

- Si un restaurante está inactivo, los usuarios no deben poder descubrirlo por detalle ni por listado por defecto.
- Si un administrador intenta listar inactivos sin el parámetro explícito, el sistema debe seguir excluyéndolos por defecto.
- Si un restaurante está inactivo y un servicio dependiente intenta escribir, la operación debe abortarse antes de tocar la base de datos.
- Si un administrador intenta reactivar un restaurante que estaba dado de baja, la operación debe cambiar el estado a activo sin borrar información histórica.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support complete CRUD for restaurants, including logical deletion with `active: false`, `deletedAt`, and `deletedBy`.
- **FR-002**: The system MUST return active restaurants by default in general listing endpoints.
- **FR-003**: The system MUST allow users with `ADMIN_ROLE` to include inactive restaurants explicitly via `?includeInactive=true`. Administrators may retrieve any restaurant for administration and auditing purposes.
- **FR-004**: The system MUST prevent non-admin users from discovering inactive restaurants through detail endpoints by returning `404` with the message `Restaurante no encontrado`.
- **FR-005**: The system MUST enforce RBAC authorization (ADMIN_ROLE) for mutation operations (create, update, delete, reactivate). Any authenticated user with `ADMIN_ROLE` may manage any restaurant; the `administrators` field is informational only and does not restrict permissions.
- **FR-006**: The system MUST expose optional restaurant opening times (`openTime`, `closeTime`) and a calculated `isOpenNow` field that is informational only. If no opening hours are configured, `isOpenNow` MUST return null instead of computing a value.
- **FR-007**: The system MUST require only `name` and `address` for restaurant creation. `taxId` is optional and has no format validation in this phase. `legalName` and `fiscalAddress` are removed from the model — `name` and `address` are sufficient for this project's scope.
- **FR-008**: The system MUST require a unique restaurant name.
- **FR-009**: The system MUST reject write operations from dependent services when the referenced `restaurantId` belongs to an inactive restaurant, returning `409` with the message `El restaurante no está activo`.
- **FR-010**: The system MUST allow authenticated users with `ADMIN_ROLE` to reactivate a previously deactivated restaurant by setting `active` to `true`.
- **FR-011**: The system MUST allow logical deletion of a restaurant even when active menu, tables, orders, or billing resources exist. After logical deletion, all dependent resources remain stored but become read-only. Any write operation targeting an inactive restaurant MUST be rejected with HTTP 409.
- **FR-012**: The system MUST accept an optional single `openTime` and `closeTime` pair (HH:mm, 24-hour) instead of a per-day schedule. If absent, `isOpenNow` MUST return null instead of computing a value.


### Key Entities

- **Restaurant**: Represents an independent operating unit with identity, fiscal data, schedule, active state, and historical deletion metadata.
- **Dependent Resources**: Menu, tables, orders, and billing entities that reference a restaurant and must respect its active state before any create or update operation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of non-admin listing requests return only active restaurants by default.
- **SC-002**: Administrators can explicitly include inactive restaurants in listing requests by using `?includeInactive=true` without changing the default behavior for non-admin users.
- **SC-003**: Non-admin requests for inactive restaurant details receive `404` and do not reveal the restaurant's existence.
- **SC-004**: Dependent-service create or update operations referencing an inactive restaurant are rejected with `409` and the expected message before any persistence occurs.
- **SC-005**: Restaurant creation and update flows reject duplicate names
   and missing required fields (name, address).

## Assumptions

- Authentication and role validation for `ADMIN_ROLE` and `USER_ROLE` are already provided by the existing middleware in the project.
- The project already has a shared error-handling convention that can be reused for the new restaurant endpoints.
- Restaurants can be logically deleted even when active dependent resources exist. Dependent resources remain stored in read-only mode, and all write operations against an inactive restaurant are rejected with HTTP 409.
