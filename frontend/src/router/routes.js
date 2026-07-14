import { home } from "../pages/home.js";
import { login } from "../pages/auth/login.js";
import { register } from "../pages/auth/register.js";
import { rewards } from "../pages/rewards.js";
import { notFound } from "../pages/notFound.js";
import { adminDashboard }       from "../pages/admin/dashboard.js";
import { usersManagement }      from "../pages/admin/usersManagement.js";
import { poisManagement }       from "../pages/admin/poisManagement.js";
import { challengesManagement } from "../pages/admin/challengesManagement.js";
import { rewardsManagement }    from "../pages/admin/rewardsManagement.js";
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
        layout: "public",
        auth: false
    },

    "/register": {
        component: register,
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
        layout: "admin",
        auth: true
    },

    "/admin/users": {
        component: usersManagement,
        layout: "admin",
        auth: true   
      },
      "/admin/pois": {
        component: poisManagement,
        layout: "admin",
        auth: true   
      },
      "/admin/challenges": {
        component: challengesManagement,
        layout: "admin",
        auth: true   
      },
      "/admin/rewards": {
        component: rewardsManagement,
        layout: "admin",
        auth: true },
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
