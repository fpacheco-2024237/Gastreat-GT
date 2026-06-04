# Gastreat GT - PostgreSQL Database

Este directorio contiene la configuración de infraestructura para la base de datos PostgreSQL utilizada por el Auth Service.

## Descripción

`gastreat_db/docker-compose.yml` define un servicio de PostgreSQL para desarrollo local.

## Uso

```powershell
docker compose -f "c:\Proyectos 2026\Gastreat GT\gastreat_db\docker-compose.yml" up -d
```

## Notas

- No incluya datos reales ni dumps de bases de datos en el repositorio.
- Use este servicio solo para pruebas locales y desarrollo.
- Asegúrese de no subir archivos `.env` con credenciales reales.
