
import { home, homeLogin } from "../home/home.js";
import { dataUser, fetchUserProfile } from "../profile/myprofile.js";
import { dataUserSearch, dataUserFromSearch, userSearchPage, noResults } from "../search/search_user.js";
import { navigateTo } from "../app.js";
import { displayPageError } from "../html/error_page.js";
import { signIn } from "../login/login.js";
import Language from "../translations/languages.js";
import { edit } from "../profile/edit.js";
import { userProfilePage } from "../profile/userProfile.js";
import { snakeOptions } from "../games/snake-options.js";
import { pongOptions } from "../games/pong-options.js";

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
			console.log('Loading signIn page content');
			signIn();
		},
		access: true // rota publica
	},
	'/register': {
		loadContent: function () {
			console.log('Loading register page content');
			// register();
		},
		access: true //rota publica
	},
	'/user/:username': {
		loadContent: function (params) {
			console.log('Loading user login page content for', params.username);
			homeLogin(params.username);
		},
		access: () => !!localStorage.getItem('access_token'), //testar
		redirect: '/'
	},
	'/error/:status/:message': {
		loadContent: function (params) {
			console.log('Loading user error page content for', params.status, params.message);
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
			console.log('Loading user profile page content for', params.username);
			console.log('dataUser no path: ', dataUser);
			console.log('dataUserFromSearch no path: ', dataUserFromSearch);
			if (dataUser)
				userProfilePage(dataUser, params.username);
			else if (dataUserFromSearch)
				userProfilePage(dataUserFromSearch, params.username);
			else {
				fetchUserProfile(params.username);
			}
		},
		access: () => !!localStorage.getItem('access_token'), //testar
		redirect: '/'
	},
	'/user/:username/profile/edit': {
		loadContent: function (params) {
			console.log('Loading user profile edit page content for', params.username);
			edit(dataUser, params.username);
		},
		access: () => !!localStorage.getItem('access_token'), //testar
		redirect: '/'
	},
	'/user/:username/profile/search/:user': {
		loadContent: function (params) {
			console.log('Loading user profile search user page content for', params.username);
			userSearchPage(dataUserSearch, params.username);
		},
		access: () => !!localStorage.getItem('access_token'), //testar
		redirect: '/'
	},
	'/user/:username/profile/search/noresults/:query': {
		loadContent: function (params) {
			console.log('Loading user profile search user page-no results content for', params.username);
			noResults(params.username, params.query);
		},
		access: () => !!localStorage.getItem('access_token'), //testar
		redirect: '/'
	},
	'/user/:username/snake': {
		loadContent: function (params) {
			snakeOptions(params.username);
		},
		access: () => !!localStorage.getItem('access_token'), //testar
		redirect: '/'
	},	
	'/user/:username/pong': {
		loadContent: function (params) {
			pongOptions(params.username);
		},
		access: () => !!localStorage.getItem('access_token'), //testar
		redirect: '/'
	},
	// Outras páginas...
};

export { pages }