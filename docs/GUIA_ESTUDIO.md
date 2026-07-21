# Guía de estudio técnico — TourPoints

Preparación para preguntas técnicas de desarrollo (team leads / defensa del
proyecto). Cada módulo explica **qué se hizo, por qué se hizo así, dónde vive
en el código, y qué te pueden preguntar**. Está ordenado de arquitectura
general hacia lo más difícil de implementar (concurrencia, transacciones,
geoespacial).

## Cómo usar esto

- Cada referencia de archivo es real — ábrela y lee el código mientras
  repasas, no memorices la guía sola.
- Las secciones marcadas **"Pregunta probable"** son el entrenamiento real:
  tápate la respuesta y practica decirla en voz alta.
- Hay **una sola pieza sin verificar** en todo el documento, marcada
  explícitamente en el módulo 3: la consulta SQL exacta detrás de la búsqueda
  geoespacial. No encontré su código fuente en ninguna rama del repo backend
  (ver esa sección) — antes de citarla como "así está implementado" en una
  entrevista, confírmala con el compañero que la escribió.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Autenticación y autorización](#2-autenticación-y-autorización)
3. [Módulo: Mapa, geolocalización y trazado de rutas](#3-módulo-mapa-geolocalización-y-trazado-de-rutas)
4. [El ledger de puntos (append-only)](#4-el-ledger-de-puntos-append-only)
5. [La transacción de canje: concurrencia y bloqueos](#5-la-transacción-de-canje-concurrencia-y-bloqueos)
6. [Gamificación: retos, rachas e hitos](#6-gamificación-retos-rachas-e-hitos)
7. [Estados y moderación](#7-estados-y-moderación)
8. [Capa de servicios del frontend](#8-capa-de-servicios-del-frontend)
9. [Bugs reales encontrados y corregidos](#9-bugs-reales-encontrados-y-corregidos)
10. [Build, despliegue y configuración](#10-build-despliegue-y-configuración)
11. [Responsive y depuración de layout](#11-responsive-y-depuración-de-layout)
12. [Flashcards de repaso rápido](#12-flashcards-de-repaso-rápido)

---

## 1. Arquitectura general

**Qué es.** Frontend SPA en JavaScript vanilla (sin framework), servido con
Vite. Backend FastAPI en capas: `routers` (HTTP) → `services` (reglas de
negocio) → `repositories` (acceso a datos) → `models` (SQLAlchemy ORM).
PostgreSQL + PostGIS en Neon (serverless).

**Por qué vanilla JS y no React/Vue.** Decisión de aprendizaje del bootcamp:
entender el DOM, el ciclo de render y el enrutamiento sin la abstracción de
un framework. El costo es reimplementar a mano cosas que un framework da
gratis (diffing, reactividad) — el proyecto lo resuelve con un patrón simple:
cada vista expone una función que devuelve HTML como string (`pages/map.js`
→ `export function map()`) y una función `init` que engancha los eventos
después de insertarlo en el DOM (`router/router.js:49-66`).

**El router.** `src/router/router.js`. Usa la History API (`pushState`, sin
`#`). Dos tipos de rutas: estáticas (objeto `routes`, en `routes.js`) y
dinámicas (`dynamicRoutes`, con regex — p. ej. `/poi/([\w-]+)` para el
detalle de un POI). El guard de rol (`route.auth && !isAdmin()`) no muestra
un "acceso denegado": renderiza el mismo 404 que una ruta inexistente
(`router.js:43-47`). Es **seguridad por oscuridad a nivel de interfaz**: no
delata que la ruta `/admin/...` existe.

**Pregunta probable: "¿por qué el guard de rol muestra 404 y no 'no
autorizado'?"**
Para no confirmarle a un usuario no-admin que la ruta de administración
existe. Pero la respuesta completa (y la que un team lead espera) es: **esto
es cosmético**. La autorización real vive en el backend — cada endpoint
protegido valida el JWT y el rol server-side (`get_admin_user` en
`app/auth/dependencies.py`). El frontend solo evita mostrar una UI que de
todas formas el backend rechazaría.

**Capa de servicio con gate por módulo.** Ver módulo 8, es lo suficientemente
importante como para tener su propia sección.

---

## 2. Autenticación y autorización

**Dónde vive.** Backend: `app/auth/security.py`, `app/auth/dependencies.py`,
`app/routers/auth.py`. Frontend: `src/services/auth.service.js`,
`src/utils/role.js`.

**El flujo completo, paso a paso:**

1. `POST /auth/register` — crea el usuario con `bcrypt` (`passlib`), rol por
   defecto buscado por nombre (`Rol.nombre.ilike("usuario")`, con `2` como
   *fallback* hardcodeado si la tabla de roles no tiene esa fila).
2. `POST /auth/login` — busca el usuario por email, valida con
   `authenticate_user()`: si no existe, si `deleted_at` no es nulo, si
   `estado != "ACTIVO"`, o si la contraseña no coincide, lanza
   `CredentialsException` (401) **con el mismo mensaje genérico** en casi
   todos los casos — no filtra si el email existe o no.
3. Si todo pasa, arma un JWT con `create_access_token()`: claims `sub`
   (el UUID del usuario), `role` (`"admin"` si `rol_id == 1`, si no
   `"user"`), `status`, `iat`, `exp`.
4. El frontend guarda el token (`localStorage`, clave `tourpoints:token`,
   `api.client.js`) y lo adjunta como `Authorization: Bearer` en cada
   petición, automáticamente — los servicios nunca tocan cabeceras a mano.
5. En cada petición protegida, `get_current_user()` decodifica el JWT,
   busca el usuario en base de datos (**no confía ciegamente en el
   payload**, siempre revalida contra la fila real) y comprueba que siga
   activo.

**El detalle de bcrypt que vale la pena mencionar:**
```python
if len(password.encode("utf-8")) > 72:
    password = password[:72]  # bcrypt ignora bytes por encima de 72
```
bcrypt trunca internamente a 72 bytes — si no se trunca explícito antes,
dos contraseñas que difieren solo después del byte 72 producirían el mismo
hash sin que nadie lo note. Truncar a mano lo hace explícito en vez de
depender del comportamiento implícito de la librería.

**Dos formas distintas de decidir "es admin" — un detalle real, no un
error, pero da para una buena pregunta de arquitectura:**
- En `routers/auth.py:46`, al emitir el token: `"admin" if db_user.rol_id
  == 1 else "user"` — compara por **id numérico**.
- En `dependencies.py:49`, en `get_admin_user()`: `role.nombre.lower() !=
  "admin"` — compara por **nombre de rol**, con una consulta a la tabla
  `roles`.
- El frontend replica la primera convención: `ADMIN_ROL_ID` hardcodeado en
  `auth.service.js:38`.

**Pregunta probable: "¿qué pasa si alguien renombra el rol con id 1?"**
El login seguiría emitiendo `"role": "admin"` (compara por id), pero
`get_admin_user()` en cada endpoint protegido dejaría de reconocerlo como
admin (compara por nombre) — el usuario tendría un JWT que dice que es
admin, pero cada endpoint se lo negaría. Es un acoplamiento implícito entre
dos convenciones que deberían ser una sola fuente de verdad. Señalarlo así,
sin que se sienta como que estás criticando al equipo, es exactamente el
tipo de observación que un team lead quiere escuchar: que entendés el
código lo suficiente para ver dónde podría romperse.

**Guard del lado del cliente (`isAdmin()`):** lee
`localStorage.getItem("tourpoints:role") === "admin"`
(`utils/role.js:24`). El comentario en el propio archivo lo dice sin rodeos:
*"cualquiera puede escribir esta clave desde la consola. La autorización
real la aplicará el backend en cada endpoint."* — esa frase, dicha en una
entrevista, demuestra que entendés la diferencia entre **UX** y
**seguridad**.

---

## 3. Módulo: Mapa, geolocalización y trazado de rutas

Esta es la parte que más va a llamar la atención — combina tres piezas
técnicas distintas (Leaflet, PostGIS, OSRM) que resuelven **problemas
diferentes** aunque todas hablen de "distancia". Distinguirlas bien es lo
que separa una respuesta de junior de una de alguien que entiende el
dominio.

### 3.1 — Las dos nociones de "distancia" (la pregunta trampa más probable)

El proyecto usa **dos algoritmos de distancia distintos**, para dos cosas
distintas, y confundirlos es el error más fácil de cometer explicando esto:

| | Qué mide | Cómo | Dónde |
|---|---|---|---|
| **Distancia PostGIS** | Línea recta ("como vuela el pájaro") entre el usuario y cada POI, sobre la curvatura real de la Tierra | Tipo `geography` de PostGIS, no `geometry` | `GET /poi?lat&lng&radio_metros` → `distancia_metros` por POI |
| **Ruta OSRM** | Distancia caminando, siguiendo calles reales | Motor de ruteo sobre el grafo vial de OpenStreetMap | Leaflet Routing Machine, botón "Iniciar Ruta" |

**Pregunta probable: "¿por qué no calculan todo con Haversine en el
cliente?"**
Antes lo hacían (fallback que todavía existe en
`utils/poiFilter.js:calculateDistanceKm`, fórmula de Haversine manual). El
problema: Haversine en el cliente asume que **todos** los POIs ya están
descargados, y no escala — con miles de POIs habría que traer la ciudad
entera para filtrar por cercanía en el navegador. Al mover el cálculo a
PostGIS, el filtro por radio ocurre **en la base de datos**, y solo viajan
por la red los POIs que realmente están cerca. El cliente sigue teniendo el
Haversine como *fallback* para cuando el módulo `pois` corre en modo mock
(sin backend, ver módulo 8).

### 3.2 — `geography` vs `geometry` en PostGIS (el porqué técnico)

`app/models/poi.py:61`:
```python
ubicacion = Column(Geography(geometry_type="POINT", srid=4326, spatial_index=False), nullable=False)
```

PostGIS ofrece dos tipos para guardar coordenadas:
- **`geometry`**: trata las coordenadas como un plano cartesiano plano. Es
  rápido, pero calcular distancias reales requiere reproyectar a un sistema
  de coordenadas plano local (UTM, por ejemplo) — válido para un área
  pequeña, se distorsiona a escala de país o continente.
- **`geography`**: trata las coordenadas como puntos sobre la esfera
  terrestre (o el elipsoide WGS84 real). Las funciones de distancia
  (`ST_Distance`, `ST_DWithin`) devuelven **metros reales** sin reproyección
  manual, usando cálculos de gran círculo.

Para un catálogo de turismo con radios de búsqueda de kilómetros (el mapa
usa 30 000 m, `map.js:398`), `geography` es la elección correcta: precisión
real sin tener que elegir una proyección a mano. El costo es que las
operaciones son algo más caras en cómputo que sobre `geometry` — para el
volumen de datos de este proyecto, irrelevante.

`srid=4326` es el identificador estándar de WGS84 (el sistema de
coordenadas de GPS, lat/lng en grados decimales) — es el mismo que usa
`navigator.geolocation` en el navegador, así que no hace falta ninguna
conversión entre lo que entrega el GPS del usuario y lo que espera la base
de datos.

**El índice:** el modelo declara la columna con `spatial_index=False`, pero
`__table_args__` agrega explícitamente:
```python
Index("idx_poi_ubicacion", "ubicacion", postgresql_using="gist")
```
Un índice **GiST** (Generalized Search Tree) es la estructura que PostGIS
necesita para no recorrer la tabla entera en cada búsqueda por proximidad —
sin él, `ST_DWithin` sería un *sequential scan* comparando cada fila.

### 3.3 — El contrato del endpoint (verificado desde el consumidor)

`src/services/poi.service.js:132-153`:
```js
const items = await apiGetItems("/poi", {
  nombre: filters.query,
  lat: filters.lat,
  lng: filters.lng,
  radio_metros: filters.radiusM,
});
```
Cada POI en la respuesta trae `distancia_metros` cuando se manda
`lat`/`lng`, además de `calificacion_promedio`, `total_calificaciones`, y
objetos anidados `categoria` y `ciudad` (no solo sus ids sueltos — el
backend ya hace el join). El frontend convierte metros a kilómetros
(`p.distancia_metros / 1000`) y respeta esa distancia sobre cualquier
cálculo local (`map.js:450-453`).

> ⚠️ **Lo que no pude verificar:** el código fuente exacto de este endpoint
> (`GET /poi`) no está en ninguna rama del repositorio backend a la que
> tengo acceso — todos los `app/routers/poi.py` que revisé (`main`,
> `develop`, y cada `feature/*`) son un `TODO` sin implementar, o un archivo
> vacío. El servidor desplegado sí lo tiene funcionando (lo comprobé en vivo:
> 9 POIs con distancias reales calculadas). El patrón esperado con PostGIS
> para este contrato sería algo como:
> ```sql
> SELECT *, ST_Distance(ubicacion, ST_MakePoint(:lng, :lat)::geography) AS distancia_metros
> FROM poi
> WHERE ST_DWithin(ubicacion, ST_MakePoint(:lng, :lat)::geography, :radio_metros)
>   AND estado = 'APROBADO'
> ORDER BY distancia_metros;
> ```
> Antes de presentar esto como "así está hecho" en una entrevista, pídele al
> compañero de backend que te confirme la consulta real — lo que sí podés
> afirmar con seguridad es el **contrato** (parámetros de entrada, forma de
> la respuesta) y el **tipo de dato** (`geography`, verificado en el modelo).

### 3.4 — Leaflet: el mapa interactivo

`src/pages/map.js`. Biblioteca cargada por **CDN** en `index.html` (no por
npm) — `leaflet@1.9.4`. Piezas clave:

- **Marcadores personalizados** con `L.divIcon`: en vez del pin por defecto
  de Leaflet, se inyecta HTML/CSS propio (`marker-pin-bubble`, coloreado por
  categoría) para que el pin se vea como el resto del diseño.
- **Un solo `L.layerGroup()`** (`markersGroup`) contiene todos los pines de
  POIs; se limpia y se repuebla entero (`clearLayers()`) cada vez que
  cambian los filtros, en vez de mutar marcadores individuales — más simple
  de razonar, aunque menos eficiente que un diffing fino. Para el volumen
  de POIs del proyecto (decenas, no miles), es la decisión correcta: la
  complejidad de un diff no se justifica.
- **`markersByPoiId`** es un `Map()` que traduce `id de POI → marcador de
  Leaflet`, para poder centrar el mapa y abrir el popup correcto al hacer
  clic en la lista lateral. Las claves se guardan como **string**
  explícitamente — ver el bug real en el módulo 9, sección "UUID vs
  Number", que rompía justo esto.

### 3.5 — Geolocalización del navegador

`requestUserLocation()` en `map.js`. Dos verificaciones antes de siquiera
pedir el permiso:

```js
if (!navigator.geolocation) { /* API no soportada */ }
if (!window.isSecureContext) { /* aviso: necesita https o localhost */ }
```

**Pregunta probable: "¿por qué falla la geolocalización en el celular si
uso la IP de la red local (`192.168.x.x:5173`)?"**
Porque `navigator.geolocation.getCurrentPosition` requiere un **contexto
seguro**: `https://` o `localhost` exactamente. Una IP LAN por `http://` no
califica, aunque esté en la misma red — el navegador la deniega sin
preguntar, sin importar qué tan bien esté escrito el resto del código. Es
una decisión de seguridad del navegador, no un bug de la app (se comprobó y
documentó explícitamente en el desarrollo del proyecto).

`enableHighAccuracy: false` a propósito — precisión alta agota tiempo
fácil en desktop sin GPS real y no aporta diferencia perceptible a la
escala de "qué tan lejos está este museo".

### 3.6 — Leaflet Routing Machine + OSRM: el trazado de la ruta real

Este es probablemente el punto técnico más impresionante del proyecto si se
explica bien, porque implica entender **qué es un motor de ruteo** y por
qué no es lo mismo que "dibujar una línea entre dos puntos".

**El problema que resuelve:** una línea recta entre el usuario y un museo
puede atravesar edificios, un río, o una autopista. Un motor de ruteo como
**OSRM (Open Source Routing Machine)** calcula el camino real siguiendo el
grafo de calles de OpenStreetMap — nodos (intersecciones) y aristas (tramos
de calle), con un algoritmo tipo Dijkstra/Contraction Hierarchies para
encontrar el camino más corto/rápido según el perfil elegido.

**La integración**, `map.js`, función `toggleRoute()`:
```js
routingControl = L.Routing.control({
  waypoints: [L.latLng(userCoords.lat, userCoords.lng), L.latLng(target.lat, target.lng)],
  router: L.Routing.osrmv1({
    serviceUrl: "https://router.project-osrm.org/route/v1",
    profile: "foot",
  }),
  ...
});
```

- **`profile: "foot"`** — le pide a OSRM el grafo peatonal, no el vehicular:
  respeta calles peatonales, no obliga a seguir el sentido de una vía de un
  solo sentido para autos, etc. Elegirlo mal (dejar el perfil por defecto,
  `driving`) habría trazado rutas que un turista a pie no puede seguir.
- **`createMarker: () => null`** — la librería por defecto pinta sus
  propios marcadores de origen/destino; se anulan porque el mapa ya tiene
  los suyos (el pin de usuario con pulso, los pines de categoría), y tener
  dos capas de marcadores superpuestas se ve roto.
- **`show: false`** — Leaflet Routing Machine también inyecta un panel de
  indicaciones paso a paso (tipo Google Maps) que no encaja en el diseño;
  se oculta con CSS (`.leaflet-routing-container { display: none; }`) y se
  reemplaza por un botón propio con dos estados ("Iniciar Ruta" /
  "Quitar ruta").
- **`routeWhileDragging: false`, `addWaypoints: false`,
  `draggableWaypoints: false`** — la ruta es fija origen→destino; no se
  permite al usuario arrastrar puntos intermedios (una feature que Leaflet
  Routing Machine trae por defecto, pensada para apps de logística, no para
  este caso de uso).

**Pregunta probable: "¿qué pasa si OSRM no responde?"**
El código engancha `routingerror`: limpia el control de ruta y muestra el
mismo aviso que se usa para errores de geolocalización, en vez de dejar el
botón colgado en "Trazando…" para siempre. Es importante mencionar la
limitación real: **se usa el servidor público de demostración de OSRM**
(`router.project-osrm.org`), que tiene límite de peticiones y ninguna
garantía de disponibilidad — para producción, la respuesta correcta es
"habría que levantar una instancia propia de OSRM" (es software libre,
se puede self-hostear con los datos de OpenStreetMap de Colombia).

**Selección del destino:** si el usuario no tiene ningún POI
seleccionado/abierto, la ruta se traza al **más cercano** de la lista ya
filtrada (`filteredPois[0]`, que está ordenada por distancia cuando hay
ubicación — ver 3.1). Si abrió un popup, ese POI queda marcado como
`selectedPoiId` y la ruta apunta ahí en su lugar.

### 3.7 — Responsive del mapa: el bug real que se corrigió

Vale la pena mencionarlo porque es un ejemplo concreto de depuración con
evidencia, no "a ojo": los botones flotantes ("Iniciar Ruta" y "centrar en
mi ubicación") estaban ambos anclados a `right: 1rem` con `bottom` casi
idéntico, y se solapaban en móvil. Se diagnosticó **midiendo geometría real
del DOM** (`getBoundingClientRect()` de cada botón, comprobando
intersección de rectángulos) en vez de "verse mal" a ojo — y se encontró un
segundo bug de paso: el contenedor del mapa asumía una altura de header
que no coincidía con la real, y no restaba la barra de navegación inferior
(`position: fixed`), así que ~72px de mapa quedaban tapados. La solución
final usa variables CSS centralizadas (`--header-h`, `--bottom-nav-h`, esta
última con `env(safe-area-inset-bottom)` para no volver a romperse en un
iPhone con barra de gestos) y `dvh` en vez de `vh` para que la barra de
direcciones móvil, al aparecer/desaparecer, no recorte el mapa.

---

## 4. El ledger de puntos (append-only)

**Dónde vive.** `app/models/movimiento_puntos.py`.

**La decisión central:** el saldo de puntos de un usuario **no es una
columna**. Nunca se guarda "usuarios.puntos = 350" en ninguna tabla. En su
lugar, cada evento que suma o resta puntos (una visita validada, una
compra, completar un reto, un canje) inserta una **fila nueva** en
`movimientos_puntos`, y el saldo se calcula al leer con
`SUM(puntos)` a través de una vista (`saldo_puntos_usuario`, según el
comentario en el propio modelo — no está en el ORM porque es de solo
lectura, se consulta con SQL directo).

**Pregunta probable: "¿por qué no simplemente un campo `saldo` que se
actualiza con cada operación?"**
Tres razones, y es la respuesta que un team lead quiere escuchar completa:

1. **Auditoría.** Con un campo mutable, perdés el historial: no podés
   responder "¿de dónde salieron estos 300 puntos?" seis meses después. Con
   el ledger, cada punto tiene una fila que dice exactamente qué lo generó.
2. **Concurrencia.** Si dos operaciones intentan `UPDATE usuarios SET
   puntos = puntos - X` al mismo tiempo, hay ventana para condiciones de
   carrera si no se maneja con cuidado (locks, transacciones aisladas). Un
   `INSERT` en una tabla append-only no tiene ese problema: cada fila es
   independiente, no hay "el valor viejo" que dos transacciones puedan
   pisarse.
3. **Reconstrucción.** El saldo siempre se puede recalcular desde cero
   sumando el historial. Un campo mutable, si se corrompe, no tiene forma
   de reconstruirse.

**El truco del `tipo_movimiento` computado:**
```python
tipo_movimiento: Mapped[TipoMovimientoPuntos] = mapped_column(
    tipo_movimiento_puntos_enum,
    Computed("""
        CASE
            WHEN visita_id IS NOT NULL THEN 'VISITA'::tipo_movimiento_puntos_enum
            WHEN compra_id IS NOT NULL THEN 'COMPRA'::tipo_movimiento_puntos_enum
            WHEN usuario_reto_id IS NOT NULL THEN 'RETO'::tipo_movimiento_puntos_enum
            WHEN canje_id IS NOT NULL THEN 'CANJE'::tipo_movimiento_puntos_enum
        END
    """, persisted=True),
)
```
Es una **columna generada** por Postgres, no algo que la aplicación escriba.
Se combina con un `CHECK` en el modelo:
```python
CheckConstraint("num_nonnulls(visita_id, compra_id, usuario_reto_id, canje_id) = 1")
```
que obliga a que **exactamente una** de las cuatro columnas de origen tenga
valor — nunca cero, nunca dos. Esto es un patrón de "unión etiquetada"
(*tagged union*) implementado a nivel de base de datos: en vez de confiar en
que el código de la aplicación siempre setee `tipo_movimiento` correctamente
(y que nunca se desincronice con cuál FK está lleno), la base de datos lo
deriva sola y lo garantiza con una restricción. Es imposible insertar una
fila inconsistente, sin importar qué bug tenga el backend.

---

## 5. La transacción de canje: concurrencia y bloqueos

**Dónde vive.** `app/services/recompensas_service.py`, método `canjear()`.
Es, con diferencia, la lógica más delicada del backend — el propio código
lo advierte en un comentario: *"Orden estricto (no reordenar)"*.

**El problema que resuelve:** un usuario canjea una recompensa por puntos.
Hay que verificar que tenga saldo suficiente, descontar el stock de la
recompensa, y registrar el movimiento negativo — **todo o nada**, y sin que
dos canjes simultáneos del mismo usuario (o de la misma recompensa con poco
stock) puedan dejar el sistema en un estado inconsistente (saldo negativo,
o vender más unidades de las que hay en stock).

**Los siete pasos, en el orden exacto que exige el código:**

1. **Lock consultivo (`pg_advisory_xact_lock`) por `usuario_id`.** Serializa
   *todos* los canjes de ese usuario (de cualquier recompensa) durante la
   transacción. Es la pieza que evita que dos canjes concurrentes del mismo
   usuario lean el mismo saldo "antes" de que el primero lo descuente.
2. **Lock de fila sobre la recompensa** (`obtener_con_lock`, un
   `SELECT ... FOR UPDATE` típico). Ahora sí es seguro leer
   `recompensa.puntos` sabiendo que nadie más la está modificando a la vez.
3. Si el estado no es `APROBADO`, o el stock es `<= 0`, aborta antes de
   tocar nada.
4. **Valida el saldo** contra la vista (`SUM(puntos)`, ver módulo 4). Si es
   menor al costo, `PuntosInsuficientesError`.
5. Genera el código QR y calcula `fecha_expira` (30 días) con **un solo
   timestamp** (`ahora = datetime.utcnow()`) usado tanto para `created_at`
   como para el cálculo de expiración — el comentario explica por qué: para
   que ambos campos sean consistentes entre sí, en vez de confiar en el
   `DEFAULT` de la columna (que se resolvería en un microsegundo distinto).
6. **Inserta el canje.** Aquí hay un trigger de base de datos que descuenta
   el stock automáticamente; si el stock ya estaba en 0 en ese instante
   exacto, el trigger lanza una excepción SQL, la transacción se aborta, y
   el código captura eso y lo traduce a `SinStockError` (con
   `rollback()` explícito antes de propagar el error).
7. **Inserta el movimiento negativo** de puntos (`-recompensa.puntos`) y
   hace **commit** — recién aquí la transacción completa queda persistida.

**Pregunta probable: "¿por qué el lock de usuario primero y el de
recompensa después, y no al revés?"**
Si se invirtiera el orden (lock de recompensa primero, luego de usuario),
dos transacciones que canjean *recompensas distintas* pero pertenecen al
*mismo usuario* podrían bloquearse una a la otra en orden distinto —
la receta clásica de un **deadlock**. Bloquear siempre primero por
`usuario_id` (con un lock consultivo, más liviano que un lock de fila) y
después por la fila de la recompensa, en ese orden fijo, garantiza que
nunca haya una espera circular.

**Pregunta probable: "¿por qué no descontar el stock desde Python en vez de
un trigger?"**
Es una decisión de diseño discutible, y está bien decirlo así en una
entrevista — mostrar que ves el trade-off es mejor que fingir que es la
única respuesta correcta. Hacerlo en un trigger significa que **cualquier**
inserción en `canjes` (desde donde sea, no solo desde este endpoint)
respeta la regla de stock automáticamente — más difícil de saltarse por
accidente. La contra: la lógica de negocio queda repartida entre Python y
SQL, lo que hace más difícil de rastrear para alguien que lee solo el
código de la aplicación.

---

## 6. Gamificación: retos, rachas e hitos

**Dónde vive.** `app/models/gamificacion.py`.

**El modelo de "intentos" (`usuario_retos`).** Un reto (`retos`) es la
definición general ("visita 3 museos este mes"); `usuario_retos` es **cada
intento concreto** de un usuario sobre ese reto, con su propia ventana de
tiempo (`periodo_inicio`/`periodo_fin`) y `numero_intento`. Esto es lo que
permite que un reto **recurrente** (`recurrencia: DIARIA | SEMANAL |
MENSUAL`) se pueda "reiniciar" cada período sin crear una fila nueva en
`retos` cada vez — el reto es uno solo, los intentos se multiplican.

Un índice único parcial refuerza la regla de negocio a nivel de base de
datos, no solo en el código:
```python
Index("idx_usuario_retos_intento_activo", "usuario_id", "reto_id", "periodo_inicio",
      unique=True, postgresql_where=text("estado = 'ACTIVO'"))
```
Solo puede haber **un intento `ACTIVO`** por usuario+reto+período a la vez
— si el backend tuviera un bug y intentara crear un segundo intento activo
en paralelo, la base de datos lo rechazaría aunque el código no lo hubiera
previsto.

**`progreso` como JSONB en vez de columnas fijas.** Un reto de tipo
`VISITA` progresa distinto a uno de tipo `RECORRIDO` (una secuencia
ordenada de POIs) o `COMPRA`. En vez de tener columnas separadas para cada
tipo de progreso posible (la mayoría quedarían `NULL` según el tipo),
`progreso` guarda una estructura flexible
(`{"completados": [...], "cantidad": 0}` por defecto). El costo de esto:
Postgres no puede validar la forma del JSON con un `CHECK` tan fácilmente
como con columnas tipadas — la validación de forma queda del lado de la
aplicación.

**Rachas e hitos.** `rachas_retos` lleva `racha_actual`/`racha_maxima` por
usuario+reto. `hitos_racha` define umbrales ("racha de 7 días seguidos =
bono"), y `hitos_racha_alcanzados` registra cuándo un usuario cruzó ese
umbral. El campo `recompensa_otorgada` es booleano, no automático: el
comentario en el modelo dice que un trigger (`fn_otorgar_recompensa_hito`)
decide si hubo stock disponible para entregar el premio — es decir, **el
logro se registra siempre**, pero el premio físico depende de si quedaba
stock; el usuario no pierde el reconocimiento de la racha por un problema
de inventario. Es una decisión de UX razonada a nivel de esquema.

---

## 7. Estados y moderación

Un patrón que se repite en casi cada entidad con contenido generado por
usuarios: `PENDIENTE → APROBADO / RECHAZADO`. Vale la pena nombrarlo como
patrón reconocido, no como una casualidad que se repite:

| Entidad | Enum de estado |
|---|---|
| `poi` | `BORRADOR, PENDIENTE, APROBADO, RECHAZADO, INACTIVO` |
| `comentarios` | `PENDIENTE, APROBADO, RECHAZADO` |
| `visitas` | `PENDIENTE, VALIDADA, RECHAZADA` |
| `retos` | `BORRADOR, ACTIVO, FINALIZADO, CANCELADO` |
| `canjes` | `PENDIENTE, REDIMIDO, EXPIRADO` |
| `establecimientos` | mismo enum que `poi` |

**Por qué importa:** el listado público siempre filtra a un solo estado
"visible" (`APROBADO` para POIs y comentarios, por ejemplo — ver
`recompensas.py:listar()`, `solo_aprobado` fuerza `estado = "APROBADO"`
para usuarios no-admin), mientras el panel de administración puede ver y
cambiar cualquier estado. Es el mismo mecanismo en todos los dominios:
**contenido generado por usuarios nace no-visible hasta que alguien con
permiso lo aprueba**, y quién puede ver qué estado depende del rol, no de
un flag distinto por endpoint.

Un ejemplo concreto en el frontend: `review.service.js` — publicar una
reseña hace **dos** llamadas (`PUT /poi/{id}/my-rating`, idempotente, y
`POST /poi/{id}/comments`, que nace `PENDIENTE`), y la vista avisa
explícitamente al usuario que su comentario queda en moderación en vez de
aparecer al instante — la UI no miente sobre lo que acaba de pasar.

---

## 8. Capa de servicios del frontend

**El patrón central: un servicio por dominio, nunca `fetch` directo desde
una vista.** `src/services/*.service.js`. Cada uno adapta la forma del
backend (campos en español, UUIDs, sobres `{items, total}`) a la forma que
las vistas consumen — si el backend cambia un nombre de campo, se arregla
en un solo archivo, no en cada página que lo usaba.

**El gate por módulo — la pieza que hizo posible construir todo el frontend
antes de que el backend estuviera completo.** `src/config/api.js`:
```js
export const API_MODULES = new Set(["auth", "pois", "reviews", "favorites",
  "visits", "points", "challenges", "rewards", "users"]);
```
Cada servicio pregunta `isApiEnabled("<módulo>")` antes de decidir a dónde
ir. Con `VITE_API_URL` sin definir, o con el módulo fuera de la lista, cae a
`localStorage` con datos semilla de `src/mocks/`. Este es un patrón
**adaptador/repositorio** de manual: la vista programa contra una interfaz
estable (`getPois()`, `createReview()`...) sin saber ni importarle si detrás
hay una API real o `localStorage`.

**Pregunta probable: "¿por qué no usar directamente `fetch` en cada
página?"**
Dos razones concretas, con evidencia en el propio proyecto: (1) permitió
construir y probar la interfaz completa **antes** de que cada endpoint del
backend estuviera listo, cableando módulo por módulo a medida que su
contrato quedaba definido (documentado en `docs/CABLEADO.md`, con un commit
por módulo); (2) cuando apareció un bug real de contrato — el endpoint de
reseñas cambió de `/redeem` a `/canjear` (ver módulo 9) — el arreglo fue
**una línea en un archivo**, no una búsqueda de todos los lugares donde se
llamaba a ese endpoint.

**El cliente HTTP central** (`api.client.js`): adjunta el JWT
automáticamente, y `apiGet` reintenta **una sola vez** ante un error
transitorio (500/408/`TypeError` de red) — nunca en `POST`, porque no es
idempotente. La razón documentada: Neon (Postgres serverless) cierra
conexiones ociosas, y la primera petición tras un rato de inactividad
puede morir con un error de conexión SSL cerrada antes de que el pool lo
detecte — el retry absorbe ese caso puntual sin enmascarar errores reales.

---

## 9. Bugs reales encontrados y corregidos

Esta sección es material de entrevista tan bueno como cualquier otra —
"encontré esto, entendí por qué pasaba, y lo arreglé" demuestra más
dominio que explicar una feature que nunca se rompió.

### UUID comparado como `Number`

`map.js`, la lista lateral de POIs cercanos. El código original hacía
`focusPoi(Number(item.dataset.poiId))`. Mientras los ids eran numéricos
(modo mock), funcionaba. Al conectar el backend real, los ids pasaron a ser
**UUID** (`"b0000000-0000-4000-8000-..."`), y `Number("b0000000-...")` da
`NaN`. El resultado: tocar un lugar de la lista no hacía nada, **sin ningún
error en consola** — `Array.find(item => item.id === NaN)` simplemente no
encuentra nada, `NaN !== NaN` siempre. Arreglo: comparar como string en
todos los puntos (`String(item.id) === String(poiId)`), no forzar a número.
**Lección:** un fallo silencioso (sin excepción) es más peligroso que uno
ruidoso — este pasó desapercibido hasta que alguien probó el clic a mano.

### Endpoint de canje equivocado

`reward.service.js` llamaba a `POST /rewards/{id}/redeem`. El router real
del backend expone `POST /rewards/{id}/canjear`
(`app/routers/recompensas.py:72`). Cada intento de canje habría devuelto
**404** — el flujo de dinero de toda la app estaba roto, y no se habría
notado hasta que alguien intentara canjear de verdad. Se encontró leyendo
el router real, no por un reporte de error.

### Filtros de categoría que no podían funcionar

Los filtros de la vista de recompensas (`Restauración`, `Alojamiento`...)
venían de una categoría **que solo existía en los datos de ejemplo**. El
modelo real de `recompensas` no tiene columna de categoría ni la hereda de
ningún POI asociado (`RecompensaOut` no anida el POI, solo trae su id
suelto). Contra la API real, toda recompensa llegaba con
`category: undefined`, así que cualquier filtro que no fuera "Todas"
mostraba la lista vacía. El mismo problema existía, aún peor, en el panel
de administración: el campo "Categoría" del formulario era **obligatorio**,
y se descartaba en silencio al guardar (`toBackendReward()` nunca lo
mandaba al backend). Arreglo: se reemplazaron los filtros por dos que usan
datos que sí existen en cualquier recompensa real (`stock > 0`,
`pointsCost <= saldo del usuario`), y se quitó el campo fantasma del admin.

### `0.0` en vez de "sin calificar"

Un POI sin ninguna calificación mostraba "⭐ 0.0" — se lee como una mala
nota, no como ausencia de datos. La base para el arreglo: una calificación
real **nunca puede ser 0** (`calificaciones.calificacion` tiene un
`CHECK (calificacion BETWEEN 1 AND 5)`), así que `rating === 0` es una
señal inequívoca de "todavía no tiene ninguna", sin necesidad de un campo
extra de conteo. Se centralizó en un helper (`formatRating()`) para no
repetir la condición en los cuatro lugares donde se pinta un rating.

### Rutas relativas que solo funcionaban por casualidad en desarrollo

El logo y el favicon usaban rutas como `./public/icons/...`. En Vite dev
funcionaba porque el servidor sirve la raíz del proyecto sin importar la
ruta actual del navegador — pero Vite **copia el contenido de `public/` a
la raíz** al compilar (`vite build`), así que en producción la ruta
correcta es `/icons/...`, no `/public/icons/...`. Y por ser **relativas**
(`./...`), en cualquier ruta anidada como `/poi/<id>` resolvían contra
`/poi/` en vez de la raíz del sitio, mostrando una imagen rota. Dos bugs
en una sola línea: ruta relativa (rompe en rutas anidadas) apuntando a un
directorio que no sobrevive al build (rompe siempre en producción).

---

## 10. Build, despliegue y configuración

**`netlify.toml` versionado, no configuración del panel.** Define
`base`/`command`/`publish` (el frontend vive en un subdirectorio del repo,
no en la raíz), `NODE_VERSION` (fijado porque `package.json` exige
`>=24`), y la variable `VITE_API_URL`. Filosofía: el despliegue debe poder
reconstruirse desde un commit, no depender de un ajuste hecho a mano en una
interfaz web que nadie más puede ver ni auditar.

**Por qué `VITE_API_URL` va en el build y no en runtime.** Vite **hornea**
las variables `VITE_*` dentro del JavaScript compilado en el momento del
build — no son leídas del entorno del servidor en cada petición, como sí
pasaría en un backend. Sin definirla en `netlify.toml`,
`isApiConfigured()` daría `false` en el sitio desplegado y la app entera
se serviría con datos mock, en silencio, sin ningún error visible.

**El fallback de SPA (`[[redirects]] from="/*" to="/index.html"
status=200`).** El router resuelve rutas como `/map` **en el navegador**;
no son archivos reales en el servidor. Sin esta regla, recargar la página
en `/map` (F5, o compartir un enlace directo) hace que Netlify busque un
archivo llamado `map` y devuelva su propio 404 antes de que el router del
frontend llegue a ejecutarse. El `status: 200` es lo que lo convierte en
una **reescritura** (*rewrite*) en vez de una redirección: sirve
`index.html` pero conserva la URL en la barra de direcciones — con
`301`/`302` el navegador saltaría a `/` y se perdería la ruta que el
usuario quería ver.

---

## 11. Responsive y depuración de layout

Un principio de proceso, no solo de CSS, que vale la pena poder explicar:
**medir, no adivinar**. Los solapamientos de UI en móvil no se
diagnosticaron mirando capturas — se verificaron con
`getBoundingClientRect()` de cada elemento y una función de intersección de
rectángulos (`a.left < b.right && b.left < a.right && ...`), comparando
antes/después del arreglo con números reales del DOM. El mismo método
destapó que el contenedor del mapa asumía una altura de header equivocada
en dos vistas distintas (móvil y escritorio, con números distintos cada
una) — un error que "se ve mal" no habría explicado por qué, pero medir el
`bottom` del contenedor contra el `top` de la barra de navegación sí.

`env(safe-area-inset-bottom)` en la altura de la barra de navegación
inferior: reserva el espacio que ocupa la barra de gestos de un iPhone
moderno, para que la barra de navegación de la app no quede parcialmente
tapada por el sistema operativo. `dvh` (*dynamic viewport height*) en vez
de `vh` en las vistas a pantalla completa: en móvil, la barra de
direcciones del navegador aparece y desaparece al hacer scroll, cambiando
la altura visible real — `vh` fija se calcula con la barra colapsada y dejaba
contenido cortado cuando aparecía.

---

## 12. Flashcards de repaso rápido

Preguntas cortas, para repasar rápido antes de la defensa. Tapate la
respuesta.

- **¿Por qué `geography` y no `geometry` en PostGIS?** → Cálculo de
  distancia real en metros sobre la esfera terrestre sin reproyectar a mano;
  correcto a la escala de kilómetros que usa el mapa.
- **¿Qué diferencia hay entre la distancia que muestra la lista de POIs y
  la que traza el botón "Iniciar Ruta"?** → Línea recta (PostGIS,
  `ST_Distance`/`ST_DWithin`) vs. ruta real caminando por calles (OSRM,
  grafo vial de OpenStreetMap).
- **¿Por qué el saldo de puntos no es una columna?** → Auditoría (cada
  punto tiene una fila que explica de dónde vino), evita condiciones de
  carrera en updates concurrentes, y es reconstruible desde el historial.
- **¿Qué garantiza que un movimiento de puntos tenga exactamente un
  origen?** → Un `CHECK (num_nonnulls(...) = 1)` a nivel de base de datos,
  no solo validación en el código de la aplicación.
- **¿Por qué el canje bloquea primero por usuario y después por
  recompensa?** → Un orden fijo de adquisición de locks evita deadlocks
  entre transacciones concurrentes.
- **¿Dónde vive la autorización real, frontend o backend?** → Backend,
  siempre. El guard del router (`isAdmin()`) es cosmético — lee
  `localStorage`, cualquiera puede falsificarlo desde la consola.
- **¿Por qué `VITE_API_URL` tiene que estar en el build de Netlify y no
  alcanza con ponerla en tiempo de ejecución?** → Vite hornea las
  variables `VITE_*` en el JavaScript compilado durante el build; no se
  leen del entorno en cada petición.
- **¿Por qué recargar `/map` con F5 rompía sin el `_redirects`/rewrite de
  Netlify?** → El router resuelve rutas en el navegador; el servidor no
  tiene un archivo llamado `map`, así que sin la regla de reescritura
  devuelve su propio 404 antes de que el JS del router se ejecute.
- **Dame un ejemplo real de bug de tipos en este proyecto.** → Comparar un
  UUID con `Number()`: da `NaN`, y `NaN !== NaN`, así que el `find()` nunca
  encuentra el elemento — sin ningún error en consola.
