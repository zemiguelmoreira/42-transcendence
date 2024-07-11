
import { navigateTo } from "../app.js";
import { navbar1, navbar3 } from "../html/navbar.js";
import { viewToken } from "../utils/tokens.js";
import { fetchUserProfile } from "../profile/myprofile.js";
import { getUser } from "../search/search_user.js";
import { removeToken } from "../utils/tokens.js";


// função para a home page
function home() {

	console.log('Loading home page content');

	document.getElementById('root').innerHTML = ''; // Apenas um teste
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar1);

	document.getElementById('signIn').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/signIn');});

	document.getElementById('register').addEventListener('click', (e) => {
			e.preventDefault();
			navigateTo('/register');});

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/');});		
}


// // função para a home page -  user com tokens
function homeLogin(username) {

	console.log('Loading homeLogin page content');

	document.getElementById('root').innerHTML = ''; // Apenas um teste
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar3);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		removeToken();
		navigateTo('/');
	});

	// document.getElementById('testeLink').addEventListener('click', (e) => {
	// 	e.preventDefault();
	// });

	document.getElementById('my-profile').addEventListener('click', (e) => {
		e.preventDefault();
		if (viewToken())
			fetchUserProfile(username); //utilizar as funções verificar tokens
		else
			navigateTo('/signIn');
		
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


export { home, homeLogin }