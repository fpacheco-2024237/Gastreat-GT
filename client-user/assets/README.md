# Assets del proyecto client-user

Esta carpeta contiene los archivos de imágenes necesarios para la app móvil.

## Imágenes requeridas

- `icon.png`
  - Icono de la app usado en `app.json`.
  - Recomendado: 1024x1024 px.

- `splash.png`
  - Imagen de splash screen usada en `app.json`.
  - Recomendado: 1242x2436 px o un tamaño vertical grande con fondo transparente/ uniforme.

- `gastreat_logo.png`
  - Logo de marca usado en `LoginScreen`.
  - Recomendado: 512x512 px con fondo transparente.

- `avatarDefault.png`
  - Avatar por defecto usado en `ProfileScreen` cuando no hay URL de imagen.
  - Recomendado: 256x256 px o 512x512 px con fondo transparente.

## Configuración de imágenes

- `app.json` ya está configurado con:
  - `icon`: `./assets/icon.png`
  - `splash.image`: `./assets/splash.png`
  - `assetBundlePatterns`: [`assets/**/*`]

- `LoginScreen` usa `assets/gastreat_logo.png`.
- `ProfileScreen` usa `assets/avatarDefault.png` como fallback para avatares.

## Nota

Sube imágenes reales a esta carpeta con los nombres listados arriba para que la app se muestre correctamente.
