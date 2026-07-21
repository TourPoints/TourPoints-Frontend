# TourPoints — Estado completo del proyecto

> **Snapshot verificado contra el repo el 2026-07-21.** Documento portable: pensado para
> migrar el contexto a otra IA (p. ej. para redactar el Documento Técnico de Riwi) o a otro
> desarrollador sin historia previa. Todo lo que aparece aquí fue comprobado leyendo los
> archivos y ejecutando comandos sobre el repositorio, no recordado.
>
> Las reglas de trabajo y el rol viven en `CLAUDE.md` (raíz). Este archivo es solo **estado**.
> Reemplaza por completo la versión anterior (2026-07-15): el cambio más importante desde
> entonces es que **el backend ya existe, está desplegado y conectado** — la mayoría de los
> gaps de la versión anterior (falta de `apiPost`/`apiPut`/`apiDelete`, servicios que no
> conmutaban) están resueltos.

---

## 1. Qué es TourPoints

SPA de turismo gamificado para **Barranquilla, Colombia**. El usuario explora puntos de
interés (POIs), completa retos, gana puntos y canjea recompensas en aliados locales.
Incluye un panel de administración para gestionar POIs, retos, recompensas, usuarios y
moderación de comentarios.

**Equipo:** proyecto de formación en **Riwi**, grupo de 6 personas — Nicolás Guarín «Neko»,
Juan Henríquez, Alejandro Escobar, Lyan Páez, Isaac Guzmán, Stevens Herrera. Nicolás cubre
explore, mapa y dashboard de admin (frontend). Tickets en Jira (prefijo `TOUR-`).

---

## 2. Stack real

| Pieza | Versión / detalle |
|---|---|
| Frontend | Vite SPA, **JavaScript vanilla sin framework** |
| Vite | `^8.1.1` (declarado); entorno 8.1.4 |
| Node | `>=24.0.0` (engines); entorno v24.13.0 |
| npm | 11.6.2 |
| Única dependencia runtime | `lucide` `^1.24.0` (iconos) |
| Mapa | Leaflet 1.9.4 por CDN (`unpkg`) + Leaflet Routing Machine (OSRM, perfil `foot`) |
| Backend | **FastAPI**, desplegado (`tourpoints.159.54.176.254.nip.io/api/v1`), capas router → service → repository → model |
| Base de datos | **PostgreSQL + PostGIS** en Neon (tipo `Geography`, índice GiST, `srid=4326`) |
| Auth backend | JWT (`create_access_token`, claims `{sub, role, status, iat, exp}`), bcrypt |
| Persistencia frontend | API real donde el módulo está cableado; `localStorage` como fallback/mock en el resto |
| Entorno | Windows 11, VS Code, Docker Desktop, WSL2 |

**Scripts:** `dev`, `build`, `preview`. Sigue sin haber `test` ni `lint`.

> ⚠️ Leaflet y Leaflet Routing Machine entran por `<script>` en `frontend/index.html`
> (`L` global). No figuran en `package.json`. Decisión pendiente de revisar antes de
> producción.

---

## 3. Arquitectura

### Estructura (`frontend/src/`)

```
components/     Atomic Design: atoms / molecules / organism
config/         api.js, enviroment.js   ← lectura centralizada de VITE_*
layouts/        public.js, adminLayout.js
mocks/          seeds: pois, challenges, rewards, users, reviews
pages/          públicas + pages/admin/ + pages/auth/
router/         router.js, routes.js, guards.js, layouts.js
services/       capa de servicio (ver abajo)
styles/         CSS espejo de la estructura de componentes
utils/          text, date, icons, role, poiFilter, activeMenu
```

Router propio (no librería): rutas estáticas en `routes` + `dynamicRoutes` con regex
(`/poi/:id`). Guard en `router.js`: `route.auth && !isAdmin()` → 404 (no "acceso
denegado" — es ocultamiento por UI, la autorización real la aplica el backend vía JWT).

### Patrón de página

Cada página exporta dos funciones: `nombre()` devuelve el HTML como string, e
`initNombre()` engancha los listeners tras el montaje. El router llama a ambas.

### Capa de servicio — el corazón del diseño

Objetivo cumplido: **modelo de datos unificado entre admin, home y vistas públicas**, con
conmutación real API/localStorage módulo por módulo.

- `api.client.js` — cliente HTTP completo: `apiGet`, `apiGetItems`, `apiPost`, `apiPatch`,
  `apiPut`, `apiDelete`, `apiPostForm` (multipart, usada para subir imágenes de POIs),
  manejo de token (`saveToken`/`getToken`/`clearToken`), `ApiError`, timeout con
  `AbortController`.
- `config/api.js` — `API_BASE_URL` (de `VITE_API_URL`), `API_MODULES` (Set de módulos
  cableados al backend real), `isApiConfigured()`. **Los 9 módulos del MVP están
  cableados:** `auth, pois, reviews, favorites, visits, points, challenges, rewards, users`.
- `createCrudService.js` — fábrica CRUD compartida (list/getById/create/update/remove/
  toggleStatus), usada por retos, recompensas y usuarios; conmuta API/mock en los seis
  métodos.
- `poi.service.js` — servicio propio, modelo más rico (coordenadas, galería, publicación,
  subida de imagen real vía `uploadPoiImage` + `apiPostForm`).
- `points.service.js`, `challengeProgress.service.js` — ledger de puntos y progreso de
  reto por usuario.
- `review.service.js` — comentarios + `getPendingComments()`/`moderateComment()` para la
  cola de moderación admin.
- `localStore.js` — `readCollection` / `writeCollection` / `nextPrefixedId`, fallback
  cuando el módulo no está cableado o la sesión no alcanza.

**Contrato de conmutación:** si `VITE_API_URL` está definida **y** el módulo aparece en
`API_MODULES` → API real; si no → mocks de localStorage. Ver `frontend/.env.example`.

**Técnica de verificación de contrato:** como los routers del repo backend suelen estar
vacíos en las ramas accesibles, la fuente de verdad real es el `openapi.json` del servidor
desplegado (`GET /api/v1/openapi.json` o `/openapi.json` en la raíz) — se descarga y se
diffea contra el frontend antes de asumir que un endpoint sigue igual. Esto ya atrapó dos
veces un cambio real de ruta (`/rewards/{id}/canjear` ↔ `/redeem`).

---

## 4. Estado de Git

### Ramas locales

```
main                                        (protegida)
develop                                     (protegida)
test/full-integration        ← rama de integración activa, RAMA ACTUAL
feature/TOUR-35-challenges
feature/TOUR-2-browse-pois
feature/TOUR-4-interactive-map
feature/TOUR-40-TOUR-39-admin-dashboard
feature/US-0-visit-landing-page
feature/US-2-view-point-of-interest-details
feature/rewards
feature/auth-api-integration
feature/full-backend-connection
feature/user-dashboard
```

### Flujo real

`feature/TOUR-<ticket>-<slug>` → `test/full-integration` → `develop` → `release` → `main`

`develop` no se toca hasta que todos los features estén pulidos y probada la integración
backend/frontend. Todo se acumula en `test/full-integration`.

### Últimos commits en `test/full-integration` (más reciente primero)

```
fee58a8 fix(rewards): follow the redeem endpoint back to /redeem
7587e06 chore(config): re-enable rewards now that the backend has data again
3433e22 style(admin): make the status dropdown look like the rest of the design system
5ace812 fix(rewards): make redemption work without the live backend
40237c8 feat(admin): add a comment moderation queue
f8ecc84 feat(admin): collapse tables into cards on mobile
90af50d feat: enhance admin panel with file upload support and status management
6225411 docs: add comprehensive technical study guide for TourPoints project
5d0ce32 fix(docs): update database schema section in README
3d7d6b1 fix(pois): hide the rating number when a POI has none yet
2184954 docs(readme): add initial README with project overview and structure
0d30ba4 fix(rewards): drop the admin category field that never saved
59219c2 fix(rewards): replace non-working category filters with real ones
85e943b fix(rewards): call the real redeem endpoint
```

Estado verificado: `test/full-integration` está sincronizada con `origin` (mismo commit en
local y remoto), sin cambios pendientes de commitear.

---

## 5. Funcionalidad implementada (estado actual, con backend real)

### Rutas públicas
`/` home · `/explore` · `/challenges` · `/favorites` · `/map` · `/rewards` · `/login` ·
`/register` · `/poi/:id` (dinámica) · 404

### Rutas admin (todas con `auth: true`)
`/admin` dashboard · `/admin/users` · `/admin/pois` · `/admin/challenges` ·
`/admin/rewards` · `/admin/moderation` · `/admin/settings`

### Autenticación — backend real
`auth.service.js` cablea `POST /auth/login` y `POST /auth/register` contra el backend
desplegado. El rol de admin se determina por convención `rol_id == 1` (hardcodeado tanto
en frontend como en el endpoint de login del backend — inconsistencia documentada, ver
§6). El token JWT se guarda vía `saveToken`/`getToken` y viaja en `Authorization: Bearer`
en cada petición autenticada.

### POIs
CRUD completo contra el backend, incluida **subida real de imagen** (multipart vía
`apiPostForm` → `uploadPoiImage`, wireada en creación y edición). Coordenadas con
PostGIS `Geography`.

### Retos (Challenges)
Unión de/abandono de reto, progreso e historial (`GET /challenges/me`) contra el backend
real. Estado de publicación (`RetoEstado`: `BORRADOR/ACTIVO/FINALIZADO/CANCELADO`) separado
del progreso del usuario. Verificado exhaustivamente contra el OpenAPI en vivo — sin
drift.

**Endpoints del backend aún no consumidos por el frontend** (descubiertos en el OpenAPI,
no implementados): `GET /challenges/{id}/my-progress`, `GET /challenges/{id}/my-streak`,
`POST /challenges/{id}/sessions`, `PATCH /challenges/{id}/sessions/{id}/finish`. Sugieren
un sistema de rachas/sesiones que el backend ya soporta y el frontend todavía no
aprovecha — oportunidad para una futura historia de usuario.

### Recompensas y canje de puntos
Catálogo real desde `GET /rewards`. Canje vía `POST /rewards/{id}/redeem` — transacción
atómica en el backend (`pg_advisory_xact_lock` por usuario, lock de fila en la
recompensa, valida saldo/stock, genera QR + expiración, inserta canje y movimiento
negativo en el ledger). Existe además un **modo local de respaldo** (en
`reward.service.js`) que replica la misma validación (saldo, stock, estado) contra
localStorage, pensado para seguir probando la UI si el backend cae — se activa
desactivando `"rewards"` de `API_MODULES`.

### Panel de administración
- Subida de imágenes de POI funcional end-to-end.
- Cambio de estado por **desplegable con píldora de color** (reemplazó un botón de ícono
  que alternaba sin decir a qué estado iba) en POIs, retos, recompensas y usuarios.
- Tablas responsive: colapsan a tarjetas por debajo de 768px (`data-label` + CSS).
- **Cola de moderación de comentarios** (`/admin/moderation`, nueva vista, no usa la
  fábrica CRUD): lista comentarios `PENDIENTE` de todos los POIs (fan-out N+1 porque el
  backend no expone un endpoint global de comentarios pendientes), con aprobar/rechazar.

### Favoritos, visitas, comentarios
Cableados al backend real (`favorites`, `visits`, `reviews` están en `API_MODULES`).

---

## 6. GAPS conocidos — lo que falta o queda pendiente

### 🟠 Convención de rol admin duplicada
El rol de admin depende de `rol_id == 1` hardcodeado en dos sitios independientes
(frontend `ADMIN_ROL_ID` y el endpoint de login del backend), separado del lookup por
nombre de `get_admin_user`. Riesgo de divergencia si alguno cambia sin el otro.

### 🟠 `settings.js` sigue sin ser funcional
Formulario con `onsubmit` inline (`alert('...(Mock)')`) y estilos inline — rompe la
convención de "sin diálogos nativos" y de CSS en `styles/`. Candidato claro a reescritura,
ya identificado en el snapshot anterior y aún no abordado.

### 🟠 `poiGallery.js:72` sigue usando `alert()`
El botón "Ver galería completa" sigue mostrando un `alert()` en vez de abrir un modal real
— viola la misma regla de UI que ya se corrigió en el resto del panel admin.

### 🟡 Coordenadas de POIs sin verificar
Los POIs semilla están anclados en Barranquilla con coordenadas aproximadas, pendientes de
contrastar contra Google Maps.

### 🟡 Sin tests ni linter
Sigue sin haber framework de test, ESLint, Prettier ni CI. Con backend ya conectado y
transacciones reales de puntos/stock de por medio, el riesgo de una regresión silenciosa
subió respecto al snapshot anterior.

### 🟡 Leaflet y Leaflet Routing Machine por CDN
Sin pinear en `package.json`, dependientes de unpkg/OSRM público, global `L`.

### 🟡 Verificación end-to-end autenticada pendiente
Todo lo anterior está verificado contra el contrato (OpenAPI en vivo) y contra el código,
pero el flujo completo con credenciales reales (login → unirse/completar un reto → ver
puntos acreditados → canjear una recompensa → recibir el QR real) requiere que alguien del
equipo con cuenta real lo pruebe manualmente.

---

## 7. Convenciones

- **Commits:** Conventional Commits, mensajes cortos **en inglés**, presente
  (`feat`, `fix`, `docs`, `refactor`, `style`, `test`, `build`, `ci`, `chore`).
  Con ticket cuando aplique: `feat(TOUR-4): ...`
- **Scrum:** Épica → Historia de Usuario → Tarea → Subtarea. Nunca saltar niveles.
- **Código:** SOLID, DRY, KISS, Clean Architecture, módulos reutilizables. Sin hacks
  rápidos. Explicar trade-offs. Compatibilidad > novedad.
- **UI:** prohibido `prompt()`/`confirm()` nativos. Nada de elementos no funcionales
  (ver §6 para las excepciones pendientes de corregir).
- **Comentarios del código:** en español, explicando el *porqué* y las decisiones de
  diseño (no el *qué*).
- **Antes de proponer upgrades:** verificar Node, npm, Docker, WSL, Vite y `package.json`.
