# Tasks: Gestión de Menú e Inventario

**Input**: Design documents from `/specs/002-menu-inventario/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, api.md

**Tests**: Not included because the feature specification did not require a dedicated automated test suite for this MVP.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Constitutional Alignment

- Every task explicitly covers restaurant scoping by restaurantId, reuse of the existing restaurant activation guard, and the relevant menu/inventory validation rule.
- Shared infrastructure tasks reuse the existing middleware, validation, error handling, and response-envelope patterns instead of introducing parallel implementations.
- `restaurantId` is always sourced from the route parameter (`req.params.restaurantId`), never from query, header, or body — see `api.md`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the existing menu module for the new restaurant-scoped inventory flows.

- [ ] T001 Extend the existing menu module structure in src/menu/menu.model.js, src/menu/menu.service.js, src/menu/menu.controller.js, and src/menu/menu.routes.js for the new feature work.
- [ ] T002 [P] Add a dedicated menu image upload path in middlewares/file-uploader.js so menu uploads use a menu-specific Cloudinary folder and do not reuse other domains' folders; reuse delete-file-on-error.js so a failed upload never leaves an orphaned temp file (Edge Case: image upload failure).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the shared data and service layer that all menu and inventory flows depend on.

- [ ] T003 Create the shared product, category, and ingredient schema layer in src/menu/menu.model.js, src/menu/category.model.js, and src/menu/ingredient.model.js with restaurantId scoping and non-negative value constraints.
- [ ] T004 Implement shared service-layer validation in src/menu/menu.service.js so create and update operations reject inactive restaurants, reject negative prices and stock values with HTTP 400 and the shared `{ success: false, errors: [...] }` envelope, and scope every read/write by the `restaurantId` received from the route parameter (never from body or query).
- [ ] T005 [P] Reuse the existing restaurant activation guard (`ensureRestaurantIsActive`) from src/restaurants/restaurant.service.js before any product, category, or ingredient write operation in src/menu/menu.service.js, rejecting with HTTP 409 and "El restaurante no está activo".
- [ ] T006 Wire the new route structure in src/menu/menu.routes.js per the contract in `api.md`: every route is mounted under `/restaurants/:restaurantId/...` (menu-items, categories, ingredients), with `restaurantId` read exclusively from `req.params.restaurantId`. Apply admin-only middleware ordering (validateJWT + requireRole('ADMIN_ROLE')) consistently for all write routes.

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Admin manages the restaurant menu catalog (Priority: P1) 🎯 MVP

**Goal**: Allow admins to manage restaurant-scoped products with price, availability, and image support.

**Independent Test**: An admin can create a product, update its price or availability, and view the change in the restaurant menu without affecting another restaurant.

### Implementation for User Story 1

- [ ] T007 [US1] Implement restaurant-scoped product create, read, update, and status-change flows in src/menu/menu.service.js and src/menu/menu.controller.js, using the `restaurantId` route parameter per `api.md`.
- [ ] T008 [US1] Add product endpoints for list, detail, create, update, and status change in src/menu/menu.routes.js (`/restaurants/:restaurantId/menu-items[...]` per `api.md`) with validation for price, category, and status.
- [ ] T009 [US1] Ensure product image upload and replacement use the menu-specific uploader configuration from middlewares/file-uploader.js and keep image metadata stored on the product record in src/menu/menu.service.js; on upload failure, reject the whole operation without persisting a partial product record.

**Checkpoint**: User Story 1 should be fully functional and independently testable.

---

## Phase 4: User Story 2 - Admin manages categories and ingredient inventory (Priority: P1)

**Goal**: Allow admins to manage restaurant-scoped categories and ingredients with stock controls and protected category deletion.

**Independent Test**: An admin can create categories and ingredients, adjust stock manually, and keep the menu consistent with the restaurant's inventory state.

### Implementation for User Story 2

- [ ] T010 [US2] Implement category creation, update, list, and delete behavior in src/menu/category.model.js and src/menu/menu.service.js with protection against deleting categories that still have active products, rejecting with HTTP 409.
- [ ] T011 [US2] Implement ingredient creation, update, list, and manual stock-adjustment flows in src/menu/ingredient.model.js and src/menu/menu.service.js with non-negative stock validation (HTTP 400 on violation).
- [ ] T012 [US2] Add category and ingredient endpoints in src/menu/menu.routes.js and src/menu/menu.controller.js (`/restaurants/:restaurantId/categories[...]`, `/restaurants/:restaurantId/ingredients[...]` per `api.md`) so each operation is scoped by the `restaurantId` route parameter and uses the shared auth and validator middleware.
- [ ] T013 [US2] Preserve ingredient-to-product relationship data (`recipeItems`) for inventory evaluation in src/menu/menu.model.js and src/menu/menu.service.js so products can later be evaluated against ingredient stock without cross-restaurant leakage.
- [ ] T014 [US2] Implement automatic availability recalculation per FR-006 in src/menu/menu.service.js: every time the stock-adjustment flow from T011 changes an Ingredient's stock, recalculate `status` for every MenuItem whose `recipeItems` reference that ingredient — set to `Agotado` if any required ingredient has `stock: 0`, revert to `Disponible` once all required ingredients have `stock > 0`. This recalculation is fully automatic; there is no manual override in this MVP.

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - User browses the available menu (Priority: P2)

**Goal**: Expose a restaurant-scoped menu view that only returns available products for the selected restaurant.

**Independent Test**: A user can select a restaurant and see only the available products from that restaurant, filtered by category.

### Implementation for User Story 3

- [ ] T015 [US3] Ensure the menu list and detail responses only return products that belong to the requested restaurant (route parameter) and are marked available in src/menu/menu.service.js and src/menu/menu.controller.js.
- [ ] T016 [US3] Add category filtering and restaurant-scoped menu visibility handling in src/menu/menu.routes.js and src/menu/menu.model.js so public menu queries do not expose cross-restaurant data.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks for the new module across the repository.

- [ ] T017 [P] Review controller response payloads and status codes in src/menu/menu.controller.js so they stay aligned with the shared success envelope and repository conventions.
- [ ] T018 [P] Validate the feature against the quickstart scenarios in specs/002-menu-inventario/quickstart.md, covering inactive restaurants, negative prices or stock, category-protection rules, automatic availability recalculation (FR-006), and image-upload isolation.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Stories (Phases 3-5)**: All depend on Foundational completion.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (US1)**: Can start after Foundational and is the MVP increment.
- **User Story 2 (US2)**: Can start after Foundational and can be implemented in parallel with US1.
- **User Story 3 (US3)**: Can start after Foundational and can be implemented after the core menu and inventory flows are in place.

### Parallel Opportunities

- T002 can run in parallel with T001 because it touches the uploader middleware rather than the menu service/controller flow.
- T005 can run in parallel with T003 and T004 because it focuses on the shared restaurant guard integration.
- T010 and T011 can be developed in parallel once the foundational layer is ready.
- T017 and T018 can be executed together once the implementation is complete.

### Implementation Strategy

#### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate the restaurant-scoped product flow before extending inventory features.

#### Incremental Delivery

1. Complete Setup + Foundational.
2. Deliver User Story 1 for the MVP menu catalog.
3. Deliver User Story 2 for categories and inventory control.
4. Deliver User Story 3 for the user-facing menu view.