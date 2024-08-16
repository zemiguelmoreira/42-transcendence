import { navigateTo } from "../app.js";
import { register_page } from "../register/registerPage.js";
import { viewToken } from "../utils/tokens.js";
import { fetchUserProfile } from "../profile/myprofile.js";
import { getUser } from "../search/search_user.js";
import { removeToken } from "../utils/tokens.js";
import { handleSignUp } from "../register/register.js";
import { displaySlidingMessage } from "../utils/utils1.js";
import { getUserProfileByUsername } from "../profile/myprofile.js";
import { makeHomePage } from "./homepage.js";

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

async function homeLogin(username) {
	// Use await para resolver a Promise retornada por getUserProfileByUsername
	let dataUser = await getUserProfileByUsername(username);
	// console.log('dataUser no homeLogin: ', dataUser);	

	// Limpa o conteúdo do root antes de carregar a nova página
	document.getElementById('root').innerHTML = '';

	// Use await para garantir que o conteúdo da página seja gerado antes de inseri-lo
	const home_page = await makeHomePage(dataUser);
	document.getElementById('root').insertAdjacentHTML('afterbegin', home_page);

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
		console.log('viewSettings clicked');
		navigateTo(`/user/${username}/settings`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		removeToken(username);
		setTimeout(function () {
			navigateTo('/');
		}, 2000);
	});

	document.getElementById('chatButton').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/chat`);
	});

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


export { home, homeLogin }