
import { urlAuth, uri } from "./auth.js";

console.log("Início do script");
console.log(urlAuth);
const button = document.querySelector("#teste");
console.log(button);
console.log("Fim do script");

button.addEventListener('click', getCode);

function getCode() {
	// e.preventDefault();
	window.location.href = urlAuth;

}

function getParams() {

	console.log(window.location.search);

	const params = new URLSearchParams(window.location.search);

	// Obtém o valor de um parâmetro específico
	const code = params.get('code');

	// Verifica se o parâmetro 'code' foi encontrado na query string
	if (code)
	 	console.log('Código de acesso:', code);
	// window.location.href = "http://127.0.0.1:5500/42/Transcendence/index.html";
}


getParams();

console.log("Fim do script 1");

