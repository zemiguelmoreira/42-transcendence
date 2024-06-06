


import { baseURL } from "../app.js";


async function fetchProtectedData() {
    try {

		const conf = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }

        const response = await fetchWithAuth(`${baseURL}/users/protected/`, conf);
        if (!response.ok) {
            throw new Error(`Error fetching protected data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Protected data:', data);
    } catch (error) {
        console.error(error.message);
    }
}


async function fetchWithAuth(url, options = {}) {
    const accessToken = localStorage.getItem('access_token');
	console.log('access: ', accessToken);

    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
    };

	console.log('Headers before first request:', options.headers);

    let response = await fetch(url, options);
	console.log('url ver: ', url);

    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
		console.log(refreshed);
        if (refreshed) {
			console.log('access: ', localStorage.getItem('access_token'));
            options.headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
			console.log(url);
            response = await fetch(url, options);
        }
    }

    return response;
}



const refreshToken = localStorage.getItem('refresh_token');

// Função para fazer a solicitação POST
async function refreshAccessToken() {
    try {
		// api/token/refresh/
		const url = `${baseURL}/users/api/token/refresh/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh: refreshToken,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Novo token de acesso:', data.access_token);
			localStorage.setItem('access_token', data.access_token);
			return true;
        } else {
            const errorData = await response.json();
            console.error('Erro de autenticação:', errorData.detail);
			return false;
        }
    } catch (error) {
        console.error('Erro:', error);
		return false;
    }
}



function linkTeste(e) {
	e.preventDefault();
	// fetchProtectedData();
	// const state = refreshAccessToken();
	fetchProtectedData();
}



export { linkTeste }
