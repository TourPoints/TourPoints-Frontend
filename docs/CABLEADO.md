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

## Próximos cables, en orden de encendido

| # | Cable | Endpoints que esperamos | Qué enciende |
|---|---|---|---|
| 2 | `users` (panel admin) | `GET /users`, `PATCH /users/{id}`, `activate/suspend`, `DELETE` | Gestión de usuarios real |
| 3 | `pois` | `GET /poi`, `GET /poi/{id}` (+ `puntos_visita` y `orden` pedidos) | Portada, Explora y Mapa con datos reales |
| 4 | `favoritos`, `comentarios`, `calificaciones` | según su contrato | Detalle de POI completo |
| 5 | `retos` + `visitas` + `puntos` | inscripción, check-in GPS, saldo | La gamificación de verdad |

Receta: los 7 pasos de arriba. Un módulo por rama, un enchufe por commit.
