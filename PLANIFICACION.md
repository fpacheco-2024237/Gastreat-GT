# Planificación del Proyecto
## GastreatGT — Sistema Integral de Gestión de Restaurantes

**Nombre:** Fred Alexandre Pacheco García
**Docente:** Braulio Echeverria
**Fecha:** 01/06/2026

---

## Introducción

El presente documento detalla la planificación para el desarrollo del Sistema Integral de Gestión de Restaurantes (GastreatGT). El propósito del proyecto es optimizar las operaciones de uno o varios restaurantes mediante una plataforma centralizada, en la que el restaurante es el punto de entrada del sistema: el usuario debe crear (como Administrador) o seleccionar un restaurante existente para poder acceder al resto de los servicios (menú, mesas, pedidos y facturación). Los objetivos principales del sistema incluyen la gestión segura de usuarios mediante dos roles claramente definidos (Administrador y Usuario/Cliente), el control del menú e inventario, la administración de pedidos en tiempo real, el manejo de reservas de mesas y un sistema de facturación eficiente. Esta planificación establece la metodología, las tecnologías y el cronograma a seguir durante los próximos 2 meses (8 semanas), considerando que el proyecto se desarrolla de forma individual.

## Metodología SCRUM

SCRUM es un marco de trabajo ágil que permite abordar problemas complejos mediante entregas iterativas e incrementales (Sprints). Dado que este proyecto se desarrolla de forma individual, se utilizará una adaptación conocida como "Solo Scrum", en la que el desarrollador asume las responsabilidades de Product Owner, Scrum Master y equipo de desarrollo, manteniendo la organización, la priorización del backlog y el control de calidad para asegurar la mejora continua en cada fase.

### Duración de los sprints

Los sprints tendrán una duración de entre 1 y 2 semanas, según la carga de trabajo de cada fase.

## Tabla de planificación

| Fase | Sprint | Duración | Foco principal |
|---|---|---|---|
| Backend | Sprint 1 | Semana 1 – 3 | Autenticación, roles y servicio de Restaurantes |
| Backend | Sprint 2 | Semana 4 – 5 | Menú/Inventario, Mesas/Reservas, Comandas y Facturación |
| Frontend | Sprint 3 | Semana 6 – 7 | UI/UX (Figma) y lógica de conexión con el backend |
| Integración | Sprint 4 | Semana 8 | Integración, pruebas y despliegue |

> El cronograma se ajustó para sumar 8 semanas de forma consistente (2 meses) y para reflejar que el servicio de Restaurantes, al ser el punto de entrada del sistema, se desarrolla junto con Autenticación en el primer sprint.

## Herramientas de gestión

- **Trello / Notion** — gestión de tareas, backlog y seguimiento de los sprints.
- **GitHub** — control de versiones y repositorio del código.
- **Figma** — diseño de interfaces y prototipado de UI/UX.

## Medición de progreso

El progreso de cada sprint se medirá asignando puntos de historia (story points) a las tareas registradas en Trello / Notion, lo que permite llevar un control más preciso del avance real frente a lo planificado. Ejemplo:

| Tarea | Pts | Observación |
|---|---|---|
| Crear login | 8 | Cambiar colores |

## Autenticación y manejo de roles

El control administrativo del sistema se restringe a un único rol con permisos completos; el resto de las personas usuarias únicamente pueden consumir el servicio como clientes. Esta simplificación (dos roles en lugar de los cuatro planteados originalmente) reduce el alcance a un nivel manejable para un desarrollo individual, sin perder las funciones esenciales del negocio.

| Rol | Permisos |
|---|---|
| **Administrador** | Crear, editar, eliminar y listar restaurantes.<br>Gestionar el menú e inventario de cada restaurante (platillos, bebidas, categorías, precios, stock).<br>Gestionar las mesas del restaurante y confirmar o cancelar reservas.<br>Visualizar y actualizar el estado de los pedidos (comandas).<br>Gestionar la facturación y consultar reportes de ventas.<br>Administrar las cuentas de usuario (consultar, bloquear, eliminar). |
| **Usuario (Cliente)** | Registrarse e iniciar sesión.<br>Consultar el listado de restaurantes disponibles y entrar a uno de ellos.<br>Visualizar el menú del restaurante seleccionado.<br>Reservar una mesa dentro del restaurante seleccionado.<br>Realizar pedidos dentro del restaurante seleccionado.<br>Consultar su historial de pedidos y facturas propias.<br>Editar su perfil. |

### Seguridad técnica

- Autenticación basada en JSON Web Tokens (JWT), con expiración configurable.
- Contraseñas almacenadas mediante hash con bcrypt, nunca en texto plano.
- Middleware de autorización por rol (RBAC) en cada endpoint protegido, que verifica que únicamente el Administrador acceda a las rutas de gestión.
- Recuperación de contraseña mediante token temporal enviado por correo, incluida si el tiempo del sprint lo permite.

## Flujo general de uso

1. El usuario se registra o inicia sesión. Por defecto obtiene el rol Usuario; el rol Administrador se asigna manualmente o mediante un registro inicial (seed).
2. Si el rol es Administrador, puede crear un restaurante nuevo o gestionar los restaurantes ya existentes.
3. Si el rol es Usuario, visualiza el listado de restaurantes disponibles y selecciona uno para entrar en él.
4. Al entrar en un restaurante, el usuario accede a su menú, puede reservar una mesa y generar pedidos dentro de ese restaurante.
5. El pedido avanza por los estados definidos en el servicio de Comandas hasta llegar al servicio de Facturación, donde se calcula el total y se genera el recibo final.

## Servicios propuestos

El proyecto contará con 6 servicios para mantener el código escalable y organizado. El Servicio de Restaurantes actúa como punto de entrada: es necesario crear o seleccionar un restaurante antes de poder utilizar el resto de los servicios.

1. **Servicio de Autenticación y Usuarios:** Registro, login, recuperación de contraseña y control de roles (Administrador y Usuario), con seguridad basada en JWT.
2. **Servicio de Restaurantes:** Creación, edición, eliminación y listado de restaurantes (nombre, descripción, logo, dirección, horario). Es el punto de entrada del sistema: el usuario debe seleccionar un restaurante antes de acceder al menú, las mesas, los pedidos o la facturación.
3. **Servicio de Menú e Inventario:** CRUD (crear, leer, actualizar, borrar) de platillos, bebidas, categorías y precios, además del control de stock de ingredientes básicos, todo asociado al restaurante activo.
4. **Servicio de Mesas y Reservas:** Control del estado de las mesas del restaurante activo (libres, ocupadas, reservadas) y gestión de reservas realizadas por los usuarios.
5. **Servicio de Comandas (Pedidos):** El usuario arma su pedido dentro del restaurante seleccionado; el Administrador visualiza y actualiza el estado del pedido ("recibido", "en preparación", "listo" o "entregado").
6. **Servicio de Facturación y Pagos (Caja):** Cierre del pedido, cálculo de totales, impuestos y propinas, y generación del recibo o factura final.

## Estructura de carpetas del proyecto

El código se organiza en un repositorio dividido por servicios, separando lo que corresponde al Administrador, al Usuario/Cliente y a la base de datos. Esto facilita trabajar un servicio a la vez y desplegarlos de forma independiente:

- **`/authentication-service/auth-service`** — Servicio de Autenticación y Usuarios (registro, login, recuperación de contraseña, roles y JWT).
- **`/server-admin`** — Servicios que consume el rol Administrador (restaurantes, menú/inventario, mesas, comandas y facturación desde la vista de gestión).
- **`/server-user`** — Servicios que consume el rol Usuario/Cliente (listado de restaurantes, menú, reservas, pedidos e historial).
- **`/client-admin`** — Frontend web en React, utilizado por el Administrador para la gestión y también accesible por el Usuario desde el navegador.
- **`/client-user`** — Aplicación móvil para el Usuario/Cliente (explorar restaurantes, reservar y pedir desde el celular).
- **`/gastreat_db`** — Contenedor Docker de la base de datos PostgreSQL, compartida por los servicios de backend.
- **`/dockerfiles`** — Dockerfiles de cada servicio (auth-service, server-admin, server-user y gastreat_db), usados para construir las imágenes de cada contenedor.

## Tecnologías de desarrollo

Al tratarse de un proyecto individual, se simplificó el stack tecnológico original (que planteaba dos backends y dos bases de datos) para reducir la complejidad operativa y hacerlo viable dentro de las 8 semanas disponibles. Los tres servicios de backend (auth-service, server-admin y server-user) comparten el mismo framework y la misma base de datos; lo que cambia entre ellos es únicamente el conjunto de rutas y permisos que exponen.

- **Backend:** Node.js con Express.js — un único framework, ligero y con amplio soporte para JWT y APIs REST, reutilizado en auth-service, server-admin y server-user.
- **Frontend web (client-admin):** React.js, con React Router para la navegación y Axios para el consumo de la API.
- **App móvil (client-user):** React Native con Expo — reutiliza el conocimiento de React y simplifica la compilación y distribución de la app sin depender de un entorno nativo instalado localmente.
- **Base de datos:** PostgreSQL (contenedor gastreat_db) — se prioriza sobre MongoDB por tratarse de datos relacionales (usuarios, roles, restaurantes, pedidos, facturas) donde la integridad transaccional (ACID) es importante, especialmente en el servicio de Facturación.
- **Autenticación:** JWT (librería jsonwebtoken) y bcrypt para el hash de contraseñas.
- **Manejo de imágenes:** Multer o Cloudinary, para el logo de cada restaurante y las imágenes del menú.
- **Documentación y pruebas de API:** Postman.
- **Administración de base de datos:** pgAdmin4.
- **Contenedores:** Docker Desktop, usando los Dockerfiles de `/dockerfiles` para construir cada servicio de forma reproducible.
- **Control de versiones:** GitHub.
- **Diseño de interfaces:** Figma.
- **Gestión de tareas:** Trello / Notion.

> Nota: si se prefiere conservar .NET o MongoDB en el proyecto, se recomienda limitarlos a un único servicio aislado y no como stack paralelo completo, para no duplicar el esfuerzo de un desarrollador individual dentro del tiempo disponible.

## Despliegue

El proyecto debe poder salir del entorno local sin rediseñar nada, por lo que la configuración se maneja desde el inicio pensando en despliegue:

- **Orquestación local:** un archivo `docker-compose.yml` en la raíz enlaza auth-service, server-admin, server-user y gastreat_db usando las imágenes definidas en `/dockerfiles`, permitiendo levantar todo el backend con un solo comando.
- **Configuración por variables de entorno:** cada servicio lee su cadena de conexión, puerto y secreto de JWT desde un archivo `.env`, de modo que el mismo contenedor funcione igual en local y en producción, cambiando solo esos valores.
- **Backend (auth-service, server-admin, server-user):** Railway o Render, con despliegue directo desde el Dockerfile de cada carpeta o desde GitHub.
- **Base de datos:** PostgreSQL administrado (Railway, Supabase o Neon), o el propio contenedor gastreat_db en el mismo servidor si se prefiere no depender de un tercero.
- **Frontend web (client-admin):** Vercel o Netlify, con despliegue automático al hacer push a GitHub.
- **App móvil (client-user):** Expo Application Services (EAS Build) para generar el instalable (APK/IPA) sin necesidad de Xcode o Android Studio instalados localmente.

> Nota: mantener los Dockerfiles y el docker-compose.yml versionados en GitHub permite que cualquier proveedor de hosting (o el propio docente, al revisar el proyecto) pueda levantar el sistema completo con un solo comando, sin depender de la máquina donde se desarrolló.
