import { urlAuth } from "./auth.js";

const button = document.querySelector("#teste");
button.addEventListener('click', getCode);

function getCode() {
    window.location.href = urlAuth;
}

function getParams() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
    }
}

getParams();
