import "/src/styles/atoms/button.css";


export function buttonLinks(href,text,variante) {
    return `
        <a href="${href}" data-link class="btn btn--${variante}">
            ${text}
        </a>
    `;
}