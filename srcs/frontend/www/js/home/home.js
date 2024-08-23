import { navigateTo } from "../app.js";
import { register_page } from "../register/registerPage.js";
import { viewToken } from "../utils/tokens.js";
import { fetchUserProfile , fetchUserProfileSettings } from "../profile/myprofile.js";
import { getUser } from "../search/search_user.js";
import { removeToken } from "../utils/tokens.js";
import { handleSignUp } from "../register/register.js";
import { displaySlidingMessage } from "../utils/utils1.js";
import { getUserProfileByUsername } from "../profile/myprofile.js";
import { makeHomePage } from "./homepage.js";
import { goTo } from "../app.js";
import chatSocketInstance from "../chat/chat_socket.js";
import WebSocketInstance from "../socket/websocket.js";
import { doChat } from "../chat/chat_window.js";

function home() {
	console.log('Loading home page content');

	document.getElementById('root').innerHTML = '';
	document.getElementById('root').insertAdjacentHTML('afterbegin', register_page);

	document.getElementById('signIn').addEventListener('click', (e) => {
		e.preventDefault();
		// navigateTo('/signIn');
		(!localStorage.getItem('access_token')) ? navigateTo('/signIn') : goTo(); // função para evitar o login quando tenho token
	});

	const signUp = document.querySelector('#signUp');
	signUp.addEventListener('click', handleSignUp);
}

function closeSlidingWindow() {
	var slidingWindow = document.querySelector('.sliding-window');
	if (slidingWindow && slidingWindow.classList.contains('open')) {
		slidingWindow.classList.remove('open');
		slidingWindow.classList.add('closed');

		// Atualizar o ícone do botão se necessário
		var chatButton = document.getElementById('chatButton');
		if (chatButton) {
			chatButton.src = '../../files/arrow-right-square-fill.svg'; // Ícone para abrir
		}
	}
}

async function homeLogin(username) {

	// Use await para resolver a Promise retornada por getUserProfileByUsername
	let dataUser = await getUserProfileByUsername(username);
	console.log('dataUser no homeLogin: ', dataUser);	

	// Limpa o conteúdo do root antes de carregar a nova página
	document.getElementById('root').innerHTML = '';

	// Use await para garantir que o conteúdo da página seja gerado antes de inseri-lo
	const home_page = makeHomePage(dataUser);
	document.getElementById('root').insertAdjacentHTML('afterbegin', home_page);

	// Carregue o script do chat
	doChat(username);

	// Adicione o event listener para o botão de chat
	document.getElementById('chatButton').addEventListener('click', function () {
		var slidingWindow = document.querySelector('.sliding-window');
		if (slidingWindow.classList.contains('closed')) {
			slidingWindow.classList.remove('closed');
			slidingWindow.classList.add('open');
			this.src = '../../files/arrow-left-square-fill.svg'; // Altere para o ícone de fechar se necessário
		} else {
			slidingWindow.classList.remove('open');
			slidingWindow.classList.add('closed');
			this.src = '../../files/arrow-right-square-fill.svg'; // Altere para o ícone de abrir se necessário
		}
	});

	// Adicione todos os event listeners necessários
	document.getElementById('homeButton').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);
	});

	document.getElementById('snake-navbar').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/snake`);
	});

	document.getElementById('pong-card').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/pong`);
	});

	document.getElementById('pong-navbar').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/pong`);
	});

	document.getElementById('snake-card').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/snake`);
	});

	document.getElementById('viewProfile').addEventListener('click', (e) => {
		e.preventDefault();
		if (viewToken())
			fetchUserProfile(username);
		else
			navigateTo('/signIn');
	});

	document.getElementById('viewSettings').addEventListener('click', (e) => {
		e.preventDefault();
		if (viewToken())
			fetchUserProfileSettings(username);
		else
			navigateTo('/signIn');
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		removeToken(username);
        chatSocketInstance.close();
        WebSocketInstance.close();
		setTimeout(function () {
			navigateTo('/');
		}, 2000);
	});

	// document.getElementById('chatButton').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	navigateTo(`/user/${username}/chat`);
	// });

	document.getElementById('chatCard').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/chat`);
	});

	document.getElementById('search-form').addEventListener('submit', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('search-btn').addEventListener('click', (e) => {
		e.preventDefault();
		getUser(username);
	});

	displaySlidingMessage('Welcome to the game! Prepare yourself for an epic adventure!');
}


export { home, homeLogin , closeSlidingWindow }