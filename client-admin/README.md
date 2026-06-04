# Gastreat GT - Client Admin

Frontend administrativo para Gastreat GT construido con React y Vite.

## Descripción

Este módulo incluye la interfaz de administración para el restaurante. Consume la API de `server-admin` y usa autenticación proporcionada por `authentication-service`.

## Requisitos

- Node.js 18+
- pnpm 10+

## Instalación

```powershell
cd "c:\Proyectos 2026\Gastreat GT\client-admin"
pnpm install
copy .env.example .env
pnpm run dev
```

## Comandos disponibles

- `pnpm run dev` — Ejecuta la app en modo desarrollo.
- `pnpm run build` — Genera la app lista para producción.
- `pnpm run preview` — Previsualiza el build.
- `pnpm run lint` — Analiza el código con ESLint.
- `pnpm run format` — Formatea con Prettier.

## Variables de entorno

Copia `.env.example` a `.env` y configura los endpoints necesarios.

## Estructura

- `src/` — Código fuente de React.
- `public/` — Activos públicos.
- `vite.config.js` — Configuración de Vite.
- `package.json` / `pnpm-lock.yaml` — Gestión de dependencias.

## Notas

El frontend está diseñado para trabajar con el backend administrativo en `http://localhost:3022` y el servicio de autenticación en `http://localhost:5198`.
