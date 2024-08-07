import { navigateTo } from "../app.js";
import { register_page } from "../register/registerPage.js";
import { viewToken } from "../utils/tokens.js";
import { fetchUserProfile } from "../profile/myprofile.js";
import { getUser } from "../search/search_user.js";
import { removeToken } from "../utils/tokens.js";
import { handleSignUp } from "../register/register.js";
import { home_page } from "./homepage.js";
import { displaySlidingMessage } from "../utils/utils1.js";

function home() {
	document.getElementById('root').innerHTML = '';
	document.getElementById('root').insertAdjacentHTML('afterbegin', register_page);
	document.getElementById('signIn').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/signIn');
	});
	const signUp = document.querySelector('#signUp');
	signUp.addEventListener('click', handleSignUp);
}

function homeLogin(username) {
	console.log('Loading homeLogin page content');
	document.getElementById('root').innerHTML = '';
	document.getElementById('root').insertAdjacentHTML('afterbegin', home_page);

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
	
	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		removeToken(username);
		setTimeout(function() {
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