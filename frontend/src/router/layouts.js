import { publicLayout } from "../layouts/public.js";
import { adminLayout } from "../layouts/adminLayout.js";

export function renderLayout(layout, content) {

  switch (layout) {

    case "admin":
      return adminLayout(content);

    default:
      return publicLayout(content);

  }

}