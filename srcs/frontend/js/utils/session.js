
import { getCsrfToken } from "./csrf.js"

function saveToken(access_token, refresh_token) {
    if (access_token && access_token.trim() !== "" && refresh_token && refresh_token.trim() !== "") {
        try {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            console.log('Tokens salvo com sucesso na localStorage.');
        } catch (error) {
            console.error('Erro ao salvar os tokens na localStorage:', error);
        }
    } else {
        console.error('Os tokens não podem ser nulos, indefinidos ou strings vazias.');
    }
}

function saveUsername(username) {
    if (username && username.trim() !== "") {
        try {
            localStorage.setItem('username', username);
            console.log('Username salvo com sucesso na localStorage.');
        } catch (error) {
            console.error('Erro ao salvar o username na localStorage:', error);
        }
    } else {
        console.error('O username não pode ser nulo, indefinido ou uma string vazia.');
    }
}

function viewToken() {
	const token = localStorage.getItem('access_token');
	// console.log(token);
	return token !== null && token !== undefined && token.trim() !== '';
}

function viewTokenRefresh() {
	const refreshToken = localStorage.getItem('refresh_token');
	// console.log(token);
	return refreshToken !== null && refreshToken !== undefined && refreshToken.trim() !== '';
}



function removeToken() {
	try {
		const token = localStorage.getItem('access_token');
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		console.log(`Item com chave "${token}" removido com sucesso da localStorage.`);
	} catch (error) {
		console.error(`Erro ao remover o item com chave "${token}" da localStorage:`, error);
	}
}

// também podemos utilizar o eveto unload

function removeToken2() {

	window.addEventListener('beforeunload', function(event) {
	// Remover o token da localStorage
	localStorage.removeItem('access_token');
	localStorage.removeItem('refresh_token');
  })
}

async function logout(username) {
	const csrfToken = await getCsrfToken();
	if (!csrfToken) {
		throw new Error('CSRF token not found in cookies');
	}
	console.log('CSRF Token:', csrfToken);

	const refresh_token = localStorage.getItem('refresh_token');
	if (!refresh_token) {
		throw new Error('Refresh token not found');
	}
	console.log('Refresh Token:', refresh_token);

	const config = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrfToken,
			'Authorization': `Bearer ${localStorage.getItem('access_token')}`
		},
		body: JSON.stringify({ 
			refresh_token,
			username // Inclui o username aqui
		}),
	};
	try {
        const response = await fetch('/user/profile/logout/', config);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error logging out:', errorText);
            throw new Error('Error logging out');
        }

        removeToken(); // Remove tokens do localStorage após logout bem-sucedido
        window.loadPage('login');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

export { saveToken, saveUsername, viewToken, viewTokenRefresh, removeToken, removeToken2, logout }
