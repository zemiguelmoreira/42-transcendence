import WebSocketInstance from "../socket/websocket.js";
import chatSocketInstance from "../chat/chat_socket.js";
import { navigateTo } from "../app.js";
import { logoutContainer } from "./utils1.js";

function parseJwt(token) {
	const base64Url = token.split('.')[1];
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join(''));
	return JSON.parse(jsonPayload);
}

function testToken(token) {
	let payload;
	if (token) {
		payload = parseJwt(token);
		const currentTimestamp = Math.floor(Date.now() / 1000);
		if (payload.exp < currentTimestamp) {
			return null;
		} else {
			return payload;
		}
	} else {
		return payload;
	}
}

function saveToken(access_token, refresh_token) {
	if (access_token && access_token.trim() !== "" && refresh_token && refresh_token.trim() !== "") {
		try {
			localStorage.setItem('access_token', access_token);
			localStorage.setItem('refresh_token', refresh_token);
		} catch (error) {
			console.error('Erro ao salvar os tokens na localStorage:', error);
		}
	} else {
		console.error('Os tokens não podem ser nulos, indefinidos ou strings vazias.');
	}
}

function viewToken() {
	const token = localStorage.getItem('access_token');
	return token !== null && token !== undefined && token.trim() !== '';
}

function viewTokenRefresh() {
	const refreshToken = localStorage.getItem('refresh_token');
	return refreshToken !== null && refreshToken !== undefined && refreshToken.trim() !== '';
}

function removeToken(username) {
	try {
		const token = localStorage.getItem('access_token');
		const successLogOut = logoutContainer(username);
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
	} catch (error) {
		console.error(`Erro ao remover o item com chave "${token}" da localStorage:`, error);
	}
}

function verifyToken() {
	if (WebSocketInstance.state() === 1) {
		const token = localStorage.getItem('refresh_token');
		if (!testToken(token)) {
			WebSocketInstance.close();
			navigateTo('/');
			removeToken();
		}
	}
	if (chatSocketInstance.state() === 1) {
		const token = localStorage.getItem('refresh_token');
		if (!testToken(token)) {
			chatSocketInstance.close();
			navigateTo('/');
			removeToken();
		}
	}
}

export { saveToken, viewToken, viewTokenRefresh, removeToken, testToken, verifyToken }