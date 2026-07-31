# Tasks: Gestión de Restaurantes

**Input**: Design documents from `/specs/001-restaurants-active-filter/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create the initial restaurant domain structure in `src/restaurants/` with model, service, controller, and routes files.
- [x] T002 Wire the restaurant routes into the application bootstrap and ensure the base path is consistent with the project convention.
- [x] T003 [P] Align the shared error handling and response shape with the existing Express middleware conventions.

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Define the restaurant data model with fields for active state, logical deletion, optional fiscal reference (taxId) and optional schedule (openTime/closeTime)
- [x] T005 Implement reusable active-state filtering logic in `src/restaurants/restaurant.service.js` via a helper such as `buildActiveFilter(query)`.
- [x] T006 Implement reusable validation helpers for optional `openTime`/`closeTime` and restaurant schedule format.
- [x] T007 Add the service-level guard that rejects dependent-service writes when a referenced restaurant is inactive with `409` and `El restaurante no está activo`.

---

## Phase 3: User Story 1 - Crear y administrar restaurantes (Priority: P1)

**Goal**: Deliver CRUD and RBAC authorization for restaurant management.

**Independent Test**: An authenticated user with ADMIN_ROLE can create, update, reactivate, and logically delete restaurants.

### Implementation for User Story 1

- [x] T008 [US1] Implement restaurant creation in `src/restaurants/restaurant.service.js` and `src/restaurants/restaurant.controller.js`.

  Business rules:
  - Required fields: `name`, `address`.
  - Optional fields: `taxId`, `openTime`, `closeTime`.
  - `active` defaults to `true` and is never accepted from the request body.
  - `administrators` is NOT accepted from the request body; it is
    auto-populated by the service with the authenticated user's id
    (`req.user.id`) as the sole initial entry. It remains informational
    only and does not restrict future mutations (per FR-005).
- [x] T009 [US1] Implement restaurant update and reactivation flows.

  Business rules:
  - Allow mutations only for authenticated users with ADMIN_ROLE.
  - Reject unauthorized operations with HTTP 403.
  - Prevent modifications to logically deleted restaurants unless the
    operation is a reactivation.
  - `administrators` cannot be modified via this endpoint in this phase
    (no endpoint to add/remove administrators yet — out of scope, informational field only).
  - Do not require restaurant ownership or `administrators` membership
    for admin mutations.
- [x] T010 [US1] Implement logical deletion for restaurants with the required metadata (`active`, `deletedAt`, `deletedBy`).
- [x] T011 [US1] Implement route authorization using JWT and RBAC.

  Requirements:
  - Validate authenticated user.
  - Validate required permissions.
  - Validate ADMIN_ROLE before create, update, delete, or reactivate operations.
  - Require only `requireRole('ADMIN_ROLE')` for restaurant management; do not validate ownership.
  - Restrict administrative operations to authorized roles.
- [x] T012 [US1] Ensure duplicate names are rejected and optional `openTime`/`closeTime` are validated only when present.

---

## Phase 4: User Story 2 - Listado y detalle para usuarios y administradores (Priority: P1)

**Goal**: Deliver default active-only listings and admin opt-in access to inactive restaurants.

**Independent Test**: Users see only active restaurants by default; admins can include inactive ones explicitly.

### Implementation for User Story 2

- [x] T013 [US2] Implement listing behavior so active restaurants are returned by default and inactive ones are excluded unless `includeInactive=true` is provided.
- [x] T014 [US2] admins with ADMIN_ROLE can access inactive restaurants.
- [x] T015 [US2] Add route handling for the explicit `includeInactive` query parameter and the corresponding permission checks.

---

## Phase 5: User Story 3 - Protección del dominio frente a recursos inactivos (Priority: P2)

**Goal**: Prevent dependent services from writing against inactive restaurants.

**Independent Test**: Any create or update operation against an inactive restaurant is rejected before persistence.

### Implementation for User Story 3

- [x] T016 [US3] Add the service guard used by dependent domains to verify a referenced restaurant is active before mutation.
- [x] T017 [US3] Ensure the error response is `409` with the message `El restaurante no está activo`.
- [x] T018 [US2] Implement server-side calculation and exposure of `isOpenNow` in the restaurant detail endpoint using `openTime`/`closeTime` and the current server time. This task is tied to FR-006 and must also capture that if no schedule is configured, `isOpenNow` returns null; logical deletion is always allowed; dependent resources remain read-only; and any subsequent write against an inactive restaurant responds `409` with `El restaurante no está activo`.
- [x] T019 [US3] Implement logical deletion for restaurants.

Business rules:
- Logical deletion is always allowed (never blocked by active Menu, Tables, Orders, or Billing resources).
- The restaurant status changes to `active: false`.
- Existing dependent resources remain stored and accessible according to authorization rules.
- Dependent resources become read-only.
- Any create, update, or delete operation targeting an inactive restaurant MUST return HTTP 409 with the message `El restaurante no está activo`.
- Reactivation restores the restaurant to active status without losing historical information.

## Phase 6: Polish & Validation

- [x] T020 Validate the behavior end to end against the quickstart scenarios and adjust any mismatches.
- [x] T021 Review the feature artifacts for consistency between spec, plan, tasks, and the implementation scope.
- [x] T022 Validate authorization scenarios.
  Verify:
  - Non-admin users cannot access inactive restaurants.
  - Administrators can retrieve inactive restaurants using includeInactive=true.
  - Unauthorized users receive HTTP 403.
  - Unknown restaurants return HTTP 404.

- [x] T023 - Duplicate restaurant names return HTTP 409.
- Missing required fields (name, address) return HTTP 400.
- Invalid schedule format (when openTime/closeTime are present) returns HTTP 400.

## Phase 7: Convergence

- [x] T024 Add unique: true to the name field in restaurantSchema per FR-008 (missing)
