import { home, initHome } from "../pages/home.js";
import { login, initLogin } from "../pages/auth/login.js";
import { register, initRegister } from "../pages/auth/register.js";
import { rewards, initRewards } from "../pages/rewards.js";
import { notFound } from "../pages/notFound.js";
import { adminDashboard, initAdminDashboard } from "../pages/admin/dashboard.js";
import { usersManagement, initUsersManagement } from "../pages/admin/usersManagement.js";
import { poisManagement, initPoisManagement } from "../pages/admin/poisManagement.js";
import { challengesManagement, initChallengesManagement } from "../pages/admin/challengesManagement.js";
import { rewardsManagement, initRewardsManagement } from "../pages/admin/rewardsManagement.js";
import { adminSettings }        from "../pages/admin/settings.js";
import { dashboard, initDashboard } from "../pages/dashboard.js";
import { explore, initExplore } from "../pages/explore.js";
import { challenges, initChallenges } from "../pages/challenges.js";
import { favorites, initFavorites } from "../pages/favorites.js";
import { map, initMap } from "../pages/map.js";
import { poiDetail, initPoiDetail } from "../pages/poiDetail.js";

export const routes = {

    "/": {
        component: home,
        init: initHome,
        layout: "public",
        auth: false
    },
    "/explore": {
        component: explore,
        init: initExplore,
        layout: "public",
        auth: false
    },

    "/challenges": {
        component: challenges,
        init: initChallenges,
        layout: "public",
        auth: false
    },

    "/map": {
        component: map,
        init: initMap,
        layout: "public",
        auth: false
    },

    "/login": {
        component: login,
        init: initLogin,
        layout: "public",
        auth: false
    },

    "/register": {
        component: register,
        init: initRegister,
        layout: "public",
        auth: false
    },
    "/rewards": {
        component: rewards,
        init: initRewards,
        layout: "public",
        auth: false
    },

    // auth:false a propósito: la vista se muestra siempre e invita a entrar
    // si no hay sesión. Marcarla auth:true la escondería tras el guard, que
    // hoy exige rol de administrador, no una sesión cualquiera.
    "/favorites": {
        component: favorites,
        init: initFavorites,
        layout: "public",
        auth: false
    },

    // Mismo caso que /favorites: la página gestiona su propia sesión.
    "/dashboard": {
        component: dashboard,
        init: initDashboard,
        layout: "public",
        auth: false
    },
    "/admin": {
        component: adminDashboard,
        init: initAdminDashboard,
        layout: "admin",
        auth: true
    },

    "/admin/users": {
        component: usersManagement,
        init: initUsersManagement,
        layout: "admin",
        auth: true
      },
      "/admin/pois": {
        component: poisManagement,
        init: initPoisManagement,
        layout: "admin",
        auth: true
      },
      "/admin/challenges": {
        component: challengesManagement,
        init: initChallengesManagement,
        layout: "admin",
        auth: true
      },
      "/admin/rewards": {
        component: rewardsManagement,
        init: initRewardsManagement,
        layout: "admin",
        auth: true
      },
        "/admin/settings": {
        component: adminSettings,
        layout: "admin",
        auth: true }
};

export const dynamicRoutes = [
    {
        pattern: /^\/poi\/(\d+)$/,
        component: poiDetail,
        init: initPoiDetail,
        layout: "public",
        auth: false,
        parseParams: (match) => ({ id: match[1] }),
    },
];

export const notFoundView = notFound;
