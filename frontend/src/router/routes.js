import { home } from "../pages/home.js";
import { login, initLogin } from "../pages/auth/login.js";
import { register, initRegister } from "../pages/auth/register.js";
import { rewards } from "../pages/rewards.js";
import { notFound } from "../pages/notFound.js";
import { adminDashboard, initAdminDashboard } from "../pages/admin/dashboard.js";
import { usersManagement, initUsersManagement } from "../pages/admin/usersManagement.js";
import { poisManagement, initPoisManagement } from "../pages/admin/poisManagement.js";
import { challengesManagement, initChallengesManagement } from "../pages/admin/challengesManagement.js";
import { rewardsManagement, initRewardsManagement } from "../pages/admin/rewardsManagement.js";
import { adminSettings }        from "../pages/admin/settings.js";
import { explore, initExplore } from "../pages/explore.js";
import { map, initMap } from "../pages/map.js";
import { poiDetail, initPoiDetail } from "../pages/poiDetail.js";

export const routes = {

    "/": {
        component: home,
        layout: "public",
        auth: false
    },
    "/explore": {
        component: explore,
        init: initExplore,
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
