# Data Model: Restaurant active-state enforcement

## Entity: Restaurant

**Purpose**: Represents the root restaurant entity in the domain and controls whether it is available for normal operations.

### Fields

- `id`: unique identifier
- `name`: string, required, unique
- `address`: string, required
- `taxId`: string, optional
- `openTime`: string, optional, HH:mm
- `closeTime`: string, optional, HH:mm
- `active`: boolean, default `true`
- `administrators`: array of user IDs, informational; the creator may be included automatically
- `deletedAt`: timestamp, optional
- `deletedBy`: user ID, optional
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Validation rules

- `name` and `address` are required for creation.
- `taxId` is optional and has no strict format validation in this phase.
- `openTime` and `closeTime` are optional and, when present, must use HH:mm 24-hour format.
- `active` must be a boolean.
- The default state should be active unless explicitly set otherwise.

### State transitions

- `active = true` → available for normal list/detail flows and dependent operations.
- `active = false` → excluded from default listings, hidden from non-admin detail access, and rejected by dependent service writes.

## Relationships

- Dependent resources such as menu, tables, orders, and billing refer to a `restaurantId`.
- Those resources must validate the referenced restaurant state before mutation.

## Service-level invariants

- Default read operations should use the reusable active filter.
- Write operations on dependent resources should fail fast if the referenced restaurant is inactive.
