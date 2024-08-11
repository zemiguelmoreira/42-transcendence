
import { baseURL, navigateTo } from "../app.js";
import { testToken } from "./tokens.js";

// só utilizada para teste como exemplo de fazer o fetch com tokens
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
        // console.log('Protected data:', data);
    } catch (error) {
        console.error(error.message);
    }
}


// Mostra a mensagem para fazer login em falha do refresh Token
function showMessageToken() {
	let messageDiv = document.getElementById('tokenMessage');
	messageDiv.style.display = 'block'; // Exibe a mensagem
    // console.log('passei no show message token');
	setTimeout(function() {
		messageDiv.style.display = 'none';
		navigateTo(`/`);
	}, 5000); // 1000 milissegundos = 1 segundo
}


// Faz o fetch ao server para rotas protegidas em caso de falta de access e refresh vai para a home
async function fetchWithAuth(url, options = {}) {

    const accessToken = localStorage.getItem('access_token');

	testToken(accessToken); //só para teste

	// console.log('access: ', accessToken);
    // console.log('validade: ', testToken(accessToken));

    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
    };

	// console.log('Headers before first request:', options.headers);

    let response = await fetch(url, options);
	// console.log('url a fazer fetch: ', url);

    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
		// console.log(refreshed);
        if (refreshed) {
			// console.log('access: ', localStorage.getItem('access_token'));
            options.headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
            testToken(localStorage.getItem('access_token'));
            // console.log('Headers before second request:', options.headers);
			// console.log(url);
            response = await fetch(url, options);
        }
        else {
            //fazer mensagem que o refresh token está expirado e o user tem de fazer login outra vez, menviar apara a home
            // const messageDiv = messageContainerToken();
            // document.getElementById('root').innerHTML = "";
		    // document.getElementById('root').insertAdjacentHTML('afterbegin', messageDiv);
            // console.log('message problems com refresh token: ');
            // showMessageToken();
            // return; // testar
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
		const url = `${baseURL}/token/refresh/`;
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
            // console.log('data no refresh token function: ', data);
            // console.log('Novo token de acesso:', data.access);
			localStorage.setItem('access_token', data.access);
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


export { fetchWithAuth, refreshAccessToken }
