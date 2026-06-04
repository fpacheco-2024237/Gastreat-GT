# Gastreat GT - Authentication Service

Microservicio de autenticación construido con .NET y arquitectura limpia.

## Descripción

Este servicio gestiona usuarios, roles, tokens JWT y la conexión con PostgreSQL.
Está diseñado para operar como el proveedor de autenticación central del ecosistema Gastreat GT.

## Requisitos

- .NET SDK compatible con `global.json` (recomendado .NET 8)
- PostgreSQL

## Instalación y ejecución

```powershell
cd "c:\Proyectos 2026\Gastreat GT\authentication-service\auth-service"
dotnet restore auth-service.sln
dotnet build auth-service.sln
dotnet run --project src/AuthService.Api/AuthService.Api.csproj
```

## Estructura

- `auth-service.sln` — Solución .NET.
- `global.json` — Versión de SDK fija.
- `src/AuthService.Api` — API REST.
- `src/AuthService.Application` — Lógica de aplicación.
- `src/AuthService.Domain` — Entidades y dominio.
- `src/AuthService.Persistence` — Integración con EF y PostgreSQL.

## Variables de entorno y configuración

El servicio utiliza `appsettings.json` y `appsettings.Development.json`.
No subas credenciales ni datos sensibles.

## Integración con PostgreSQL

Usa `gastreat_db/docker-compose.yml` para levantar una instancia local de PostgreSQL.

## Nota

Este módulo debe integrarse primero en el pipeline de desarrollo, ya que habilita la autenticación y el login para el resto del ecosistema.
