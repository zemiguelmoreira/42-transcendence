import { navigateTo } from "../app.js";
import { register_page } from "../register/registerPage.js";
import { viewToken } from "../utils/tokens.js";
import { fetchUserProfile } from "../profile/myprofile.js";
import { getUser } from "../search/search_user.js";
import { removeToken } from "../utils/tokens.js";
import { handleSignUp } from "../register/register.js";
import { home_page } from "./homepage.js";

// função para a home page
function home() {
	console.log('Loading home page content');
	document.getElementById('root').innerHTML = '';
	document.getElementById('root').insertAdjacentHTML('afterbegin', register_page);
	document.getElementById('signIn').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/signIn');
	});

	const signUp = document.querySelector('#signUp');
	signUp.addEventListener('click', handleSignUp);

	// document.getElementById('register').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	navigateTo('/register');
	// });
	// document.getElementById('home').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	navigateTo('/');
	// });
}

// // função para a home page -  user com tokens
function homeLogin(username) {
	console.log('Loading homeLogin page content');
	document.getElementById('root').innerHTML = ''; // Apenas um teste
	// document.getElementById('root').insertAdjacentHTML('afterbegin', navbar3);
	document.getElementById('root').insertAdjacentHTML('afterbegin', home_page);
	// document.getElementById('root').innerHTML = home_page;

	// document.getElementById('snake-button').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	navigateTo(`/user/${username}/snake`);
	// });

	// document.getElementById('logOut').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	removeToken();
	// 	navigateTo('/');
	// });

	// document.getElementById('testeLink').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// });

	// document.getElementById('viewProfile').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// 	if (viewToken())
	// 		fetchUserProfile(username); //utilizar as funções verificar tokens
	// 	else
	// 		navigateTo('/signIn');
	// });

	document.getElementById('search-form').addEventListener('submit', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('search-btn').addEventListener('click', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('backButton').addEventListener('click', function () {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			alert('Não há páginas anteriores no histórico.');
		}
	});

}

export { home, homeLogin }
