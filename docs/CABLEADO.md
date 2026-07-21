# Bitácora de cableado — frontend ⇆ backend real

> Cada módulo que pasa de mocks al backend desplegado es "un cable". Este
> documento registra cómo se conectó cada uno, paso a paso, para que el
> siguiente se conecte igual. El primero (auth) deja la receta.
>
> Backend staging: `https://tourpoints.159.54.176.254.nip.io` · Swagger en `/docs`
> · contrato real en `/openapi.json` (el `endpoints_api.md` ya quedó desfasado).

---

## La receta (destilada del cable 1)

1. **Leer `/openapi.json`, no el markdown.** El contrato escrito prometía rutas
   en español y un login que devolvía el usuario; lo desplegado usa `/users` y
   devuelve solo el token. La fuente de verdad es lo que responde el servidor.
2. **Decidir qué endpoints cubre el cable** y qué se queda esperando (auth no
   trae puntos: salen del ledger, que aún no existe).
3. **Escribir el adaptador** en el servicio: sus formas (español, ids, enums
   MAYÚSCULAS) → nuestro modelo. Las vistas no se enteran.
4. **Añadir el módulo a `API_MODULES`** en `config/api.js`, en el mismo commit
   que el servicio adaptado. Los demás módulos siguen en mocks.
5. **Conservar el fallback**: sin `VITE_API_URL`, el modo demo/mocks queda
   intacto. La app nunca depende de que el staging esté vivo.
6. **Verificar sin ensuciar**: probar los caminos de error contra el servidor
   real (un 401, un 422) demuestra el cable sin crear datos. El camino feliz
   que crea datos lo prueba una persona.
7. **Anotar aquí** las divergencias y preguntas que dejó el cable.

---

## Cable 1 · auth (2026-07-16) — rama `feature/auth-api-integration`

### Qué se conectó

| Flujo | Petición(es) | Nota |
|---|---|---|
| Login | `POST /auth/login` → guarda token → `GET /users/me` | El login desplegado devuelve solo `{access_token, token_type}`; el usuario se pide aparte |
| Registro | `POST /auth/register` → encadena el login | El register devuelve el usuario pero no el token |
| Logout | — (local) | Borra sesión, rol y token; no hay endpoint de logout |

### Los pasos, con sus archivos

1. **Infraestructura** (commit `feat(api): ...`):
   - `services/api.client.js` — nacen `apiPost/apiPatch/apiPut/apiDelete` sobre
     un `request()` común; el JWT viaja solo (`Authorization: Bearer`) y los
     errores conservan el `detail` de FastAPI dentro de `ApiError`.
   - `config/api.js` — **la puerta por módulo**: `isApiEnabled("auth")` exige
     URL *y* que el módulo esté en `API_MODULES`. Sin esto, definir la URL
     rompería Explora y el Mapa contra un `/poi` que no existe.
   - El token se guarda como `tourpoints:token`: con el prefijo, el borrado por
     `SEED_VERSION` también cierra la sesión del backend (la lección de `role`).
2. **El enchufe** (commit `feat(auth): ...`):
   - `services/auth.service.js` — rama API con adaptador `UsuarioResponse` →
     modelo del frontend; demo intacto como `else`.
   - `pages/auth/login.js` y `register.js` — piden contraseña solo en modo API
     y esconden las cuentas demo (en el servidor no existen).
   - `.env` (no versionado) con la URL del staging; `.env.example` documenta.

### Verificación (sin crear datos en su servidor)

- Credenciales falsas → **401 real** → "Email o contraseña incorrectos", sin
  sesión ni token residual.
- Email de dominio reservado en registro → **422 real** → el mensaje del
  servidor aparece en el formulario.
- Con la URL definida, Explora sigue sirviendo los 8 POIs de mocks → la puerta
  por módulo funciona.
- Sin `.env`, el modo demo entra con un clic de chip, como siempre.
- **Pendiente de humano**: el camino feliz (crear una cuenta real y entrar).
  Es un formulario: registrarse con un email real y comprobar que la sesión
  queda abierta y el header saluda.

### Divergencias asumidas (fuimos flexibles, como se acordó)

- Rutas en inglés (`/users/me`), aunque su doc diga `/usuarios`.
- Login sin `expires_in` ni `usuario` → se encadena `GET /users/me`.
- `PATCH /{id}/estado` no existe: son `POST .../activate` y `.../suspend`
  (importará al cablear el panel admin de usuarios).
- El formulario pide "Nombre completo" y el backend separa nombre/apellido:
  primera palabra = nombre, resto = apellido.

### 🐛 Bug reportado al backend (2026-07-16): el login crashea en el caso de éxito

Reproducido contra el staging con la primera cuenta real registrada desde el
frontend. La matriz lo acota sola:

| Email | Contraseña | Respuesta |
|---|---|---|
| inexistente | cualquiera | `401 {"detail":"Credenciales inválidas"}` |
| registrado | incorrecta | `401 {"detail":"Credenciales inválidas"}` |
| registrado | **correcta** | **`500 Internal Server Error`** (texto plano de uvicorn) |

Lectura: la fila existe y el hash verifica (los dos 401 lo prueban); el crash
ocurre **después** de la verificación — al emitir el JWT o construir la
respuesta. Sospechosos: `secret_key`/expiración mal configurados en el deploy,
o un campo inesperado en la fila (¿`rol_id` nulo si el register no lo
defaultea?). El traceback está en los logs de FastAPI del staging.

Consecuencia lateral: probablemente nadie había completado un login real en
ese despliegue. El registro sí persiste (por eso el frontend debe buscarse en
el **branch de Neon** al que apunte el `DATABASE_URL` del backend, no
necesariamente el que abre la consola por defecto).

### Preguntas abiertas para el equipo backend

1. **`rol_id` en el register público.** Su esquema desplegado lo acepta y su
   contrato dice que no debe enviarse. Nosotros **nunca** lo mandamos, pero si
   el servidor no lo ignora, cualquiera podría registrarse como admin. Deben
   confirmarlo/ignorarlo en servidor.
2. **Catálogo de roles.** `rol_id` es numérico y el DDL no lo precarga.
   Asumimos `1 = ADMIN` (`ADMIN_ROL_ID` en `auth.service.js`). Confirmar.
3. **Puntos del usuario.** No vienen en `/users/me`; hasta que exista
   `GET /puntos/me/saldo`, el frontend muestra 0 en modo API.
4. **Token de 60 min sin refresh.** Al expirar, el usuario tendrá que volver a
   entrar. Decisión de producto pendiente (ya estaba anotada en su contrato).

---

## Cables 2-9 · Conexión total (2026-07-18) — rama `feature/full-backend-connection`

El backend desplegó el MVP completo (77 rutas) y **corrió el seed de
`scripts/seed_data.sql`**: los POIs reales responden con los UUID sembrados.
Todos los módulos quedaron cableados. Registro por servicio:

### `poi.service` → `/poi` (+ `/poi-categories`)
- Lecturas públicas: lista con filtro `nombre`, detalle con imágenes ordenadas.
- **Geosearch del mapa**: `getPoisNearby()` manda `lat/lng/radio_metros` y cada
  POI vuelve con `distancia_metros` medida por PostGIS (verificado: Museo del
  Caribe a 0,21 km del centro). El Haversine local queda solo como fallback de
  mocks. El mapa re-pide al servidor cuando la geolocalización aterriza.
- "Abierto ahora" se calcula del JSONB `horarios` (cierra la decisión C2).
- Puntos del badge: espejo de `reglas_puntos` del seed (B1 sigue pendiente).
- Admin: crear encadena `submit-for-review` + moderación hasta el estado que
  pidió el formulario; estado vía `PATCH /moderation`; DELETE directo. La
  imagen del formulario no viaja (su endpoint recibe archivos, no URLs).
- Fix crítico incluido: la ruta `/poi/:id` solo aceptaba dígitos; los UUID
  reales caían al 404.

### `review.service` → `/poi/{id}/comments` + `/poi/{id}/my-rating`
- Un gesto del formulario = dos entidades suyas: `PUT my-rating` (idempotente)
  y `POST comments` (nace PENDIENTE → la vista avisa de la moderación).
- Los comentarios llegan sin estrellas (la calificación vive aparte): la
  tarjeta omite la fila en vez de pintar cinco estrellas vacías.
- Borrar → `DELETE /comments/{id}`. El control de duplicados es del servidor.

### `favorite.service` → `/favorites`
- `POST /favorites`, `DELETE /favorites/{poi_id}`, `GET /favorites/me`.
- Patrón nuevo: **caché en memoria con lectura síncrona** — los corazones se
  pintan en mitad de renders síncronos, así que las vistas llaman a
  `refreshMyFavorites()` al inicializar y leen la caché después. La caché se
  liga al usuario que la llenó (cambiar de cuenta la invalida sola).

### `visit.service` + `points.service` → `/visits`, `/visits/me/balance`, `/points/me/movements`
- Check-in GPS real: coordenadas + precisión → PostGIS valida contra el
  `radio_validacion` → VALIDADA acredita en el ledger. Un rechazo dice a
  cuántos metros estás (accionable). Los dos últimos `alert()` del flujo
  murieron reemplazados por el modal de la casa.
- El saldo **nunca** es columna: `user.points` pasa a ser caché de pintado que
  `refreshSessionPoints()` refresca al entrar a dashboard/recompensas/retos.
- El historial del dashboard usa el ledger real (canjes en rojo negativo).

### `challengeProgress` + `challenge.service` → `/challenges`
- Adaptador del modelo rico: `difficulty` deriva de `cantidad_requerida`
  (1=Fácil, 2-3=Medio, 4+=Difícil), `points` de la recompensa asociada,
  `deadline` del fin de vigencia, imagen fija por tipo (B3 pendiente).
- Progreso: `usuario_retos` (un intento por periodo) se proyecta al estado
  plano por reto — manda el intento más reciente. Misma caché síncrona.
- Transiciones: en-curso→`join`, disponible→`abandon`, completar→`progress`
  (el backend decide si con eso queda FINALIZADO **y acredita él los puntos**;
  el crédito manual quedó solo en modo mocks). Avance parcial se informa en el
  modal ("aún te faltan objetivos").
- ⚠️ Editar/borrar retos no tiene endpoint: degradan con aviso (pendiente).

### `reward.service` → `/rewards` + `/redemptions`
- El botón "Canjear" de la tarjeta existía **sin manejador**; ahora confirma
  contra el saldo real, `POST /redeem` (stock y puntos los descuentan sus
  triggers) y muestra el código `TP-CANJE-…` con su vencimiento en un modal.
- Los 409 de negocio (sin puntos / sin stock) salen con su mensaje literal.
- Hasta el listado exige sesión: la página invita a entrar si no la hay.
- Sin DELETE: la baja es `PATCH estado=INACTIVO`. Sin imagen/emoji/categoría
  en su modelo (B3): emoji genérico y las tarjetas viven bajo "Todos".

### `user.service` → `/users` (admin) + `PATCH /users/me` (perfil propio)
- CRUD admin con sus endpoints dedicados (`activate`/`suspend`, soft delete).
- "Editar perfil" del dashboard usa `PATCH /users/me`: el CRUD de `/users`
  daría 403 a una cuenta normal. La unicidad de email la valida el servidor.
- La columna de puntos del panel muestra 0: el saldo por usuario para admin
  no existe aún (anotado abajo).

### Infraestructura transversal
- `apiGetItems()` desenvuelve el sobre `{items,…}` de todas sus listas.
- Los GET reintentan **una** vez ante fallo transitorio: Neon cierra
  conexiones ociosas y su pool aún no lo detecta.

### Para el equipo backend (nuevo)
1. **`pool_pre_ping=True`** en el `create_engine`: los 500 intermitentes de
   "SSL connection has been closed unexpectedly" son conexiones zombis del
   pool tras el autosuspend de Neon. (El retry del frontend lo tapa en GET,
   pero los POST no se reintentan a propósito.)
2. Faltan `PATCH /challenges/{id}` y `DELETE` (el panel admin de retos no
   puede editar), la **imagen** de retos/recompensas (B3), y un saldo de
   puntos **por usuario** consultable por admin para el panel.
3. `GET /poi` sin `orden` sigue pendiente (B2): hoy el frontend ordena en
   cliente sobre las ~decenas de POIs; se caerá con cientos.

### Verificación pendiente de humano (flujos con sesión)
Yo no creo cuentas ni tecleo contraseñas: el camino feliz autenticado lo
cierra una persona con su cuenta real, en este orden (5 min):
login → corazón en Explora → pestaña Favoritos → detalle de POI: comentar
(aviso de moderación) → registrar visita (cerca/lejos del punto) → dashboard
(saldo y ledger) → Retos: unirse/avanzar → Recompensas: canjear y ver el QR.

Receta para lo que venga: los 7 pasos de arriba. Un módulo por rama, un
enchufe por commit.
