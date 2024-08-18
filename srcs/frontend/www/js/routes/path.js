
import { home, homeLogin } from "../home/home.js";
import { dataUser, fetchUserProfile } from "../profile/myprofile.js";
import { dataUserSearch, dataUserFromSearch, userSearchPage } from "../search/search_user.js";
import { navigateTo } from "../app.js";
import { displayPageError } from "../html/error_page.js";
import { signIn } from "../login/login.js";
import Language from "../translations/languages.js";
import { edit } from "../profile/edit.js";
import { userProfilePage , profileSettings } from "../profile/userProfile.js";
import { snakeOptions } from "../games/snake-options.js";
import { snakeGameLocal } from "../games/snake-local.js";
import { pongOptions } from "../games/pong-options.js";
import { doChat } from "../chat/chat-window.js";
import { noResults } from "../search/search_user.js";

const pages = {
	'/': {
		loadContent: function () {
			home();
			Language.applyTranslations('home');
		},
		access: true
	},
	'/signIn': {
		loadContent: function () {
			// console.log('Loading signIn page content');
			signIn();
		},
		access: true // rota publica
	},
	'/register': {
		loadContent: function () {
			// console.log('Loading register page content');
			// register();
		},
		access: true //rota publica
	},
	'/user/:username': {
		loadContent: function (params) {
			// console.log('Loading user login page content for', params.username);
			homeLogin(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/error/:status/:message': {
		loadContent: function (params) {
			// console.log('Loading user error page content for', params.status, params.message);
			const makeError = displayPageError(params.status, params.message);
			document.getElementById('root').innerHTML = '';
			document.getElementById('root').insertAdjacentHTML('afterbegin', makeError);
			const home_error = document.getElementById('a_error');
			home_error.addEventListener('click', (e) => {
				e.preventDefault();
				navigateTo('/');
			});
			// Adiciona um timer de 3 segundos para navegação automática
			setTimeout(() => {
				navigateTo('/');
			}, 3000);
		},
		access: true
	},
	'/user/:username/profile': {
		loadContent: function (params) {
			// console.log('Loading user profile page content for', params.username);
			// console.log('dataUser no path: ', dataUser);
			// console.log('dataUserFromSearch no path: ', dataUserFromSearch);
			// console.log('params.username: ', params.username);
			// console.log('params: ', params);
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
			// console.log('Loading user profile edit page content for', params.username);
			if (dataUser) {
				edit(dataUser, params.username);
			} else if (dataUserFromSearch) {
				edit(dataUserFromSearch, params.username);
			} else {	
				fetchUserProfile(params.username);
			}
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/profile/search/:user': {
		loadContent: function (params) {
			// console.log('Loading user profile search user page content for', params.username);
			userSearchPage(dataUserSearch, params.username);
			
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/profile/search/noresults/:query': {
		loadContent: function (params) {
			// console.log('Loading user profile search user page-no results content for', params.username);
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
	'/user/:username/pong': {
		loadContent: function (params) {
			pongOptions(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	'/user/:username/chat': {
		loadContent: function (params) {
			// chatWindow(params.username);
			console.log('Loading chat content for', params.username);
			doChat(params.username);
		},
		access: () => !!localStorage.getItem('access_token'),
		redirect: '/'
	},
	// Outras páginas...
};

export { pages }