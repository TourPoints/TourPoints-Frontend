# Trazabilidad — dónde vive cada cosa

> Verificado con `git branch --contains` el 2026-07-15. Para saber a qué rama ir antes de
> tocar algo, y qué features se construyeron en ramas que no les correspondían.

## Regla de oro

**Todo el código vivo está en `test/full-integration`.** Es la única rama con todo.
Para cualquier cambio, sal de ahí. Las ramas `feature/*` antiguas están muertas: ninguna
tiene commits exclusivos y todas van entre 32 y 35 commits atrasadas.

`develop` va 16 commits por detrás. `main`, 38.

## Qué se construyó fuera de su rama

La convención (una rama por ticket) se siguió al principio y luego se dejó de seguir.
El corte está en `496b9b3`: a partir de ahí se empezó a commitear directo sobre
`test/full-integration`, y hoy además se acumuló todo sobre `feature/TOUR-35-challenges`.

| Ticket / feature | Commits | Se construyó en | ¿Correspondía? |
|---|---|---|---|
| TOUR-4 · geolocalización del mapa | `5686549` | `test/full-integration` | ❌ No pasó por `feature/TOUR-4-interactive-map` |
| TOUR-40 · refactor de poisManagement | `3432f48` | `test/full-integration` | ❌ No pasó por `feature/TOUR-40-TOUR-39-admin-dashboard` |
| Seeds de Barranquilla | `496b9b3` | `test/full-integration` | ⚠️ Sin ticket |
| Config de entorno / guards / service layer | `ddd5da1`, `929950b`, `c3ee45b` | `test/full-integration` | ⚠️ Sin ticket |
| TOUR-35 · vista pública de Retos | `278fbe3` | `feature/TOUR-35-challenges` | ✅ Sí |
| TOUR-2 · volver atrás en detalle de POI | `d2c3cd6` | `feature/TOUR-35-challenges` | ❌ Era de `feature/TOUR-2-browse-pois` |
| TOUR-2 · crear comentarios | `3020e13` | `feature/TOUR-35-challenges` | ❌ Era de `feature/TOUR-2-browse-pois` |
| Favoritos por usuario + vista | `0462a8b`, `32d1713`, `e109b72` | `feature/TOUR-35-challenges` | ⚠️ Sin ticket |
| Botón volver al sitio (admin) | `c099dc4` | `feature/TOUR-35-challenges` | ⚠️ Sin ticket |
| Reseñas semilla a Barranquilla | `a8aa3c0` | `feature/TOUR-35-challenges` | ⚠️ Sin ticket |

Lo que sí se hizo bien y quedó registrado con merge commits: `feature/rewards` (`8203c6d`),
`feature/TOUR-2-browse-pois` (`dfc5c34`), `feature/US-2-view-point-of-interest-details`
(`390e7a2`), `feature/TOUR-40-TOUR-39-admin-dashboard` (`f0f2bce`).

**La traza no se perdió**: el ticket va en el mensaje del commit (`feat(TOUR-2): ...`),
aunque no en el nombre de la rama. Para buscar el trabajo de un ticket:
`git log --oneline --grep="TOUR-2"`.

## Ramas trampa

No hagas checkout de estas para cambiar su feature — están congeladas en un estado antiguo
y **no contienen** el trabajo posterior de su propio ticket:

| Rama | Atraso | Le falta, de lo suyo |
|---|---|---|
| `feature/TOUR-4-interactive-map` | 34 commits | La geolocalización y el control de centrar (`5686549`) |
| `feature/TOUR-40-TOUR-39-admin-dashboard` | 34 | El refactor sobre la fábrica CRUD (`3432f48`) |
| `feature/TOUR-2-browse-pois` | 35 | Volver atrás y los comentarios (`d2c3cd6`, `3020e13`) |
| `feature/US-0-visit-landing-page` | 32 | — |
| `feature/US-2-view-point-of-interest-details` | 33 | — |
| `feature/rewards` | 34 | — |
| `feature/TOUR-35-challenges` | 0 | Ya fusionada. Se puede borrar. |

Todas tienen 0 commits exclusivos: borrarlas no pierde nada.

## Dónde tocar cada feature

| Si vas a cambiar… | Archivos |
|---|---|
| Mapa (TOUR-4) | `pages/map.js`, `styles/pages/map.css`, `utils/poiFilter.js` |
| Explorar / búsqueda (TOUR-2) | `pages/explore.js`, `utils/poiFilter.js`, `components/molecules/poisCard.js` |
| Detalle de POI (US-2 / TOUR-2) | `pages/poiDetail.js`, `components/organism/poiSidebar.js`, `reviewsList.js` |
| Comentarios (TOUR-2) | `services/review.service.js`, `components/organism/reviewsList.js`, `molecules/reviewCard.js` |
| Retos (TOUR-35 / TOUR-39) | `pages/challenges.js`, `services/challenge.service.js`, `challengeProgress.service.js` |
| Favoritos | `services/favorite.service.js`, `pages/favorites.js`, `components/organism/header.js` |
| Recompensas | `pages/rewards.js`, `services/reward.service.js` |
| Panel admin (TOUR-39/40) | `pages/admin/*`, sobre todo `createAdminCrudView.js` (fábrica compartida) |
| Capa de datos | `services/api.client.js`, `createCrudService.js`, `poi.service.js`, `localStore.js` |
| Navegación / rutas | `router/routes.js`, `router/router.js`, `utils/navigation.js` |

## De aquí en adelante

Una rama por ticket, desde `test/full-integration`, y si aparece trabajo de otro ticket,
que salga en su propia rama. Lo de hoy (`feature/TOUR-35-challenges` cargando TOUR-2,
favoritos y el botón del admin) es la excepción, no el patrón a repetir.

El trabajo sin ticket (favoritos, seeds, capa de servicio) conviene registrarlo en Jira
aunque sea a posteriori: hoy no hay forma de rastrearlo salvo leyendo el historial.
