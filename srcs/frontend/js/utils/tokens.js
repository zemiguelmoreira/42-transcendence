
import WebSocketInstance from "../socket/websocket.js";
import { navigateTo } from "../app.js";

// Função de parse do Token
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

	let payload; // neste momento está undefined
	if (token) {
		payload = parseJwt(token);
		// console.log(payload); // Verifique as claims
	
		const currentTimestamp = Math.floor(Date.now() / 1000);
		if (payload.exp < currentTimestamp) {
			console.log('Token expirado');
			return null;
		} else {
			console.log('Token válido');
			return payload;
		}
	} else {
		console.log('Token não encontrado no localStorage');
		return payload;
	}

}


// Função que salva os Tokens
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


// Função de teste ao access_token - devolve um boleano
function viewToken() {
	const token = localStorage.getItem('access_token');
	// console.log(token);
	return token !== null && token !== undefined && token.trim() !== '';
}


// Função de teste ao refresh_token - devolve um boleano
function viewTokenRefresh() {
	const refreshToken = localStorage.getItem('refresh_token');
	// console.log(token);
	return refreshToken !== null && refreshToken !== undefined && refreshToken.trim() !== '';
}


// Função que remove os tokens
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


// Função utilizada para verificar a validade do refres token e se não for  válido desliga a socket
// tentar utilizar  o login que vem do server
function verifyToken() {
	// console.log('user is login na verifyToken: ', WebSocketInstance.state());
	if(WebSocketInstance.state() === 1) {
		console.log("estado da socket", WebSocketInstance.state()); // verificação da socket teste
		const token = localStorage.getItem('refresh_token');
		if (!testToken(token)) {
			console.log("desligar a socket");
			WebSocketInstance.close();
			navigateTo('/');
			removeToken();
		} else {
			console.log('token válido mantém a socket')
		}
	} else {
		console.log('user is logout');
	}

}


export { saveToken, viewToken, viewTokenRefresh, removeToken, testToken, verifyToken }
