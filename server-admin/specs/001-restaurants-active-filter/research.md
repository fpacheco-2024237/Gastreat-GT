# Research: Restaurant active-state enforcement

## Decision 1: Centralize the default active filter in the restaurant service

**Decision**: Introduce a reusable helper in the restaurants service layer, for example `buildActiveFilter(query)`, that returns a Mongo query excluding inactive restaurants by default unless the caller explicitly opts in.

**Rationale**: This keeps the default behavior in one place and avoids duplicated `active: true` checks across controllers and methods. It also makes the rule easier to test and extend later.

**Alternatives considered**:
- Inline filtering in each controller method: rejected because it duplicates logic and increases the risk of inconsistent behavior.
- Model-level default query behavior: rejected because it couples the rule to the persistence layer and would not allow the explicit admin override in the same place.

## Decision 2: Restrict inactive restaurant visibility by role and context

**Decision**: For list operations, non-admin requests should exclude inactive restaurants by default. For admin requests, `includeInactive=true` should explicitly opt in. For detail access, regular users should receive `404` for inactive restaurants, while admins may see the detail when allowed by the admin context.

**Rationale**: This satisfies the requirement of not leaking the existence of inactive restaurants while still allowing legitimate administrative review.

**Alternatives considered**:
- Returning `403` for inactive detail access: rejected because it reveals that the resource exists but is inactive.
- Showing inactive resources to all roles: rejected because it violates the privacy and default exclusion requirement.

## Decision 3: Enforce active-restaurant validation in service before persistence

**Decision**: Before creating or modifying data in dependent domains, the service layer will validate the referenced `restaurantId` and reject the operation with `409` and `El restaurante no está activo` when the restaurant is inactive.

**Rationale**: This ensures the rule is enforced before touching the database and keeps the validation close to the business logic and the entity relationship.

**Alternatives considered**:
- Enforcing the rule in the Mongoose schema only: rejected because it would fail at the persistence layer and would not provide the required service-level error semantics.
- Checking the restaurant state in controllers only: rejected because it would not be reusable and would create inconsistent behavior across services.
