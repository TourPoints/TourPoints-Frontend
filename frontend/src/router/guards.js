export function isAuthenticated() {

    return localStorage.getItem("token") !== null;

}

export function getUserRole() {

    return localStorage.getItem("role");

}