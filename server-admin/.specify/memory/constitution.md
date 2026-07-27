<!--
Sync Impact Report:
- Version change: 1.0.0 -> 1.1.0
- List of modified principles:
  - II. Multi-tenant por restaurante -> expanded with menu/inventory scoping rules
  - Added VIII. Menú e inventario consistente y acotado al restaurante
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
  - ✅ updated: README.md
- Follow-up TODOs: None
-->

# server-admin Constitution

## Core Principles

### I. Frontera de responsabilidad con auth-service
Este servicio NUNCA implementa registro, login, gestión de contraseñas ni CRUD de usuarios/roles. Esa lógica vive por completo en un servicio externo llamado auth-service. Este servicio solo consume JWTs ya emitidos por auth-service y valida el rol embebido en el token (ADMIN_ROLE o USER_ROLE) reutilizando los middlewares existentes validateJWT (middlewares/validate-JWT.js) y requireRole (middlewares/validate-role.js). No crear middlewares de auth propios ni duplicar esa lógica.

### II. Multi-tenant por restaurante
La plataforma soporta múltiples restaurantes. Restaurant es la entidad raíz. Todo lo demás (Category, Ingredient, MenuItem, Table, Reservation, Order, Billing) debe llevar un campo restaurantId (ObjectId, ref "Restaurant", required, indexado) y toda query de lectura/escritura debe ir filtrada por ese restaurantId. Nunca devolver ni mezclar datos entre restaurantes distintos. ADMIN_ROLE es el rol supremo: cualquier usuario con ADMIN_ROLE puede administrar cualquier restaurante, sin restricción de ownership/pertenencia.

### III. Arquitectura modular por dominio
Cada dominio vive en src/<dominio>/ con exactamente 4 archivos: <dominio>.model.js, <dominio>.service.js (lógica de negocio pura, sin req/res), <dominio>.controller.js (solo orquesta req → service → res) y <dominio>.routes.js (define endpoints, valida con express-validator + checkValidators, protege con validateJWT + requireRole). Ningún controller contiene lógica de negocio ni toca Mongoose directamente.

### IV. Contrato de API consistente
BASE_PATH único "/gastreatGT/Admin/v1" (respetar mayúsculas exactas). Toda respuesta JSON sigue el sobre { success, message, data?, errors?/error? }. Los códigos de estado siguen la tabla del README: 400 validación, 401 token ausente/inválido/expirado, 403 rol sin permiso, 404 no encontrado, 409 conflicto, 429 rate limit, 500 error interno.

### V. Baja lógica, nunca borrado físico
Cualquier "eliminación" en este proyecto se implementa como active=false + deletedAt + deletedBy. Los recursos dependientes de una entidad dada de baja quedan en modo solo-lectura, y cualquier escritura contra una entidad inactiva responde 409.

### VI. Seguridad
Helmet, cors, rate limiting (100 req/15min) y express-validator deben seguir activos en cualquier ruta nueva. Nunca exponer stack traces en producción. Cualquier subida de imagen pasa por Cloudinary vía Multer con límite de 10MB y limpieza automática del archivo si la request falla.

### VII. Simplicidad sobre completitud
Este es un proyecto estudiantil, no un sistema de facturación fiscal real. Los campos y validaciones deben limitarse a lo que otro módulo del sistema realmente consume — no agregar validación de formato, campos obligatorios adicionales, ni reglas de negocio "por si acaso" sin que haya un consumidor real de ese dato dentro del proyecto (YAGNI).

### VIII. Menú e inventario consistente y acotado al restaurante
Las funcionalidades que administran menú, categorías, ingredientes, stock y disponibilidad MUST mantener consistencia entre la disponibilidad del producto y el stock de los ingredientes asociados. No se permite que un producto permanezca "Disponible" si su receta depende de ingredientes sin stock suficiente o si el restaurante referenciado está inactivo. Los cambios de stock, precio, estado y categorías deben ser explícitos, no negativos y siempre aplicarse dentro del mismo restaurantId; no se implementa lógica de inventario global ni compartida entre restaurantes.

## Governance
Esta constitución aplica a todo /speckit.plan y /speckit.tasks futuro en este repo. Cualquier desviación debe quedar justificada explícitamente en el plan correspondiente. Antes de implementar una feature, el plan, el spec y las tareas deben demostrar cómo respetan la frontera de auth-service, el scoping por restaurantId, el contrato de respuesta, la seguridad y la consistencia del menú e inventario.

Amendment procedure: cualquier cambio en esta constitución debe actualizar también los artefactos dependientes (plantillas, README y documentación de feature) y debe incrementar la versión según la política de versionado. Versioning policy: MAJOR para cambios incompatibles con la gobernanza o principios existentes, MINOR para nuevos principios o expansiones materiales de guía, PATCH para aclaraciones o correcciones no semánticas. Compliance review expectations: toda feature nueva debe validar explícitamente que no duplica lógica de auth, que respeta el guard de restaurante activo, que mantiene la respuesta JSON consistente y que no introduce reglas de inventario contradictorias con el resto del sistema. Todo nuevo desarrollo debe usar pnpm; npm no está permitido.

**Version**: 1.1.0 | **Ratified**: 2026-07-18 | **Last Amended**: 2026-07-19
