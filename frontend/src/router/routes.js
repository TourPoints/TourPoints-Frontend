import { home } from "../pages/home.js";
import { login } from "../pages/auth/login.js";
import { register } from "../pages/auth/register.js";
import { notFound } from "../pages/notFound.js";
import { explore, initExplore } from "../pages/explore.js";
import { map, initMap } from "../pages/map.js";


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

export const notFoundView = notFound;

