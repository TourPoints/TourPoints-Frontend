import { publicLayout } from "../layouts/public.js";
// import { userLayout } from "../layouts/userLayout.js";
// import { adminLayout } from "../layouts/adminLayout.js";

export function renderLayout(layout, content) {

    switch(layout){

        // case "user":
        //     return userLayout(content);

        // case "admin":
        //     return adminLayout(content);

        default:
            return publicLayout(content);

    }

}