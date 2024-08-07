import { displaySlidingMessage } from "../utils/utils1.js";
import { makeProfilePage } from "./profilePages.js";
import { removeToken } from "../utils/tokens.js";
import { navigateTo } from "../app.js";
import { getUser } from "../search/search_user.js";
import { limparDivAll } from "../utils/utils1.js";
import { viewToken } from "../utils/tokens.js";
import { fetchUserProfile } from "../profile/myprofile.js";

function userProfilePage(userData, username) {

	limparDivAll('root');
	console.log('data do user: ', userData.user)
	const profilePageData = makeProfilePage(userData.user);
	document.getElementById('root').insertAdjacentHTML('afterbegin', profilePageData);

	displaySlidingMessage('Welcome to the game! Prepare yourself for an epic adventure!');


	// document.getElementById('homeButton').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	navigateTo(`/user/${username}`);
	// });

	document.getElementById('snake-navbar').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/snake`);
	});

	document.getElementById('pong-navbar').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/pong`);
	});

	document.getElementById('viewProfile').addEventListener('click', (e) => {
		e.preventDefault();
		if (viewToken())
			fetchUserProfile(username); //utilizar as funções verificar tokens
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

	document.getElementById('search-form').addEventListener('submit', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('search-btn').addEventListener('click', (e) => {
		e.preventDefault();
		getUser(username);
	});

}

export { userProfilePage }