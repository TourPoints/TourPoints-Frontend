# Handoff — TourPoints frontend

Documento de arranque para un agente/sesión nueva. Pégalo entero como contexto
inicial. Fecha de corte: 2026-07-19.

---

## 1. Coordenadas del proyecto

| Dato | Valor |
|---|---|
| Repo frontend | `C:\1_Nicolas_Guarin\Tourpoints\frontend` |
| Código | `frontend/src` |
| Repo backend | `C:\1_Nicolas_Guarin\TourPoints-Backend` |
| Rama de trabajo | `test/full-integration` |
| Backend desplegado | `https://tourpoints.159.54.176.254.nip.io` (base `/api/v1`, Swagger en `/docs`) |
| Dev server | `npm run dev` en `frontend/` → puerto 5173 |

Lee primero `CLAUDE.md` en la raíz: define rol, convenciones y tono. Resumen:
comunicación **en español**, commits **en inglés** (Conventional Commits, presente),
`main` y `develop` **protegidas** (nunca tocar), SOLID/DRY/KISS, **prohibido**
`alert()`/`confirm()`/`prompt()` nativos, no dejar elementos no funcionales, y
contradecir al usuario cuando haya evidencia técnica.

Otros docs útiles: `docs/CABLEADO.md` (cómo se cableó cada servicio),
`docs/ESTADO_PROYECTO.md`, `docs/INTEGRACION_BACKEND.md`.

---

## 2. Arquitectura en 10 líneas

- SPA en **JavaScript vanilla** (sin framework), Vite, router propio sobre History API.
- Vistas en `src/pages/`, componentes en `src/components/{atoms,molecules,organism}/`,
  servicios en `src/services/`, estilos en `src/styles/`.
- Todo el backend entra por `src/services/api.client.js` (fetch + JWT automático).
- **Gate por módulo**: `src/config/api.js` expone `API_MODULES`; un servicio habla con
  la API solo si `isApiEnabled("<modulo>")`. Módulos ya activos: `auth, pois, reviews,
  favorites, visits, points, challenges, rewards, users`.
- Sin `VITE_API_URL` la app cae a mocks/localStorage. **Nunca escribir en localStorage
  si el módulo está en modo API.**
- Contrato backend: campos en español, ids **UUID**, listas envueltas en
  `{items,total,page,page_size}`, estados de moderación (`APROBADO`/`PENDIENTE`/...),
  puntos desde un ledger (no columnas).
- Mapa: Leaflet + Leaflet Routing Machine, ambos por **CDN en `index.html`** (no npm).
- Distancias reales vía PostGIS: `GET /poi?lat&lng&radio_metros` devuelve `distancia_metros`.

---

## 3. Trampas ya pisadas (no repetirlas)

1. **Los ids son UUID.** Cualquier `Number(id)` da `NaN` y rompe en silencio.
   Comparar siempre como string. Ya mordió en el mapa y en el router
   (`routes.js` usa `/^\/poi\/([\w-]+)$/`, no `\d+`).
2. **Rutas de `public/`**: Vite copia `public/` a la raíz al compilar. Usar
   `/icons/x.svg`. `/public/icons/...` funciona en dev pero da **404 en build**.
   Nunca rutas relativas (`./public/...`): rompen en rutas anidadas como `/poi/<id>`.
3. **Alturas del layout**: hay variables en `:root` (`global.css`) — `--header-h: 80px`,
   `--header-h-mobile: 65px`, `--bottom-nav-h` (incluye `env(safe-area-inset-bottom)`).
   Usarlas; no volver a hardcodear offsets. Usar `dvh`, no `vh`, en vistas a pantalla completa.
4. **La bottom-nav es `position: fixed`** (solo <768px): no ocupa espacio de layout,
   hay que descontarla a mano o tapa el contenido.
5. **Geolocalización necesita contexto seguro**: solo `localhost` o `https`. Entrando
   por IP de LAN (`http://192.168.1.x:5173`) el navegador la deniega — no es un bug.
6. **El backend en Neon corta conexiones ociosas**: `apiGet` ya reintenta una vez ante
   500/408 transitorio. **Jamás reintentar un POST.**
7. Escapar HTML (`escapeHtml()`) antes de pintar texto que venga del backend.

---

## 4. Estado: hecho y verificado

Últimos commits en `test/full-integration` (del más nuevo al más viejo):

| Commit | Qué |
|---|---|
| `b781b4e` | Logos apuntando a `/icons/...` (evita 404 en producción) |
| `f523650` | Aviso de ubicación ya no se monta sobre búsqueda/filtros en móvil |
| `606e469` | Botones flotantes del mapa dejan de solaparse; alturas del contenedor corregidas |
| `7c3b37d` | Logo del footer con ruta absoluta |
| `7bb9d3d` | Header móvil deja de aplastar el menú de perfil |
| `fe2b305` | Ruta real por calles (OSRM) + fix del clic en la lista del mapa |
| `bdf17a7` | Merge: conexión completa de los 9 módulos al backend |

Todo lo anterior fue verificado midiendo geometría real en el navegador
(no a ojo) en 375×812 y en desktop, sin errores de consola.

---

## 5. Pendiente (el trabajo a hacer)

Ordenado por prioridad sugerida. **Verificar cada uno contra el código antes de
actuar**: algunos pueden haber cambiado.

### Alta
1. **Filtros de recompensas no funcionan** (`pages/rewards.js`, `services/reward.service.js`).
   Comprobar qué parámetros acepta `GET /recompensas` en Swagger y filtrar en servidor,
   no en cliente. Sincronizar nombres (`categoria_id`, no `categoria`).
2. **Modal de login sobrepuesto en la página de retos** (`pages/challenges.js`): al
   intentar unirse a un reto sin sesión, el modal aparece mal posicionado/encimado.
   Revisar `z-index`, centrado y bloqueo de scroll en `components/organism/modal.js`.
3. **Sesión/rol desde el backend, no desde localStorage**: queda uso de
   `localStorage['role']` en `utils/role.js`. La fuente de verdad debe ser
   `GET /users/me`. Actualizar `guards.js` y `router/router.js`. Redirigir a `/login` en 401.

### Media
4. **Rating `0.0`**: los POIs sin calificaciones muestran "0.0", que parece nota mala.
   Decidir con el usuario: ocultar el rating cuando no hay valoraciones.
5. **Enlaces del footer con `href=""`** (`components/organism/footer.js`): al tocarlos
   recargan la página. Apuntarlos a las vistas reales o marcarlos como no-enlace.
6. **Footer muy alto en móvil** (~707px): los 3 grupos de enlaces se apilan. Estética,
   no bug. Consultar antes de cambiar.
7. **Aviso del mapa en desktop**: queda 288×150 (estrecho y alto) por `shrink-to-fit`.
   No solapa nada. Estética.

### Bloqueado por backend
8. **Imágenes reales de retos y recompensas** (el usuario dijo que las cambia él):
   el backend no expone `imagen_url` ni una clave fija en el JSONB `configuracion`.
   Hay que acordarlo con el equipo backend antes de tocar el frontend.
9. **Descripciones de retos** desde `GET /retos` en vez de texto estático.
10. Peticiones abiertas al backend: `pool_pre_ping=True` en el pool; `PATCH`/`DELETE
    /challenges/{id}`; balance de puntos por usuario para el panel admin; parámetro
    `orden` en `GET /poi`.

### Sin verificar (requiere una persona)
11. **Trazado OSRM end-to-end**: la lógica está y el botón cableado, pero nadie ha
    confirmado visualmente que dibuje la línea (necesita permiso de ubicación real,
    en `localhost`). Probar: `/map` → tocar un lugar → "Iniciar Ruta".
12. Flujos autenticados: login → favorito → comentario → visita → dashboard → reto →
    canje. **El agente no debe crear cuentas ni escribir contraseñas**; pedírselo al usuario.
13. `TourPoints-Backend/scripts/seed_data.sql` sigue sin commitear en el repo del backend.

---

## 6. Cómo trabajar aquí

- **Medir, no suponer.** El pane de navegador de Claude Code **no captura pixeles
  fiables** (los screenshots salen en blanco), pero `javascript_tool` sí devuelve
  geometría y estilos computados. Para detectar solapes:
  `a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom`.
- Probar siempre en **375×812 y en desktop** antes de dar algo por bueno.
- Revisar consola (`read_console_messages`) tras cada cambio observable.
- Un commit por asunto, mensaje en inglés, y contarle al usuario qué se verificó
  y qué no. Ser explícito cuando algo queda sin comprobar.
