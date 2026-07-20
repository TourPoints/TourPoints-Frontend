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
models and versioned with Alembic migrations) has about 30 tables in total —
too many to chart legibly in one diagram. The one below shows the **core
domain**: the tables that carry the main user story, from account to
redeemed reward.

```mermaid
erDiagram
    ROLES ||--o{ USUARIOS : "rol_id"
    CIUDADES ||--o{ POI : "ciudad_id"
    CATEGORIAS_POI ||--o{ POI : "categoria_id"
    POI ||--o| ESTABLECIMIENTOS : "poi_id"
    USUARIOS ||--o{ VISITAS : "usuario_id"
    POI ||--o{ VISITAS : "poi_id"
    USUARIOS ||--o{ USUARIO_RETOS : "usuario_id"
    RETOS ||--o{ USUARIO_RETOS : "reto_id"
    ESTABLECIMIENTOS ||--o{ RETOS : "establecimiento_id"
    RECOMPENSAS ||--o{ RETOS : "recompensa_id"
    POI ||--o{ RECOMPENSAS : "poi_id"
    USUARIOS ||--o{ CANJES : "usuario_id"
    RECOMPENSAS ||--o{ CANJES : "recompensa_id"
    USUARIO_RETOS ||--o{ CANJES : "usuario_reto_id"
    USUARIOS ||--o{ MOVIMIENTOS_PUNTOS : "usuario_id"
    VISITAS ||--o| MOVIMIENTOS_PUNTOS : "visita_id"
    USUARIO_RETOS ||--o| MOVIMIENTOS_PUNTOS : "usuario_reto_id"
    CANJES ||--o| MOVIMIENTOS_PUNTOS : "canje_id"

    ROLES {
        int2 id PK
        varchar nombre
        text descripcion "nullable"
    }

    USUARIOS {
        uuid id PK
        int2 rol_id FK
        varchar nombre
        varchar apellido "nullable"
        varchar email UK
        text password_hash
        varchar estado "ACTIVO | SUSPENDIDO | ELIMINADO"
        jsonb configuracion
    }

    CATEGORIAS_POI {
        int2 id PK
        varchar nombre
        text icono "nullable"
        varchar color "nullable"
    }

    CIUDADES {
        int8 id PK
        int4 departamento_id FK
        varchar nombre
    }

    POI {
        uuid id PK
        int2 categoria_id FK
        int8 ciudad_id FK
        uuid creado_por_usuario_id FK "nullable"
        varchar nombre
        varchar slug UK
        geography ubicacion "PostGIS point, srid 4326"
        varchar estado "BORRADOR | PENDIENTE | APROBADO | ..."
    }

    ESTABLECIMIENTOS {
        uuid id PK
        uuid poi_id FK "UK, 1:1 with POI"
        varchar nit "nullable, UK"
        varchar razon_social
        varchar estado
    }

    VISITAS {
        uuid id PK
        uuid usuario_id FK
        uuid poi_id FK
        numeric distancia_metros "nullable"
        varchar metodo_validacion "GPS | QR | MIXTA"
        varchar estado "PENDIENTE | VALIDADA | RECHAZADA"
    }

    RETOS {
        uuid id PK
        varchar nombre
        varchar tipo "VISITA | COMPRA | RECORRIDO"
        varchar recurrencia "UNICA | DIARIA | SEMANAL | MENSUAL"
        uuid recompensa_id FK "nullable"
        uuid establecimiento_id FK "nullable"
        varchar estado "BORRADOR | ACTIVO | FINALIZADO | CANCELADO"
    }

    USUARIO_RETOS {
        uuid id PK
        uuid usuario_id FK
        uuid reto_id FK
        jsonb progreso
        int2 porcentaje
        varchar estado
    }

    RECOMPENSAS {
        uuid id PK
        uuid poi_id FK "nullable"
        varchar nombre
        int4 stock
        int4 puntos
        varchar estado
    }

    CANJES {
        uuid id PK
        uuid usuario_id FK
        uuid recompensa_id FK
        varchar origen "PUNTOS | RETO"
        uuid usuario_reto_id FK "nullable"
        text codigo_qr UK
        varchar estado "PENDIENTE | REDIMIDO | EXPIRADO"
    }

    MOVIMIENTOS_PUNTOS {
        int8 id PK
        uuid usuario_id FK
        uuid visita_id FK "nullable, one of four sources"
        uuid usuario_reto_id FK "nullable"
        uuid canje_id FK "nullable"
        varchar tipo_movimiento "computed from which FK is set"
        int4 puntos
    }
```

`MOVIMIENTOS_PUNTOS` is an append-only ledger: rows are never updated or
deleted, and a user's point balance is never stored as a column — it's
computed on read as `SUM(puntos)` through a database view. `POI` also carries
a `PoiFuente` field (`ADMIN | ESTABLECIMIENTO | USUARIO | IA`) tracking who
created each place.

Supporting tables not drawn above, grouped by area:

| Area | Tables |
|---|---|
| Geography | `paises`, `departamentos` |
| POI content & relations | `imagenes_poi`, `poi_relaciones`, `tipos_relacion_poi` |
| Social / reviews | `comentarios`, `calificaciones`, `favoritos` |
| Gamification extras | `reglas_puntos`, `rachas_retos`, `insignias`, `hitos_racha`, `hitos_racha_alcanzados`, `sesiones_reto` |
| Commercial extras | `compras`, `promociones`, `establecimiento_usuarios` |
| AI | `conversaciones_ia` |

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
