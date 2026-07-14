import { home } from "../pages/home.js";
import { login } from "../pages/auth/login.js";
import { register } from "../pages/auth/register.js";
import { notFound } from "../pages/notFound.js";
import { adminDashboard }       from "../pages/admin/dashboard.js";
import { usersManagement }      from "../pages/admin/usersManagement.js";
import { poisManagement }       from "../pages/admin/poisManagement.js";
import { challengesManagement } from "../pages/admin/challengesManagement.js";
import { rewardsManagement }    from "../pages/admin/rewardsManagement.js";
import { adminSettings }        from "../pages/admin/settings.js";

export const routes = {

  // ── Públicas ────────────────────────────────────────────
  "/": {
    component: home,
    layout: "public",
  },
  "/login": {
    component: login,
    layout: "public",
  },
  "/register": {
    component: register,
    layout: "public",
  },

  // ── Admin ───────────────────────────────────────────────
  // NOTA BACKEND: proteger estas rutas con JWT y rol "admin"
  // Header esperado: Authorization: Bearer <token>
  "/admin": {
    component: adminDashboard,
    layout: "admin",
  },
  "/admin/users": {
    component: usersManagement,
    layout: "admin",
  },
  "/admin/pois": {
    component: poisManagement,
    layout: "admin",
  },
  "/admin/challenges": {
    component: challengesManagement,
    layout: "admin",
  },
  "/admin/rewards": {
    component: rewardsManagement,
    layout: "admin",
  },
  "/admin/settings": {
    component: adminSettings,
    layout: "admin",
  },
};

export const notFoundView = notFound;
