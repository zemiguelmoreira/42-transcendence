import { home, homeLogin, changeChatLoaded } from "../home/home.js";
import { dataUser, fetchUserProfile } from "../profile/myprofile.js";
import { dataUserSearch, dataUserFromSearch, userSearchPage } from "../search/search_user.js";
import { navigateTo } from "../app.js";
import { displayPageError } from "../html/error_page.js";
import { signIn } from "../login/login.js";
import { edit } from "../profile/edit.js";
import { userProfilePage, profileSettings } from "../profile/userProfile.js";
import { snakeOptions } from "../games/snake-options.js";
// import { /*loadSnakeRemoteScript , */loadSnakeLocalScript , loadSnakeMultiplayerScript } from "../games/snake-pages.js";
import { /*loadSnakeRemoteScript, */ snakeGameRemote, loadSnakeLocalScript, loadSnakeMultiplayerScript, snakeGameLocal, snakeGameMultiplayer } from "../games/snake-pages.js";
import { pongOptions } from "../games/pong-options.js";
import { snakeGameLocal, snakeGameRemote, snakeGameMultiplayer } from "../games/snake-pages.js";
import { pongGameLocal, pongGameRemote, pongGameTournament } from "../games/pong-pages.js";
import { noResults } from "../search/search_user.js";

const pages = {
	'/': {
		loadContent: function () {
			changeChatLoaded(); // para conseguir carregar a página da home totalmente
			home();
		},
		access: true
	},
	'/signIn': {
		loadContent: function () {
			changeChatLoaded(); // para conseguir carregar a página da home totalmente
			signIn();
		},
		access: true
	},
	'/register': {
		loadContent: function () {
		},
		access: true
	},
	'/callback': {
		loadContent: function () {
			const auth42Element = `
				<div style="height: 100%; display: flex; color: green; justify-content: center; align-items: center;">
				<p style="font-size: 30px;">Authenticating with 42...</p>
				</div>`;
			document.getElementById('root').innerHTML = '';
			document.getElementById('root').innerHTML = auth42Element;
		},
		access: true
	},
	'/user/:username': {
		loadContent: function (params) {
			sessionStorage.removeItem('access_token'); // saiu da função de signIn e passou para aqui
			homeLogin(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/error/:status/:message': {
		loadContent: function (params) {
			const makeError = displayPageError(params.status, params.message);
			document.getElementById('root').innerHTML = '';
			document.getElementById('root').insertAdjacentHTML('afterbegin', makeError);
			const home_error = document.getElementById('a_error');
			home_error.addEventListener('click', (e) => {
				e.preventDefault();
				navigateTo('/');
			});
			// setTimeout(() => {
				// navigateTo('/');
			// }, 3000);
		},
		access: true
	},
	'/user/:username/profile': {
		loadContent: function (params) {
			if (dataUser)
				userProfilePage(dataUser, params.username);
			else if (dataUserFromSearch)
				userProfilePage(dataUserFromSearch, params.username);
			else {
				fetchUserProfile(params.username);
			}
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/profile/edit': {
		loadContent: function (params) {
			if (dataUser) {
				edit(dataUser, params.username);
			} else if (dataUserFromSearch) {
				edit(dataUserFromSearch, params.username);
			} else {
				fetchUserProfile(params.username, `/user/${params.username}/profile/edit`);
			}
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/profile/search/:user': {
		loadContent: function (params) {
			userSearchPage(dataUserSearch, params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/profile/search/noresults/:query': {
		loadContent: function (params) {
			noResults(params.username, params.query);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/settings': {
		loadContent: function () {
			if (dataUser) {
				profileSettings(dataUser);
			}
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/snake-playing': {
		loadContent: function (params) {
			snakeOptions(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/snake': {
		loadContent: function (params) {
			snakeOptions(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/snake-game-local': {
		loadContent: function (params) {
			snakeGameLocal(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/snake-game-remote': {
		loadContent: function (params) {
			snakeGameRemote(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/snake-game-free-for-all': {
		loadContent: function (params) {
			snakeGameMultiplayer(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/pong-playing': {
		loadContent: function (params) {
			pongOptions(params.username, params.guest);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/pong': {
		loadContent: function (params) {
			pongOptions(params.username, params.guest);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/pong-game-local': {
		loadContent: function (params) {
			pongGameLocal(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/pong-game-remote': {
		loadContent: function (params) {
			pongGameRemote(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/pong-game-tournament': {
		loadContent: function (params) {
			pongGameTournament(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/chat': {
		loadContent: function (params) {
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},

}

export { pages }