import { header } from "../components/organism/header.js";
import { footer } from "../components/organism/footer.js";

export function publicLayout(content){

    return `

        ${header()}

        <main>

            ${content}

        </main>

        ${footer()}

    `;

}