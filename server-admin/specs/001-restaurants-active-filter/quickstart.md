# Quickstart: Validate inactive restaurant filtering

## Prerequisites

- A running MongoDB instance reachable from the project.
- The API server started with the project environment variables configured.

## Validation steps

1. Start the server:
   - `pnpm dev`
2. Create or update a restaurant with `active: false`.
3. Verify that `GET /restaurants` does not include it for a non-admin request.
4. Verify that `GET /restaurants?includeInactive=true` includes it for an admin request.
5. Verify that `GET /restaurants/:id` returns `404` for a non-admin request when the restaurant is inactive.
6. Verify that a dependent service write (for example, menu or table creation) returns `409` with `El restaurante no está activo` when it references an inactive restaurant.

## Expected outcomes

- Default reads exclude inactive restaurants.
- Admin opt-in includes inactive restaurants explicitly.
- Non-admin detail access does not reveal inactive restaurants.
- Dependent writes reject inactive restaurant references before persistence.
