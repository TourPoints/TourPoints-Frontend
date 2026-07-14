import { routes, dynamicRoutes, notFoundView } from "./routes.js";
import { renderLayout } from "./layouts.js";
import { isAuthenticated, getUserRole } from "./guards.js";
import { loadIcons } from "../utils/icons.js";
import { updateActiveMenu } from "../utils/activeMenu.js";

const app = document.getElementById("app");

export function navigate(path){

    history.pushState({}, "", path);

    renderRoute();

}

export function renderRoute(){

    const path = location.pathname;

    let route = routes[path];
    let params = {};

    if (!route) {
        for (const dynRoute of dynamicRoutes) {
            const match = path.match(dynRoute.pattern);
            if (match) {
                route = dynRoute;
                params = dynRoute.parseParams(match);
                break;
            }
        }
    }

    if(!route){

        app.innerHTML = notFoundView();

        return;

    }

    if(route.auth && !isAuthenticated()){

        navigate("/login");

        return;

    }

    if(route.role){

        const role = getUserRole();

        if(role !== route.role){

            navigate("/");

            return;

        }

    }

    const page = route.component();

    app.innerHTML = renderLayout(route.layout, page);

    updateActiveMenu();

    loadIcons();

    if (route.init) {
        route.init(params);
    }
}

window.addEventListener("popstate", renderRoute);

document.addEventListener("click",(e)=>{

    const link = e.target.closest("[data-link]");

    if(!link) return;

    e.preventDefault();

    navigate(link.getAttribute("href"));

});