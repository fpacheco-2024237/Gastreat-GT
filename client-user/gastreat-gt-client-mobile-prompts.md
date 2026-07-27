# Gastreat GT — App móvil "client-mobile" (dual rol: Cliente y Personal)

## Contexto y mapeo de roles

El Auth Service (.NET) emite JWTs con exactamente **2 roles**:

- **`USER_ROLE`**: cliente del restaurante. Puede navegar el menú, hacer pedidos, reservar mesas y ver su historial.
- **`ADMIN_ROLE`**: administrador maestro. Tiene acceso completo: gestión de mesas, pedidos activos, historial global y facturación.

`authStore` guarda el `role` extraído del JWT y lo usa para condicionar navegación y contenido dentro de cada pantalla. No existen roles intermedios (MESERO, CAJERO, COCINA) en la app móvil; esos son internos del server-admin.

- Endpoints base (server-admin Node/Express): `/gastreatGT/Admin/v1/...` (menú, mesas, pedidos, facturación). Endpoints de autenticación/perfil (.NET Auth Service): `/gastreatGT/auth/v1/...`.

---

## FASE 1 — Inicialización del proyecto

Actúa como desarrollador senior de React Native. Inicia el proyecto **"client-mobile"** (app móvil de Gastreat GT: los clientes ven el menú, hacen pedidos y reservan mesas; el personal -Mesero, Cajero, Cocina, Administrador- usa la misma app con vistas adaptadas a su rol).

### Stack OBLIGATORIO

Expo SDK 55, React Native 0.83, React 19, JavaScript (NO TypeScript), ESM (`"type": "module"`).

Zustand+persist, axios, react-hook-form, @react-navigation, expo-secure-store, @react-native-async-storage/async-storage.

Íconos: MaterialIcons de @expo/vector-icons.

Textos de UI en español.

### Estructura inicial

```
App.jsx, index.js, app.json, package.json, metro.config.cjs, eslint.config.js

src/shared/
  constants/theme.js, endpoints.js
  components/common/Button.jsx, Input.jsx, Common.jsx
  store/authStore.js
  api/authClient.js, apiClient.js
```

### Genera en esta fase

1. **package.json** (scripts expo, dependencias del stack indicado).
2. **app.json** (name/slug `"gastreat-mobile"`, portrait, splash, icon).
3. **theme.js**: `COLORS` (primary `"#D62828"`, secondary `"#6B4226"`, background `"#FFF8F0"`, surface `"#FFFFFF"`, text `"#1F1F1F"`, textLight `"#6B7280"`, error `"#DC2626"`, success `"#16A34A"`, warning `"#F59E0B"`, border `"#E5E7EB"`), `SPACING`, `FONT_SIZE`, `SHADOWS`.
4. **endpoints.js**:
   - `ENDPOINTS.AUTH = EXPO_PUBLIC_AUTH_URL || "http://localhost:3000/gastreatGT/auth/v1"`
   - `ENDPOINTS.API = EXPO_PUBLIC_API_URL || "http://localhost:3001/gastreatGT/Admin/v1"`
5. **Button** (primary/secondary, loading), **Input** (label+error), **Common** (LoadingSpinner, EmptyState, Card).
6. **authStore**: `{ token, user, role, isAuthenticated, _hasHydrated }`; `login(accessToken, user, refreshToken)` guarda `role` desde `user.role` (`"USER_ROLE"` o `"ADMIN_ROLE"`) y guarda refresh en SecureStore; `logout()` limpia y borra refresh; `setAccessToken`; `updateUser`; helper `isAdmin()` (true si `role === "ADMIN_ROLE"`); `onRehydrateStorage -> _hasHydrated = true`.
7. **authClient** y **apiClient**: Bearer en request; refresh en 401 vía `POST ENDPOINTS.AUTH + "/refresh"` con refreshToken de SecureStore, cola de peticiones concurrentes, logout si falla. En `authClient` NO refrescar en `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/resend-verification`.
8. **App.jsx** (SafeAreaProvider + StatusBar) y **index.js** (registerRootComponent).
9. **.env.example** con `EXPO_PUBLIC_AUTH_URL` y `EXPO_PUBLIC_API_URL`.

### Restricciones

No hardcodees colores fuera de `theme.js`.

Devuelve cada archivo con su ruta como comentario de encabezado.

---

## FASE 2 — Autenticación

Continúa el proyecto **"gastreat-mobile"** (Expo 55, JS/ESM) SIN modificar la estructura ni los archivos de `src/shared/` ya creados.

### Genera en esta fase

```
src/features/auth/
  hooks/useAuth.js
  screens/LoginScreen.jsx
  screens/RegisterScreen.jsx

src/navigation/
  AuthStack.jsx
  AppNavigator.jsx
```

### Detalles

- **useAuth**: `handleLogin` -> `POST authClient "/login"`, respuesta `{ accessToken, refreshToken, userDetails }` (tolerar `token`/`user`), `userDetails.role` se guarda en el store -> `login()`. `handleRegister` -> `POST "/register"` (siempre crea usuarios con rol `CLIENTE`, no se expone selector de rol). Expone `{ handleLogin, handleRegister, loading, error, logout }`.
- **LoginScreen**: react-hook-form `{ emailOrUsername, password }`, logo `assets/gastreat_logo.png`, Input+Button comunes, enlace a Register.
- **RegisterScreen**: form `{ name, surname, username, email, password, phone }`; `POST "/register"`; Alert de éxito y navegar a Login.
- **AuthStack**: Login + Register, `headerShown:false`.
- **AppNavigator**: spinner si `!_hasHydrated`; `NavigationContainer` con `MainTabs` si `isAuthenticated` (el contenido de cada tab se adapta según `role` del store), si no `AuthStack`.
- Actualiza `App.jsx` para usar `AppNavigator`.

### Restricciones

Reutiliza theme, Button, Input, authStore, authClient.

Devuelve cada archivo con su ruta como encabezado.

---

## FASE 3 — MainTabs (5 pestañas, contenido condicional por rol)

Continúa "gastreat-mobile" respetando `shared/` y `auth/` existentes.

### Genera en esta fase

```
src/navigation/MainTabs.jsx
```

Actualiza `AppNavigator.jsx` para usar `MainTabs` cuando `isAuthenticated`.

### MainTabs — 5 pestañas con native-stack anidado

Cada tab muestra contenido distinto según `role` (`"USER_ROLE"` o `"ADMIN_ROLE"`), leído de `authStore`.

1. **Menú** (ícono `restaurant-menu`): `MenuStack` -> `MenuList`, `DishDetail` (placeholders por ahora).
   - `USER_ROLE`: `DishDetail` incluirá botón "Agregar al pedido".
   - `ADMIN_ROLE`: `DishDetail` en modo solo lectura.
2. **Pedidos** (ícono `receipt-long`): `PedidosStack`, contenido por rol:
   - `USER_ROLE` -> `MyOrdersList`, `NewOrder`, `OrderDetail`
   - `ADMIN_ROLE` -> `AllOrdersList`, `OrderDetail` (vista global de todas las comandas activas)
3. **Reservas** (ícono `event-seat`): `ReservasStack`, contenido por rol:
   - `USER_ROLE` -> `MyReservationsList`, `CreateReservation`, `ReservationDetail`
   - `ADMIN_ROLE` -> `TablesStatus`, `ReservationDetail` (estado global de mesas + gestión)
4. **Historial** (ícono `history`): `HistorialStack`, contenido por rol:
   - `USER_ROLE` -> `OrderHistory`, `ReservationHistory`
   - `ADMIN_ROLE` -> `BillingHistory` (historial global de pedidos y facturación)
5. **Perfil** (ícono `person`): `ProfileScreen` directo, `headerShown:true` en esta tab. Igual para ambos roles.

Todas las pantallas anteriores son **placeholders** por ahora.

Estilo tabBar: `activeTintColor COLORS.primary`, `inactive COLORS.secondary`, `backgroundColor COLORS.surface`, `height 60`, `borderTop COLORS.border`. `headerShown:false` en tabs (salvo Perfil).

Cada placeholder: View centrado con título de la pantalla + el `role` actual (leído de `authStore`), usando `theme`.

### Restricciones

No borres `AuthStack` ni la lógica de hidratación de `AppNavigator`.

Devuelve cada archivo con su ruta como encabezado.

---

## FASE 4 — Implementación real de features

Continúa "gastreat-mobile" respetando `shared/`, `auth/` y `navigation/` existentes. Reemplaza los placeholders por implementación real.

### Patrón OBLIGATORIO para todos los hooks

`useState(loading/error)`, `useCallback`, `try/catch/finally`, `setError` con `err.response?.data?.message`, datos como `response.data.data || response.data`, reutilizar `apiClient` y componentes comunes (Card, LoadingSpinner, EmptyState, Button, Input). Todos los hooks leen `role` de `authStore` (`"USER_ROLE"` / `"ADMIN_ROLE"`) para decidir qué endpoint y qué render usar.

### menu/

- **useMenu.js**: `GET "/menu"` (platillos + categorías); map `{ name, image: photo, category, price, description, isAvailable: Boolean(stock > 0 || isActive) }`; `useEffect` al montar.
- **MenuScreen**: lista agrupada por categoría en `Card`, pull-to-refresh, navega a `DishDetail`.
- **DishDetailScreen**: detalle del platillo; si `role === "USER_ROLE"` muestra botón "Agregar al pedido" (navega a `NewOrder` con el platillo preseleccionado); si `ADMIN_ROLE`, solo lectura.

### pedidos/

- **useOrders.js**:
  - `USER_ROLE`: `GET "/orders/me"`; `POST "/orders"` `{ items, mesaId? }`; map `{ status, normalizedStatus: status.toUpperCase() }`.
  - `ADMIN_ROLE`: `GET "/orders/active"` (todas las comandas activas); `PATCH "/orders/:id/status"` para gestión.
- **PedidosScreen.jsx**: una sola pantalla que renderiza `MyOrdersList` (usuario) o `AllOrdersList` (admin) según `role`, todas en `Card`, pull-to-refresh.
- **NewOrderScreen** (`USER_ROLE` únicamente): selección de platillos del menú + cantidades, `POST "/orders"`.
- **OrderDetailScreen**: detalle del pedido + acciones según `role` (cancelar para `USER_ROLE`; cambiar estado global para `ADMIN_ROLE`).

### reservas/

- **useReservations.js**:
  - `USER_ROLE`: `GET "/reservations/me"` con map `{ table: { id, name }, normalizedStatus: status.toUpperCase() }`; `POST "/reservations"`; `PUT "/reservations/:id/cancel"`.
  - `ADMIN_ROLE`: `GET "/tables/status"` map `{ id, name, status: status.toUpperCase() }` (`LIBRE` / `OCUPADA` / `RESERVADA`); `PUT "/tables/:id/status"` para cambiar estado de mesa.
- **ReservasScreen.jsx**: una sola pantalla que renderiza `MyReservationsList` (historial + cancelar) o `TablesStatus` (grilla de mesas con color por estado) según `role`.
- **CreateReservationScreen** (`USER_ROLE` únicamente): form fecha/hora/cantidad de personas, `POST "/reservations"`.
- **ReservationDetailScreen**: detalle + acciones según `role`.

### historial/

- **useHistory.js**:
  - `USER_ROLE`: `GET "/orders/history"` + `GET "/reservations/history"`; combina ambos ordenados por fecha.
  - `ADMIN_ROLE`: `GET "/billing/history"` map `{ receiptNumber, total, date, table }`.
- **HistorialScreen.jsx**: lista filtrable; render distinto según `role` (pedidos + reservas para `USER_ROLE`; historial global de facturación para `ADMIN_ROLE`).

### Restricciones

Mantén los nombres de rutas de los stacks (`MenuList`, `DishDetail`, `MyOrdersList`, etc.) iguales a `MainTabs.jsx`.

Textos en español. Devuelve cada archivo con su ruta como encabezado.

---

## FASE 5 — Perfil y revisión final

Continúa "gastreat-mobile". Completa Perfil y revisa la integración final.

### profile/

**ProfileScreen.jsx**:

- Al montar: `GET authClient "/profile"` (el perfil se gestiona en el Auth Service .NET, no en server-admin).
- Form react-hook-form `{ displayName, phone, direccion }` (campo `direccion` solo visible/editable para `role === "USER_ROLE"`, usado como dirección de entrega).
- Modo edición on/off; `PUT authClient "/profile"` y `updateUser()` del store.
- Avatar: uri si empieza con `"http"`, si no imagen por defecto `assets/avatarDefault.png`.
- Badge con el rol actual: `"Cliente"` si `USER_ROLE`, `"Administrador"` si `ADMIN_ROLE`.
- Botón "Cerrar sesión" variant secondary con Alert de confirmación -> `logout()`.

Usa `Card`, `Input`, `Button`, `theme`.

### Revisión final

- `AppNavigator`: `MainTabs` si autenticado, `AuthStack` si no, spinner hasta `_hasHydrated`.
- `LoginScreen` puede usar `useAuth` o `authClient` directo (consistente con el resto).
- Verifica que cada tab de `MainTabs` muestre el set correcto de pantallas según `role`, y que los nombres de ruta coincidan entre `MainTabs.jsx` y cada Stack.
- Verifica que `apiClient` apunte a `ENDPOINTS.API` (`/gastreatGT/Admin/v1`) y `authClient` a `ENDPOINTS.AUTH` (`/gastreatGT/auth/v1`).

### Restricciones

No reescribas hooks ya correctos salvo imports rotos.

Devuelve cada archivo modificado con su ruta como encabezado.
