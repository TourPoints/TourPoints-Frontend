# TourPoints — Estado completo del proyecto

> **Snapshot verificado contra el repo el 2026-07-15.** Documento portable: pensado para
> migrar el contexto a otra IA o a otro desarrollador sin historia previa. Todo lo que
> aparece aquí fue comprobado leyendo los archivos y ejecutando comandos sobre el
> repositorio, no recordado.
>
> Las reglas de trabajo y el rol viven en `CLAUDE.md` (raíz). Este archivo es solo **estado**.

---

## 1. Qué es TourPoints

SPA de turismo gamificado para **Barranquilla, Colombia**. El usuario explora puntos de
interés (POIs), completa retos, gana puntos y canjea recompensas. Incluye un panel de
administración para gestionar POIs, retos, recompensas y usuarios.

**Equipo:** pequeño (Nicolás Guarín «Neko» + 2 o más colaboradores). Nicolás cubre
explore, mapa y dashboard de admin. Tickets en Jira (prefijo `TOUR-`).

---

## 2. Stack real

| Pieza | Versión / detalle |
|---|---|
| Frontend | Vite SPA, **JavaScript vanilla sin framework** |
| Vite | `^8.1.1` (declarado); entorno 8.1.4 |
| Node | `>=24.0.0` (engines); entorno v24.13.0 |
| npm | 11.6.2 |
| Única dependencia runtime | `lucide` `^1.24.0` (iconos) |
| Mapa | **Leaflet 1.9.4 por CDN** (`unpkg`), NO por npm |
| Backend | **No existe todavía** |
| Persistencia actual | `localStorage` con seeds de `src/mocks/` |
| Entorno | Windows 11, VS Code, Docker Desktop, WSL2 |

**Scripts:** `dev`, `build`, `preview`. No hay `test` ni `lint`.

> ⚠️ Leaflet entra por `<script>` en `frontend/index.html`, así que `L` es un **global**.
> No figura en `package.json`: un `npm install` limpio no lo trae y el mapa depende de
> que unpkg esté disponible. Decisión a revisar antes de producción.

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

100 archivos versionados. Router propio (no librería): rutas estáticas en `routes` +
`dynamicRoutes` con regex (hoy solo `/poi/:id`).

### Patrón de página

Cada página exporta dos funciones: `nombre()` devuelve el HTML como string, e
`initNombre()` engancha los listeners tras el montaje. El router llama a ambas.

### Capa de servicio — el corazón del diseño

El objetivo declarado: **unificar el modelo de datos entre admin, home y vistas
públicas**, con fallback a localStorage y soporte HTTP futuro sin tocar las vistas.

- `api.client.js` — cliente HTTP. Expone `isApiEnabled()`, `ApiError` y `apiGet()`.
- `config/api.js` — `API_BASE_URL` (de `VITE_API_URL`), `API_TIMEOUT_MS` (8000),
  `isApiConfigured()`.
- `createCrudService.js` — **fábrica CRUD compartida**. Genera list/getById/create/
  update/remove/toggleStatus sobre una colección. La usan retos, recompensas y usuarios.
- `poi.service.js` — servicio propio (modelo más rico: coordenadas, galería, publicación).
- `localStore.js` — `readCollection` / `writeCollection` / `nextPrefixedId`.
- Otros: `auth`, `challenge`, `challengeProgress`, `favorite`, `review`, `reward`,
  `user`, `visit`.

**Contrato de conmutación:** si `VITE_API_URL` está definida → API real; si no → mocks.
Ver `frontend/.env.example`.

---

## 4. Estado de Git — VERIFICADO, corrige suposiciones previas

### Ramas

```
main
develop                                    (protegida)
test/full-integration        ← rama de integración activa (la "rama full")
feature/TOUR-35-challenges   ← RAMA ACTUAL, trabajo en curso
feature/TOUR-2-browse-pois
feature/TOUR-4-interactive-map
feature/TOUR-40-TOUR-39-admin-dashboard
feature/US-0-visit-landing-page
feature/US-2-view-point-of-interest-details
feature/rewards
```

`feature/full` **no existe y nunca existió** (ni en ramas ni en reflog). Cuando se habla
de «la rama full» se refiere a **`test/full-integration`**.

### Flujo real

`feature/TOUR-<ticket>-<slug>` → `test/full-integration` → `develop` → `release` → `main`

`main` y `develop` están protegidas. Como no se puede tocar `develop`, **todo se acumula
en `test/full-integration`** hasta que los features estén pulidos y se pruebe la
integración con el backend. Solo entonces se abre el PR a `develop`.

### Divergencia medida (`git rev-list --count`, tras fusionar TOUR-35 el 2026-07-15)

| Rama | Commits SIN integrar en full | Commits que le faltan de full |
|---|---|---|
| `develop` | **0** | **16** |
| `main` | 0 | 38 |
| `feature/TOUR-2-browse-pois` | 0 | 35 |
| `feature/TOUR-4-interactive-map` | 0 | 34 |
| `feature/TOUR-40-TOUR-39-admin-dashboard` | 0 | 34 |
| `feature/US-0-visit-landing-page` | 0 | 32 |
| `feature/US-2-view-point-of-interest-details` | 0 | 33 |
| `feature/rewards` | 0 | 34 |
| `feature/TOUR-35-challenges` | 0 | 0 |

**Lectura crítica:** ninguna rama tiene trabajo sin integrar. `test/full-integration` ya
lo contiene TODO. Las ramas `feature/*` antiguas son punteros muertos, ya fusionados y
muy atrasados — no guardan nada exclusivo y pueden borrarse sin pérdida.

`develop` es **ancestro directo** de la rama de integración: no ha divergido y no habría
conflictos al fusionar. La brecha son los 16 commits de esta tanda más los anteriores.

Para saber en qué rama se construyó cada feature y cuáles son trampa, ver
`docs/TRAZABILIDAD.md`.

### Estado de la última tanda (2026-07-15)

Los 10 commits de `feature/TOUR-35-challenges` (retos, comentarios, favoritos, volver
atrás, reseñas de Barranquilla, corazón de la nav) ya están **fusionados** en
`test/full-integration` por fast-forward. Todo verificado en el navegador contra el
servidor de desarrollo, no solo compilado.

`.claude/` está ignorado desde `32d1713`: es configuración local de herramientas y se
colaba en cada `git add`.

> Avisos de Git: `LF will be replaced by CRLF` en varios archivos. No hay `.gitattributes`
> que fije los finales de línea — fricción latente si entra alguien en Linux/WSL.

---

## 5. Funcionalidad implementada

### Rutas públicas
`/` home · `/explore` · `/challenges` · `/favorites` · `/map` · `/rewards` · `/login` ·
`/register` · `/poi/:id` (dinámica) · 404

### Rutas admin (todas con `auth: true`)
`/admin` dashboard · `/admin/users` · `/admin/pois` · `/admin/challenges` ·
`/admin/rewards` · `/admin/settings`

### Autenticación — MODO DEMO
`auth.service.js` **no valida contraseñas a propósito**: solo comprueba que el email
exista entre los usuarios registrados. La decisión está documentada en el archivo —
guardar o validar contraseñas en el frontend no aporta garantía real. La sesión vive en
`localStorage` bajo `tourpoints:session`. El rol también se guarda en localStorage y hoy
**es la fuente de verdad** para el router: con backend dejará de serlo y la autorización
pasará al servidor.

Endpoints previstos (ya documentados en el código): `POST /auth/login`,
`POST /auth/register`, `POST /auth/logout`.

### Retos (TOUR-35, en curso)
Separación deliberada y bien razonada de dos dimensiones que antes se mezclaban:
- **Estado de publicación** (`Activo`/`Pendiente`/`Inactivo`) → lo gestiona el admin, vive
  en `challenge.service`.
- **Progreso del usuario** (`disponible`/`en-curso`/`completado`) → vive en
  `challengeProgress.service`, por `{userId, challengeId, state, updatedAt}`.

Completar un reto acredita puntos vía `updateUser` + `updateSessionUser`, así que el saldo
se refleja también en el panel de admin. La página pública solo muestra retos `Activo`.

Endpoints previstos: `GET /me/challenges`, `POST /me/challenges/:id/start`,
`POST /me/challenges/:id/complete`, `DELETE /me/challenges/:id`.

### Favoritos
Por usuario, entradas `{userId, poiId, createdAt}` en `favorite.service`. El corazón de
las tarjetas (inicio, explora, favoritos) y el botón del detalle comparten servicio, así
que el estado es el mismo en todas las vistas. La vista `/favorites` los lista de lo más
reciente a lo más antiguo y descarta los POIs que hayan dejado de publicarse.
Endpoints previstos: `GET /me/favorites`, `POST /me/favorites/:poiId`,
`DELETE /me/favorites/:poiId`.

### Comentarios
`review.service` persiste en localStorage y aplica **una reseña por usuario y POI**. El
formulario del detalle valida valoración (1-5) y longitud (10-500) antes de publicar, y
la sección se repinta en el sitio. El texto se escapa al pintarlo.
Endpoints previstos: `GET /pois/:poiId/reviews`, `POST /pois/:poiId/reviews`,
`DELETE /me/reviews/:id`.

---

## 6. GAPS — lo que falta implementar

Ordenados por lo que bloquea el objetivo declarado (*probar el backend con el frontend*).
Todo verificado leyendo los archivos, con rutas y líneas para poder comprobarlo.

### 🔴 BLOQUEANTE — la escritura por HTTP no existe

`api.client.js` implementa **únicamente `apiGet`**. No hay `apiPost`, `apiPut` ni
`apiDelete` en todo el proyecto (verificado por grep).

La consecuencia es silenciosa y grave. En `createCrudService.js`, solo `list()` (línea 47)
y `getById()` (56) consultan `isApiEnabled()`. Los métodos `create()` (78), `update()` (90),
`remove()` (105) y `toggleStatus()` (120) **escriben en localStorage incondicionalmente**:

```js
async list()       { if (isApiEnabled()) return apiGet(apiPath); ... }  // ✅ conmuta
async create(data) { const items = readCollection(collection, seed); ... } // ❌ nunca
```

**No es solo la fábrica: es sistémico.** `poi.service.js` repite exactamente el mismo
patrón — `getPois` (32), `getAllPois` (46) y `getPoiById` (59) conmutan; `createPoi` (80),
`updatePoi` (104) y `deletePoi` (129) no consultan `isApiEnabled()` en ningún momento.

El día que se defina `VITE_API_URL`, las **lecturas irán al backend y las escrituras se
quedarán en el navegador**, sin error visible. El admin creará un POI, lo verá aparecer, y
al recargar habrá desaparecido. Es el primer trabajo antes de integrar backend.

### 🔴 Servicios que ni siquiera intentan conmutar
`favorite.service`, `visit.service`, `review.service` y `challengeProgress.service` son
localStorage puro. Todos llevan sus endpoints previstos documentados en la cabecera, pero
ninguno consulta `isApiEnabled()`. Es coherente con el estado del resto (no existe la
escritura HTTP en absoluto), pero hay que contarlo al integrar el backend.

### 🔴 `guards.js` es código muerto — y el fix que lo tocó es inerte

**Nadie importa `router/guards.js`.** La única coincidencia de "guards" en el resto del
código es una mención en el HTML de `pages/admin/settings.js:50`.

El detalle importante: el commit `929950b "fix: route guards read the real session"`
modificó `guards.js` (18 líneas) y `poiDetail.js`. Pero como nada importa `guards.js`,
**ese arreglo no tiene efecto**. El guard real vive en `router/router.js:43`:

```js
if (route.auth && !isAdmin()) { ... }   // isAdmin() viene de utils/role.js
```

y sigue leyendo `localStorage.getItem('role')` — justo lo que el comentario de `guards.js`
dice que estaba mal. Hay que decidir: o se cablea `guards.js` al router, o se borra.

### 🔴 Desincronización sesión/rol por la clave sin prefijo

`utils/role.js` usa la clave **`'role'` sin el prefijo `tourpoints:`**, a diferencia de
todo lo demás:

```js
export const setRole = (role) => localStorage.setItem('role', role);  // ← sin prefijo
```

`localStore.js:18-23` borra, **al importarse**, todas las claves que empiezan por
`tourpoints:` cuando cambia `SEED_VERSION`. Por tanto `tourpoints:session` se borra pero
`role` **sobrevive**. Resultado: sesión nula + rol admin persistente. El header muestra
"Iniciar sesión" mientras `/admin` sigue renderizando entero (`dashboard.js` solo consulta
`isAdmin()`, nunca `getCurrentUser()`, así que ni siquiera falla: funciona sin sesión).

No es hipotético: `SEED_VERSION` se introdujo ya en `"2-barranquilla"` (commit `496b9b3`),
así que el borrado **se disparó para todos los que tenían datos previos**.

Impacto de seguridad: bajo en sí mismo — el rol es de cliente y cualquiera puede escribir
`localStorage.setItem('role','admin')`; el propio código dice que la autorización real la
debe aplicar el backend. Pero es una inconsistencia de estado real y es exactamente la
clase de cosa que estalla cuando entre JWT.

**Dos fuentes de verdad para "es admin":** `localStorage['role']` (router, páginas admin)
vs `session.role` (`userMenu.js:81`). Conviene unificarlas.

### 🟠 `auth: true` en realidad significa "requiere admin"

En `routes.js` las rutas se marcan con `auth: true`, pero el guard de `router.js:43`
comprueba `isAdmin()`, no `isAuthenticated()`. Hoy funciona porque todas las rutas con
`auth: true` son `/admin/*`. En cuanto exista una ruta que solo requiera sesión (perfil,
favoritos, "mis retos"), exigirá admin por error. El nombre miente.

### 🟠 `escapeHtml` sigue faltando en las páginas públicas

`escapeHtml` (definido en `modal.js:14`) se usa en las páginas admin, `challenges.js`,
`userMenu`, `sidebar`, `login` y —ya— en `poisCard`, `reviewCard` y `reviewsList`.

**Sigue sin usarse** en `explore.js`, `map.js`, `poiDetail.js`, `home.js` y `rewards.js`,
que interpolan en crudo campos venidos de los datos: `poi.name`, `poi.description`,
`poi.category`, `poi.address`, `poi.image` (p.ej. el popup de `map.js`, la cabecera de
`poiDetail.js`, las píldoras de categoría de `explore.js`).

Hoy el riesgo es bajo (los datos salen de mocks propios), pero está **al revés de lo
deseable**: el admin, que es la superficie de confianza, escapa; las vistas públicas, que
renderizarán datos venidos del backend, no. Cuando el POI lo sirva la API, esto es un XSS
almacenado. El camino de comentarios, que es el único con texto de usuario real hoy, ya
está escapado y cubierto con una prueba manual de payload.

### 🟠 Violaciones de las propias reglas de UI

La regla dice: *no usar diálogos nativos* y *no dejar elementos no funcionales*. Quedan
**5 `alert()`**, existiendo ya un sistema de modales (`openConfirmModal` / `openFormModal`):

| Ubicación | Qué hace |
|---|---|
| `map.js:323` | Botón **"Iniciar Ruta"** → solo un `alert`. No calcula ninguna ruta. |
| `poiDetail.js:270,274` | Resultado de registrar visita → `alert`. |
| `poiGallery.js:72` | **"Ver galería completa"** → `alert`. |
| `settings.js:20` | Formulario entero → `onsubmit` inline con `alert('...(Mock)')`. |

Eran 7. El "Ver todas las reseñas" ya despliega la lista de verdad.

### 🟠 `settings.js` es el outlier del proyecto
Rompe varias convenciones a la vez: estilos **inline** en cada elemento (el resto usa CSS
en `styles/`), manejador `onsubmit=""` **inline en el HTML** (no se hace en ningún otro
sitio), y un formulario completamente no funcional. Es claramente el archivo más antiguo
y sin tocar. Candidato claro a reescritura.

### 🟠 Sin tests ni linter
No hay framework de test, ni ESLint, ni Prettier, ni CI. En un equipo de 3+ con una
integración de backend por delante, esto es riesgo real: las dos fábricas compartidas
(`createCrudService`, `createAdminCrudView`) son justo el tipo de código que un test
protege barato — un fallo ahí rompe cuatro vistas a la vez.

### 🟠 Sin `.gitattributes`
Los avisos CRLF/LF ya aparecen al hacer `git diff`. Generarán diffs ruidosos en cuanto
colabore alguien en WSL/Linux.

### 🟠 `visit.service` sigue sin dueño y sin puntos
Dos cosas a la vez. `registerVisit` devuelve siempre `points: 0` y el propio mensaje
admite que "los puntos se acreditarán cuando el backend esté conectado": registrar una
visita **no suma puntos**, mientras que los retos sí acreditan.

Y las visitas se guardan como una **lista plana de ids sin userId**, exactamente el bug
que tenían los favoritos: al cambiar de cuenta el nuevo usuario hereda las visitas del
anterior. `favorite.service` y `challengeProgress.service` ya van por usuario; este no.
Es el siguiente candidato obvio.

### 🟡 `poi.reviewCount` no tiene que ver con los comentarios reales
Los POIs semilla traen `reviewCount` de tres cifras (980, 1520…) que se muestra junto al
rating, mientras la sección de comentarios lista los que existen de verdad (2 o 3). Al
publicar un comentario el contador de la sección sube, pero el titular no. O se hace
derivar de las reseñas reales, o se asume como número decorativo de la semilla.

### 🟡 Efectos secundarios en el nivel de módulo
`localStore.js` borra localStorage **al ser importado** (línea 18) y `router.js` llama a
`renderRoute()` y registra listeners al importarse (74-82). Funciona, pero hace el código
difícil de testear de forma aislada — relevante en cuanto se añadan tests.

### 🟡 Coordenadas sin verificar
Los POIs semilla están anclados en Barranquilla con coordenadas **aproximadas**,
pendientes de contrastar contra Google Maps. Marcado en `pages/map.js:14`.

### 🟡 Leaflet por CDN
Sin pinear en `package.json`, dependiente de unpkg, global `L`. Ver §2.

### 🟡 Typo histórico `config/enviroment.js`
(falta la `n`: debería ser `environment`). Conservado a propósito para no romper imports;
el propio archivo documenta que conviene corregirlo en la próxima reorganización.

### 🟡 Conflicto entre archivos de contexto
`.agents/AGENTS.md` dice que el flujo es `develop → feature/* → PR → develop`. Es
**incorrecto**: los features salen de `test/full-integration`, no de `develop`. `CLAUDE.md`
ya tiene el flujo real. Los dos archivos se solapan mucho (Git Flow, Scrum, SOLID) y
conviene consolidarlos o alinearlos.

---

## 7. Orden recomendado

1. Fusionar `feature/TOUR-35-challenges` → `test/full-integration`.
2. **Implementar `apiPost`/`apiPut`/`apiDelete` y hacer conmutar la escritura** en
   `createCrudService` *y* en `poi.service`. Sin esto la prueba con backend da falsos
   positivos: parecerá que guarda y no guardará.
3. Resolver el trío de sesión/rol: prefijar la clave `role`, unificar la fuente de verdad
   (`localStorage['role']` vs `session.role`), y cablear o borrar `guards.js`. Hacerlo
   **antes** de JWT, no después.
4. Llevar `visit.service` a por-usuario, como ya están favoritos y progreso de retos, y
   decidir si una visita acredita puntos.
5. Escapar las vistas públicas (`explore`, `map`, `poiDetail`, `home`, `rewards`) antes de
   que los datos vengan de la API.
6. Conmutar `favorite`, `visit`, `review`, `challengeProgress`.
7. Sustituir los 5 `alert()` restantes por el sistema de modales; decidir qué hacer con
   los botones no funcionales (implementar u ocultar). Reescribir `settings.js`.
8. Verificar coordenadas de los POIs y sustituir las imágenes de relleno.
9. Borrar las ramas `feature/*` muertas (ya fusionadas, 0 commits exclusivos).
10. Probar integración backend/frontend.
11. PR `test/full-integration` → `develop` (sin divergencia: es un avance rápido).

---

## 8. Convenciones

- **Commits:** Conventional Commits, mensajes cortos **en inglés**, presente
  (`feat`, `fix`, `docs`, `refactor`, `style`, `test`, `build`, `ci`, `chore`).
  Con ticket cuando aplique: `feat(TOUR-4): ...`
- **Scrum:** Épica → Historia de Usuario → Tarea → Subtarea. Nunca saltar niveles.
- **Código:** SOLID, DRY, KISS, Clean Architecture, módulos reutilizables. Sin hacks
  rápidos. Explicar trade-offs. Compatibilidad > novedad.
- **UI:** prohibido `prompt()`/`confirm()` nativos. Nada de elementos no funcionales.
- **Comentarios del código:** en español, explicando el *porqué* y las decisiones de
  diseño (no el *qué*). Es un patrón consistente y valioso del proyecto — mantenerlo.
- **Antes de proponer upgrades:** verificar Node, npm, Docker, WSL, Vite y `package.json`.
