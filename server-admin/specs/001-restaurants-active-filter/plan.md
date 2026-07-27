# Implementation Plan: Refuerzo del filtrado de restaurantes inactivos

**Branch**: `001-restaurants-active-filter` | **Date**: 2026-07-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from [spec.md](spec.md)

## Summary

Implementar el módulo Restaurant Service como el agregado raíz del dominio de Gastreat GT.

El servicio permitirá la creación, consulta, actualización, activación, desactivación y administración de restaurantes.

Restaurant será el punto de entrada del dominio y requisito obligatorio para utilizar los servicios Menu, Tables, Orders y Billing.

El servicio centralizará:

- Administración de restaurantes.
- Validación de estado activo.
- Validación de datos requeridos (nombre, dirección) y nombre único.
- Validación de horario (opcional) cuando openTime/closeTime están presentes.
- Soft Delete.
- Multi-tenancy mediante restaurantId.

**Constraints**

- Restaurant es el agregado raíz del dominio.
- Todo recurso de negocio pertenece a un Restaurant.
- Ningún servicio dependiente podrá escribir sobre restaurantes inactivos.
- Todos los servicios deberán validar restaurantId antes de ejecutar operaciones de escritura.
- Todas las operaciones seguirán la arquitectura existente.

## Constitution Check

Architecture
- Respeta la arquitectura existente.
- No modifica la estructura del proyecto.
- Mantiene separación Controller-Service-Repository.

Security
- JWT.
- RBAC with `ADMIN_ROLE` for restaurant mutations only.
- No ownership/pertenencia validation is required for admin restaurant management.

Business Rules
- Soft Delete.
- Multi-Tenant.
- Restaurant como agregado raíz.
- Validación de estado activo.
- `administrators` es informativo y no restringe permisos.

Result
PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-restaurants-active-filter/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)

```text
src/
├── restaurants/
│   ├── restaurant.model.js
│   ├── restaurant.service.js
│   ├── restaurant.controller.js
│   └── restaurant.routes.js
├── menus/
├── tables/
├── orders/
└── billing/
```

**Structure Decision**

Restaurant Service actuará como el agregado raíz del dominio.

Será responsable de:

- CRUD de restaurantes.
- Validaciones fiscales.
- Validaciones de horarios.
- Estado activo.
- Reactivación.
- Soft Delete.

Los servicios Menu, Tables, Orders y Billing deberán consultar Restaurant Service antes de realizar operaciones de escritura.

La validación de restaurante activo se realizará en la capa Service.

Los Controllers permanecerán libres de lógica de negocio.

## Complexity Tracking

No special complexity exemptions are required for this change.

## Business Flow

1. Usuario inicia sesión.

2. Authentication Service valida identidad.

3. Se verifica la identidad del usuario y los roles necesarios para la operación.

4. Si no existe restaurante:

   - Solo se habilita Restaurant Service.

5. Una vez creado el restaurante:

   - Menu Service queda habilitado.
   - Tables Service queda habilitado.
   - Orders Service queda habilitado.
   - Billing Service queda habilitado.

6. Todas las operaciones posteriores deberán validar restaurantId y estado activo.

## Validation Strategy

Restaurant Service será responsable de validar:

- Nombre obligatorio.
- Nombre único.
- Dirección obligatoria.
- `taxId` opcional sin validación de formato en esta fase.
- `openTime` y `closeTime` opcionales; validar formato HH:mm solo cuando estén presentes.
- Estado activo.
- RBAC authorization for mutation operations (ADMIN_ROLE only).

Las validaciones se ejecutarán antes de cualquier operación de persistencia.

## Dependency Rules

Restaurant Service no depende de otros servicios administrativos.

Menu Service depende de Restaurant Service.

Tables Service depende de Restaurant Service.

Orders Service depende de:

- Restaurant Service
- Tables Service
- Menu Service

Billing Service depende de:

- Restaurant Service
- Orders Service