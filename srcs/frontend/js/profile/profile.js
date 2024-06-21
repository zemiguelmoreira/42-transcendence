

import { baseURL } from "../app.js";


async function fetchProtectedData() {
    try {

		const conf = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }

        const response = await fetchWithAuth(`${baseURL}/protected/`, conf);
        if (!response.ok) {
            throw new Error(`Error fetching protected data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Protected data:', data);
    } catch (error) {
        console.error(error.message);
    }
}

// Função de teste Token
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

// Função de teste Token
function testToken(token) {
	let payload;
	if (token) {
		payload = parseJwt(token);
		console.log(payload); // Verifique as claims
	
		const currentTimestamp = Math.floor(Date.now() / 1000);
		if (payload.exp < currentTimestamp) {
			console.log('Token expirado');
		} else {
			console.log('Token válido');
		}
	} else {
		console.log('Token não encontrado no localStorage');
	}
	return payload;
}


async function fetchWithAuth(url, options = {}) {

    const accessToken = localStorage.getItem('access_token');

	testToken(accessToken); //só para teste

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


// Função para fazer a solicitação POST
// colocar o token e remover decorator no Django
async function refreshAccessToken() {

	const refreshToken = localStorage.getItem('refresh_token');

    try {
		// api/token/refresh/
		const url = `${baseURL}/api/token/refresh/`;
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



// function linkTeste(e) {
// 	e.preventDefault();
// 	// fetchProtectedData();
// 	// const state = refreshAccessToken();
// 	fetchProtectedData();
// }



export { fetchProtectedData, testToken }
