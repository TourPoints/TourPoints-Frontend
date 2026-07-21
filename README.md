# TourPoints

**Gamified tourism for Barranquilla, Colombia.**

TourPoints is a Single Page Application (SPA) that turns exploring the city
into a game: users discover Points of Interest (POIs), complete challenges,
earn points, and redeem them for rewards at local partners. Built for
tourists and locals who want to rediscover Barranquilla, and for the
businesses that want to reach them.

A training project built within **[Riwi](https://riwi.io)**.

[TODO: badges — build status, Node version, license, coverage, etc.
Example format once defined:
`![Build](https://img.shields.io/badge/build-passing-brightgreen)`]

---

## Table of contents

- [Team](#team)
- [Key features](#key-features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Database relational model](#database-relational-model)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Local setup](#local-setup)
- [Project structure](#project-structure)
- [Available scripts](#available-scripts)
- [Git workflow and branching](#git-workflow-and-branching)
- [Contributing](#contributing)
- [MVP](#mvp)
- [Project management tools](#project-management-tools)
- [Roadmap and known limitations](#roadmap-and-known-limitations)
- [License](#license)

---

## Team

A cohort of 6, trained by Riwi:

- Nicolás Guarín
- Juan Henríquez
- Alejandro Escobar
- Lyan Páez
- Isaac Guzmán
- Stevens Herrera

[TODO: let me know if anyone's name/surname needs correcting, or if you'd
like each person's role listed (frontend, backend, QA, etc.).]

---

## Key features

- **Explore and interactive map** — a catalog of Barranquilla POIs with
  category filters, search, and a map (Leaflet) that draws real distance and
  a walking route from the user's location to each place (OSRM).
- **Challenges** — quests the user joins, tracks, and completes to earn
  points.
- **Points and rewards system** — points accrue in a ledger per visit/
  challenge and are redeemed for partner rewards, with a QR redemption code.
- **Favorites** — save POIs to come back to quickly.
- **Reviews and ratings** — a 1–5 rating plus a comment per POI; comments
  enter a moderation queue before going live.
- **User dashboard** — a summary of points, active challenges, and activity
  history.
- **Admin panel** — manage users, POIs, challenges, and rewards, with a
  pending/approved moderation flow and role-restricted access.
- **Sign up and login** — a simple flow for regular users, credential-based
  access for admins (no native browser dialogs: zero
  `alert()`/`confirm()`/`prompt()` anywhere in the UI).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript (framework-free SPA), custom router over the History API |
| Build tool | [Vite](https://vitejs.dev/) |
| Maps | [Leaflet](https://leafletjs.com/) + [Leaflet Routing Machine](https://github.com/perliedman/leaflet-routing-machine) (OSRM) |
| Icons | [Lucide](https://lucide.dev/) |
| Backend | REST API (FastAPI) — separate repository |
| Database | PostgreSQL with PostGIS (geospatial search) on Neon |
| Containers | Docker (development image) |
| Runtime | Node.js ≥ 24 |

[TODO: confirm whether the backend (FastAPI) repo should be linked here
publicly or just mentioned.]

---

## Architecture

### Service layer

All data logic lives in `src/services/`, one service per domain
(`poi.service.js`, `challenge.service.js`, `reward.service.js`, etc.). Views
(`src/pages/`) never talk to `fetch` or `localStorage` directly — they always
go through their corresponding service. This keeps the data model consistent
across the admin, home, and public views — the same `poi.service` feeds all
three.

### Real backend + local fallback (per-module gate)

TourPoints already talks to a real, deployed backend, but it does so
**module by module**, not all-or-nothing. `src/config/api.js` defines which
domains are "wired up":

```js
export const API_MODULES = new Set([
  "auth", "pois", "reviews", "favorites",
  "visits", "points", "challenges", "rewards", "users",
]);
```

Each service checks `isApiEnabled("<module>")` before deciding where to go:

- **With `VITE_API_URL` set and the module in the list** → calls the real
  API (`src/services/api.client.js`, a central HTTP client with automatic
  JWT attachment).
- **Without a URL, or a module not yet wired** → falls back to
  `localStorage` (`src/services/localStore.js`), seeded from `src/mocks/`.

This design (repository/adapter pattern) made it possible to build the whole
app against local data first, then connect each domain to the real backend
as its contract became ready — without touching a single view. The details
of how each module was wired live in
[`docs/CABLEADO.md`](docs/CABLEADO.md).

### Design principles

SOLID, DRY, KISS, and Clean Architecture: reusable modules over quick
hacks, and a strict separation between view, service, and storage.

---

## Database relational model

The backend's real schema (PostgreSQL + PostGIS, defined with SQLAlchemy
models and versioned with Alembic migrations). All ~30 tables, grouped the
same way the team's own [Eraser diagram](https://app.eraser.io) groups them:
identity, POI/geography, gamification, visits & points, commercial, social,
and AI.

```mermaid
erDiagram
    ROLES ||--o{ USUARIOS : "rol_id"

    PAISES ||--o{ DEPARTAMENTOS : "pais_id"
    DEPARTAMENTOS ||--o{ CIUDADES : "departamento_id"
    CIUDADES ||--o{ POI : "ciudad_id"
    CATEGORIAS_POI ||--o{ POI : "categoria_id"
    USUARIOS ||--o{ POI : "creado_por_usuario_id"
    POI ||--o{ POI_RELACIONES : "poi_origen_id"
    POI ||--o{ POI_RELACIONES : "poi_destino_id"
    TIPOS_RELACION_POI ||--o{ POI_RELACIONES : "tipo_relacion_id"
    POI ||--o{ IMAGENES_POI : "poi_id"

    POI ||--o{ RECOMPENSAS : "poi_id"
    RECOMPENSAS ||--o{ RETOS : "recompensa_id"
    USUARIOS ||--o{ RETOS : "creado_por_usuario_id"
    ESTABLECIMIENTOS ||--o{ RETOS : "establecimiento_id"
    USUARIOS ||--o{ USUARIO_RETOS : "usuario_id"
    RETOS ||--o{ USUARIO_RETOS : "reto_id"
    USUARIO_RETOS ||--o{ SESIONES_RETO : "usuario_reto_id"
    USUARIOS ||--o{ RACHAS_RETOS : "usuario_id"
    RETOS ||--o{ RACHAS_RETOS : "reto_id"
    RETOS ||--o{ HITOS_RACHA : "reto_id"
    RECOMPENSAS ||--o{ HITOS_RACHA : "recompensa_id"
    INSIGNIAS ||--o{ HITOS_RACHA : "insignia_id"
    USUARIOS ||--o{ HITOS_RACHA_ALCANZADOS : "usuario_id"
    HITOS_RACHA ||--o{ HITOS_RACHA_ALCANZADOS : "hito_id"
    USUARIO_RETOS ||--o{ HITOS_RACHA_ALCANZADOS : "usuario_reto_id"

    USUARIOS ||--o{ VISITAS : "usuario_id"
    POI ||--o{ VISITAS : "poi_id"
    USUARIOS ||--o{ CANJES : "usuario_id"
    RECOMPENSAS ||--o{ CANJES : "recompensa_id"
    USUARIO_RETOS ||--o{ CANJES : "usuario_reto_id"
    USUARIOS ||--o{ MOVIMIENTOS_PUNTOS : "usuario_id"
    REGLAS_PUNTOS ||--o{ MOVIMIENTOS_PUNTOS : "regla_id"
    VISITAS ||--o| MOVIMIENTOS_PUNTOS : "visita_id"
    COMPRAS ||--o| MOVIMIENTOS_PUNTOS : "compra_id"
    USUARIO_RETOS ||--o| MOVIMIENTOS_PUNTOS : "usuario_reto_id"
    CANJES ||--o| MOVIMIENTOS_PUNTOS : "canje_id"

    POI ||--o| ESTABLECIMIENTOS : "poi_id"
    ESTABLECIMIENTOS ||--o{ ESTABLECIMIENTO_USUARIOS : "establecimiento_id"
    USUARIOS ||--o{ ESTABLECIMIENTO_USUARIOS : "usuario_id"
    USUARIOS ||--o{ COMPRAS : "usuario_id"
    ESTABLECIMIENTOS ||--o{ COMPRAS : "establecimiento_id"
    USUARIOS ||--o{ COMPRAS : "cancelada_por"
    ESTABLECIMIENTOS ||--o{ PROMOCIONES : "establecimiento_id"

    USUARIOS ||--o{ COMENTARIOS : "usuario_id"
    POI ||--o{ COMENTARIOS : "poi_id"
    USUARIOS ||--o{ CALIFICACIONES : "usuario_id"
    POI ||--o{ CALIFICACIONES : "poi_id"
    USUARIOS ||--o{ FAVORITOS : "usuario_id"
    POI ||--o{ FAVORITOS : "poi_id"

    USUARIOS ||--o{ CONVERSACIONES_IA : "usuario_id"

    ROLES {
        int2 id PK
        varchar nombre UK
        text descripcion "nullable"
    }

    USUARIOS {
        uuid id PK
        int2 rol_id FK
        varchar nombre
        varchar apellido "nullable"
        varchar email UK
        text password_hash
        varchar telefono "nullable"
        text foto_url "nullable"
        varchar estado "ACTIVO | SUSPENDIDO | ELIMINADO"
        jsonb configuracion
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }

    PAISES {
        int2 id PK
        varchar nombre
        char codigo_iso UK
    }

    DEPARTAMENTOS {
        int4 id PK
        int2 pais_id FK
        varchar nombre
    }

    CIUDADES {
        int8 id PK
        int4 departamento_id FK
        varchar nombre
    }

    CATEGORIAS_POI {
        int2 id PK
        varchar nombre
        text icono "nullable"
        varchar color "nullable"
    }

    POI {
        uuid id PK
        int2 categoria_id FK
        int8 ciudad_id FK
        uuid creado_por_usuario_id FK "nullable"
        varchar fuente "ADMIN | ESTABLECIMIENTO | USUARIO | IA"
        int2 nivel "nullable, kept by a trigger"
        varchar nombre
        varchar slug UK
        text descripcion "nullable"
        text direccion "nullable"
        geography ubicacion "PostGIS point, srid 4326"
        int2 radio_validacion
        varchar telefono "nullable"
        varchar correo "nullable"
        text sitio_web "nullable"
        jsonb horarios
        jsonb metadata
        varchar estado "BORRADOR | PENDIENTE | APROBADO | RECHAZADO | INACTIVO"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }

    TIPOS_RELACION_POI {
        int2 id PK
        varchar nombre
        text descripcion "nullable"
        boolean es_jerarquica
        boolean es_bidireccional
        boolean requiere_orden
    }

    POI_RELACIONES {
        int8 id PK
        uuid poi_origen_id FK
        uuid poi_destino_id FK
        int2 tipo_relacion_id FK
        int2 orden "nullable"
        timestamp vigencia_inicio
        timestamp vigencia_fin "nullable"
        jsonb metadata
        boolean activo
        timestamp created_at
    }

    IMAGENES_POI {
        int8 id PK
        uuid poi_id FK
        text url
        int2 orden
        boolean principal
    }

    REGLAS_PUNTOS {
        uuid id PK
        varchar nombre
        int2 prioridad
        jsonb configuracion "e.g. evento, categoria, puntos"
        timestamp vigencia_inicio "nullable"
        timestamp vigencia_fin "nullable"
        boolean activo
    }

    RECOMPENSAS {
        uuid id PK
        uuid poi_id FK "nullable"
        varchar nombre
        text descripcion "nullable"
        int4 stock
        int4 puntos
        varchar estado
    }

    RETOS {
        uuid id PK
        varchar nombre
        text descripcion "nullable"
        varchar tipo "VISITA | COMPRA | RECORRIDO"
        varchar recurrencia "UNICA | DIARIA | SEMANAL | MENSUAL"
        int2 cantidad_requerida
        uuid recompensa_id FK "nullable"
        varchar modo_recompensa "GARANTIZADA | LIMITADA | SIN_RECOMPENSA"
        uuid creado_por_usuario_id FK "nullable"
        uuid establecimiento_id FK "nullable"
        timestamp inicio
        timestamp fin "nullable"
        varchar estado "BORRADOR | ACTIVO | FINALIZADO | CANCELADO"
        jsonb configuracion
    }

    USUARIO_RETOS {
        uuid id PK
        uuid usuario_id FK
        uuid reto_id FK
        timestamp periodo_inicio
        timestamp periodo_fin "nullable"
        int2 numero_intento
        jsonb progreso
        int2 porcentaje
        timestamp fecha_completado "nullable"
        varchar estado
        timestamp created_at
    }

    SESIONES_RETO {
        uuid id PK
        uuid usuario_reto_id FK
        timestamp inicio
        timestamp fin "nullable"
        varchar estado
    }

    RACHAS_RETOS {
        uuid id PK
        uuid usuario_id FK
        uuid reto_id FK
        int2 racha_actual
        int2 racha_maxima
        timestamp ultimo_periodo_inicio "nullable"
        boolean ultimo_periodo_completado
        timestamp updated_at
    }

    INSIGNIAS {
        int2 id PK
        varchar codigo UK
        varchar nombre
        text descripcion "nullable"
        text icono "nullable"
    }

    HITOS_RACHA {
        uuid id PK
        uuid reto_id FK
        int2 racha_requerida
        varchar nombre
        int4 puntos_bonus
        uuid recompensa_id FK "nullable"
        int2 insignia_id FK "nullable"
    }

    HITOS_RACHA_ALCANZADOS {
        uuid id PK
        uuid usuario_id FK
        uuid hito_id FK
        uuid usuario_reto_id FK
        boolean recompensa_otorgada
        timestamp created_at
    }

    VISITAS {
        uuid id PK
        uuid usuario_id FK
        uuid poi_id FK
        geography ubicacion_usuario "nullable"
        numeric precision_metros "nullable"
        numeric distancia_metros "nullable"
        varchar metodo_validacion "GPS | QR | MIXTA"
        varchar estado "PENDIENTE | VALIDADA | RECHAZADA"
        timestamp created_at
    }

    CANJES {
        uuid id PK
        uuid usuario_id FK
        uuid recompensa_id FK
        varchar origen "PUNTOS | RETO"
        uuid usuario_reto_id FK "nullable"
        text codigo_qr UK
        timestamp fecha_expira "nullable"
        timestamp fecha_redencion "nullable"
        varchar estado "PENDIENTE | REDIMIDO | EXPIRADO"
        timestamp created_at
    }

    MOVIMIENTOS_PUNTOS {
        int8 id PK
        uuid usuario_id FK
        uuid regla_id FK "nullable"
        uuid visita_id FK "nullable, one of four sources"
        uuid compra_id FK "nullable"
        uuid usuario_reto_id FK "nullable"
        uuid canje_id FK "nullable"
        varchar tipo_movimiento "computed from which FK is set"
        int4 puntos
        timestamp created_at
    }

    ESTABLECIMIENTOS {
        uuid id PK
        uuid poi_id FK "UK, 1:1 with POI"
        varchar nit "nullable, UK"
        varchar razon_social
        varchar tipo_negocio "nullable"
        date fecha_afiliacion
        varchar estado
        jsonb metadata
    }

    ESTABLECIMIENTO_USUARIOS {
        uuid establecimiento_id PK, FK
        uuid usuario_id PK, FK
        varchar cargo "nullable"
    }

    COMPRAS {
        uuid id PK
        uuid usuario_id FK
        uuid establecimiento_id FK
        numeric valor
        varchar moneda "COP | USD"
        varchar codigo_transaccion "nullable, UK"
        varchar estado "REGISTRADA | CANCELADA | VALIDADA"
        uuid cancelada_por FK "nullable"
        timestamp fecha_cancelacion "nullable"
        timestamp created_at
    }

    PROMOCIONES {
        uuid id PK
        uuid establecimiento_id FK
        varchar titulo
        text descripcion "nullable"
        timestamp inicio
        timestamp fin
        varchar estado
    }

    COMENTARIOS {
        int8 id PK
        uuid usuario_id FK
        uuid poi_id FK
        text contenido
        varchar estado "PENDIENTE | APROBADO | RECHAZADO"
        timestamp created_at
    }

    CALIFICACIONES {
        int8 id PK
        uuid usuario_id FK
        uuid poi_id FK
        int2 calificacion "1 to 5"
        timestamp created_at
    }

    FAVORITOS {
        uuid usuario_id PK, FK
        uuid poi_id PK, FK
        timestamp created_at
    }

    CONVERSACIONES_IA {
        int8 id PK
        uuid session_id
        uuid usuario_id FK
        varchar role "USER | ASSISTANT | SYSTEM"
        text contenido
        varchar modelo "nullable"
        int4 tokens "nullable"
        numeric temperatura "nullable"
        int4 latencia_ms "nullable"
        numeric costo_usd "nullable"
        varchar finish_reason "nullable"
        jsonb metadata
        timestamp created_at
    }
```

A few things worth knowing about this schema:

- `MOVIMIENTOS_PUNTOS` is an append-only ledger: rows are never updated or
  deleted, and a user's point balance is never stored as a column — it's
  computed on read as `SUM(puntos)` through a database view
  (`saldo_puntos_usuario`).
- `POI.nivel` is maintained by a database trigger
  (`fn_actualizar_nivel_poi`), not by the application.
- `POI_RELACIONES` is self-referencing: both `poi_origen_id` and
  `poi_destino_id` point back to `POI`, which is how a POI can link to
  related POIs (e.g. a route made of several stops).
- `ESTABLECIMIENTO_USUARIOS` and `FAVORITOS` have no surrogate `id` — their
  primary key is the pair of foreign keys.
- `CONVERSACIONES_IA` exists in the schema but has no frontend feature
  built on it yet — see [Roadmap](#roadmap-and-known-limitations).

---

## Prerequisites

- **Node.js ≥ 24** (see `engines` in `package.json`)
- **npm** (ships with Node)
- Optional: **Docker Desktop** — to run the environment without installing
  Node locally

---

## Configuration

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=https://tourpoints.159.54.176.254.nip.io/api/v1
```

Leave it empty or commented out to run entirely against local mock data
instead of the real backend — see
[Real backend + local fallback](#real-backend--local-fallback-per-module-gate).

### Backend (separate repository)

The backend lives in its own repository and has its own `.env`:

```bash
HOST_UID=1001
HOST_GID=1001
# Neon connection string (Dashboard → Connection Details)
DATABASE_URL=postgresql://user:pass@ep-example-pooler.region.aws.neon.tech/dbname?sslmode=require&channel_binding=require
# Generate your own: openssl rand -hex 32 — never reuse the example value
SECRET_KEY=replace-this-with-a-generated-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

[TODO: link the backend repository here once it's public/shared, so
contributors can clone and configure it too.]

---

## Local setup

### Option A — Node/npm

```bash
# 1. Clone the repository
git clone https://github.com/TourPoints/TourPoints-Frontend.git
cd TourPoints-Frontend/frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and uncomment VITE_API_URL to use the real backend;
# leaving it empty runs the app against local sample data instead.

# 4. Start the dev server
npm run dev
```

The app is available at `http://localhost:5173`.

### Option B — Docker (development only)

The repo ships a `dockerfile` under `frontend/` meant for development (there
is no production build image yet).

```bash
cd frontend
docker build -t tourpoints-frontend .
docker run -p 5173:5173 -v "$(pwd):/app" -v /app/node_modules tourpoints-frontend
```

This installs dependencies inside the container and runs
`npm run dev -- --host`, exposing port 5173. The volume mounts the source
code so changes are reflected without rebuilding the image.

[TODO: if the team has a standard Docker Desktop + WSL2 setup, document the
specific steps here (distro, resource limits, etc.).]

---

## Project structure

```
Tourpoints/
├── docs/                      # Technical docs (wiring log, project state, backend integration)
├── netlify.toml                # Build and deploy configuration (Netlify)
└── frontend/
    ├── public/                 # Static assets served as-is (icons, favicon)
    ├── dockerfile               # Development image
    ├── .env.example
    └── src/
        ├── main.js              # Entry point
        ├── router/              # Routes and the custom History-API router
        ├── pages/                # One view per public route
        │   ├── admin/            # Admin panel views
        │   └── auth/             # Login / register
        ├── components/
        │   ├── atoms/            # Minimal reusable elements
        │   ├── molecules/        # Compositions of atoms (cards, search bar...)
        │   └── organism/         # Page-level blocks (header, footer, sidebar...)
        ├── services/             # One facade per domain (poi, auth, challenge, reward...)
        ├── mocks/                # Seed data for the local/offline mode
        ├── config/               # Environment config and the API module gate
        ├── utils/                # Pure helpers (text, dates, filters...)
        └── styles/               # CSS organized by atoms/molecules/organisms/pages
```

[TODO: confirm whether the backend repository's structure should also be
documented here, or get its own README in that repo.]

---

## Available scripts

Run from `frontend/`:

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Starts the Vite dev server with hot reload |
| Build | `npm run build` | Generates the production build in `dist/` |
| Preview build | `npm run preview` | Serves the `dist/` output locally |

> No automated test suite is configured yet — see
> [Roadmap and known limitations](#roadmap-and-known-limitations).

---

## Git workflow and branching

```
feature/TOUR-<ticket>-<slug>  →  test/full-integration  →  develop  →  main
```

- **`main`** and **`develop`** are protected: never develop or merge
  directly on them.
- **`test/full-integration`** is the active integration branch. Features
  accumulate there while being polished and while frontend/backend
  integration is tested.
- **`develop`** only receives a merge once every feature in flight is
  polished and tested — it's never rushed just to have code there.
- Every Jira ticket gets its own branch:
  **`feature/TOUR-<ticket>-<slug>`**, created from `test/full-integration`.

### Commits

[Conventional Commits](https://www.conventionalcommits.org/), in English,
present tense:

```
<type>(<optional scope>): <short description>

[optional body explaining the why]
```

Types in use: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `build`,
`ci`, `chore`.

```bash
git commit -m "fix(map): stop floating buttons from overlapping on mobile"
git commit -m "feat(rewards): add QR code redemption flow"
```

---

## Contributing

1. **One Jira ticket per branch.** The hierarchy is strict: Epic → User
   Story → Task → Subtask — no skipping levels.
2. Branch off `test/full-integration`:
   `feature/TOUR-<number>-<descriptive-slug>`.
3. Commits in English, Conventional Commits, short present-tense messages.
4. Before opening a PR:
   - Verify no native `alert()`/`confirm()`/`prompt()` dialogs remain.
   - Verify no non-functional UI elements remain.
   - Test the flow on both desktop and mobile.
5. PRs target `test/full-integration`, never `develop` or `main` directly.
6. Link the Jira ticket in the PR description for traceability.

[TODO: confirm whether the team uses a PR template, requires review from
another teammate, or has any additional checklist.]

---

## MVP

The current version of TourPoints includes:

- User registration and login (JWT), with citizen and admin roles
- POI catalog with categories, geospatial search (PostGIS), and a
  moderation flow before a POI goes live
- Interactive map with real distance and walking directions (OSRM) from the
  user's location to each POI
- GPS-validated visits
- Challenges: join, track progress, complete
- A points ledger and reward redemption with QR codes
- Reviews (rating + comment) with a moderation queue
- Favorites
- Admin panel: manage users, POIs, challenges, and rewards

Future versions may include:

- A self-hosted OSRM instance (the current build points at the public demo
  server, which is rate-limited)
- An automated test suite
- Images for challenges and rewards, per-user point balance in the admin
  panel
- AI-assisted features — the backend schema already scaffolds a
  `conversaciones_ia` table for this
- A native mobile app

---

## Project management tools

- **Jira** — sprint planning and task tracking, following a strict
  Epic → User Story → Task → Subtask hierarchy
- **GitHub** — version control, branching, and pull requests
- **In-repo documentation** — technical decisions and integration notes are
  tracked as markdown in [`docs/`](docs/) rather than in an external tool

[TODO: add any other tool the team uses for communication or docs (e.g.
Notion, Google Docs, Slack, Discord) — left out rather than assumed.]

---

## Roadmap and known limitations

- **Seed data coordinates** anchored to Barranquilla are approximate and
  still need to be verified against Google Maps before being treated as
  final.
- **Backend growing in phases** — some endpoints are still pending
  server-side: `PATCH`/`DELETE` for challenges, images for challenges and
  rewards, per-user point balance in the admin panel, an ordering parameter
  for POI search.
- **No automated tests yet** — no testing framework installed and no
  `test` script; this remains open work.
- **OSRM routing uses the public demo server** at
  `router.project-osrm.org`: it's rate-limited and comes with no service
  guarantees; production needs a self-hosted instance.
- **End-to-end authenticated flows** (login → favorite → comment → visit →
  dashboard → challenge → redemption) are built but still pending full
  manual verification by the team.

[TODO: add or remove items as the sprint's real status changes before
publishing this README.]

---

## License

[TODO — undecided. As a training project within Riwi, decide whether it
will carry a public open-source license (e.g. MIT) or remain an educational
project without a distribution license.]
