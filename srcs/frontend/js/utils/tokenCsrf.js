
import { baseURL } from "../app.js";

// Função que faz o pedido do token csrf ao server
async function getCsrfToken() {

	const response = await fetch(`${baseURL}/get-csrf-token/`, {
		method: 'GET',
		credentials: 'include',
	});

	if (!response.ok) {
		throw new Error('Failed to get CSRF token');
	}

	const data = await response.json();
	// console.log('crsfToken: ', data.csrfToken);
	return data.csrfToken;
}


export { getCsrfToken }