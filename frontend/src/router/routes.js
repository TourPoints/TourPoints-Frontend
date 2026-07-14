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
    }
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
