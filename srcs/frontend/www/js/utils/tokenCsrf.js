import { baseURL } from "../app.js";

async function getCsrfToken() {
	const response = await fetch(`${baseURL}/get-csrf-token/`, {
		method: 'GET',
		credentials: 'include',
	});
	if (!response.ok) {
		throw new Error('Failed to get CSRF token');
	}
	const data = await response.json();
	return data.csrfToken;
}

export { getCsrfToken }