import { home, homeLogin, changeChatLoaded } from "../home/home.js";
import { dataUser, fetchUserProfile , getUserProfileByUsername } from "../profile/myprofile.js";
import { dataUserSearch, dataUserFromSearch, userSearchPage, getUser } from "../search/search_user.js";
import { navigateTo } from "../app.js";
import { displayPageError } from "../html/error_page.js";
import { signIn } from "../login/login.js";
import { edit } from "../profile/edit.js";
import { userProfilePage, profileSettings } from "../profile/userProfile.js";
import { snakeOptions } from "../games/snake-options.js";
import { pongOptions } from "../games/pong-options.js";
import { snakeGameLocal, snakeGameRemote, snakeGameMultiplayer } from "../games/snake-pages.js";
import { pongGameLocal, pongGameRemote, pongGameTournament } from "../games/pong-pages.js";
import { noResults } from "../search/search_user.js";
import { displayChangePassword } from "../profile/userProfile.js";
import  { leaderboard } from "../games/leaderboard.js";

const pages = {
	'/': {
		loadContent: function () {
			console.log('home page loaded');
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

			let makeError;
			const main = document.getElementById('mainContent');
			console.log('main: ', main);
			if (main) {
				console.log('main no main: ', main);
				makeError = displayPageError(params.status, params.message);
				main.innerHTML = '';
				main.insertAdjacentHTML('afterbegin', makeError);
			} else {
				makeError = displayPageError(params.status, params.message);
				document.getElementById('root').innerHTML = '';
				document.getElementById('root').insertAdjacentHTML('afterbegin', makeError);
			}
			const home_error = document.getElementById('a_error');
			home_error.addEventListener('click', (e) => {
				e.preventDefault();
				navigateTo('/');
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				sessionStorage.removeItem('access_token');
			});

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
	'/user/:username/profile/update-password': {
		loadContent: function (params) {
			displayChangePassword(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/profile/search/:user': {
		loadContent: function (params) {
			if (dataUserSearch)
				userSearchPage(dataUserSearch, params.user);
			else {
				getUser(params.username, params.user);
			}
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
		loadContent: function (params) {
			if (dataUser) {
				profileSettings(dataUser);
			} else if (dataUserFromSearch)
				profileSettings(dataUserFromSearch);
			else {
				fetchUserProfile(params.username, `/user/${params.username}/settings`);
			}
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/leaderboard': {
		loadContent: function (params) {
			leaderboard(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/chat-playing': {
		loadContent: function (params) {
			// snakeOptions(params.username); cancel voltava sempre ao snake
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
		loadContent: async function (params) {
			let dataUsername = await getUserProfileByUsername(params.username);
			snakeGameLocal(params.username, dataUsername);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/snake-game-remote': {
		loadContent: async function (params) {
			snakeGameRemote(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/snake-game-free-for-all': {
		loadContent: async function (params) {
			let dataUsername = await getUserProfileByUsername(params.username);
			snakeGameMultiplayer(params.username, dataUsername);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/pong': {
		loadContent: function (params) {
			pongOptions(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/pong-game-local': {
		loadContent: async function (params) {
			let dataUsername = await getUserProfileByUsername(params.username);
			pongGameLocal(params.username, dataUsername);
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
		loadContent: async function (params) {
			let dataUsername = await getUserProfileByUsername(params.username);
			pongGameTournament(params.username, dataUsername);
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
