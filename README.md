# Gastreat GT

> Monorepo de la plataforma Gastreat GT: Auth Service en .NET, backend administrativo en Node.js y frontend admin en React + Vite.

## Estructura del repositorio

- `authentication-service/` — Servicio de autenticación en .NET con Clean Architecture y PostgreSQL.
- `server-admin/` — Backend administrativo en Node.js + Express + MongoDB.
- `client-admin/` — Frontend administrativo en React + Vite.
- `gastreat_db/` — Configuración de Docker Compose para PostgreSQL.
- `.github/` — Workflows de CI y reglas de GitHub.
- `CONTRIBUTING.md` — Convenciones de contribución y flujo de ramas.
- `CHANGELOG.md` — Historial de versiones.
- `LICENSE` — Licencia MIT.
- `Gastreat GT.postman_collection.json` — Colección Postman de referencia.

## Flujo de desarrollo recomendado

- `main`: código listo para producción.
- `develop`: integración continua de funciones.
- `feature/*`: nuevas funcionalidades.
- `fix/*`: correcciones de bugs durante el desarrollo.
- `release/*`: prepara versiones.
- `hotfix/*`: parches críticos en producción.
- `docs/*`: cambios en documentación.
- `refactor/*`: reestructuraciones sin cambios en comportamiento.
- `chore/*`: mantenimiento e infraestructura.

## Quick start por módulo

### Auth Service (.NET)

```powershell
cd "c:\Proyectos 2026\Gastreat GT\authentication-service\auth-service"
dotnet restore auth-service.sln
dotnet build auth-service.sln
dotnet run --project src/AuthService.Api/AuthService.Api.csproj
```

### Server Admin (Node.js)

```powershell
cd "c:\Proyectos 2026\Gastreat GT\server-admin"
pnpm install
copy .env.example .env
pnpm run dev
```

### Client Admin (React + Vite)

```powershell
cd "c:\Proyectos 2026\Gastreat GT\client-admin"
pnpm install
copy .env.example .env
pnpm run dev
```

### Docker y base de datos

```powershell
docker compose -f "c:\Proyectos 2026\Gastreat GT\gastreat_db\docker-compose.yml" up -d
```

## Estructura final esperada en GitHub

- `README.md` principal
- `authentication-service/README.md`
- `server-admin/README.md`
- `client-admin/README.md`
- `gastreat_db/README.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- `LICENSE`
- `.github/workflows/ci.yml`
- `docker-compose.yml`
- `Gastreat GT.postman_collection.json`

## Convenciones de commits

Ejemplos apropiados para este proyecto:

- `feat(auth): implement JWT authentication`
- `feat(client): create login page`
- `feat(server): create restaurant CRUD`
- `fix(auth): correct token expiration validation`
- `docs(readme): add installation guide`
- `refactor(server): simplify middleware validation`
- `chore(docker): update compose configuration`

## Recommended branches

1. Crear `develop` desde `main`.
2. Desarrollar funcionalidades en `feature/*`.
3. Fusionar a `develop` mediante PR.
4. Crear `release/*` para estabilizar la versión.
5. Fusionar release a `main` y `develop`.
6. Usar `hotfix/*` para correcciones críticas en `main`.

## Notas importantes

- No subir archivos `.env` ni credenciales reales.
- Documenta siempre variables de entorno en `.env.example`.
- Protege `main` y `develop` con revisiones y CI.
