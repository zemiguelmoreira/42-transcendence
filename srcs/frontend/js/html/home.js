
import { navigateTo } from "../app.js";
import { navbar1, navbar3 } from "./navbar.js";
import { fetchProtectedData } from "../profile/profile.js";
import { viewToken } from "../login/session.js";
import { fetchUserProfile } from "../profile/myprofile.js";
import { getUser } from "../profile/search_user.js";


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


function homeLogin(username) {

	console.log('Loading homeLogin page content');

	document.getElementById('root').innerHTML = ''; // Apenas um teste
	document.getElementById('root').insertAdjacentHTML('afterbegin', navbar3);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/');
	});

	document.getElementById('testeLink').addEventListener('click', (e) => {
		e.preventDefault();
		if (viewToken())
			fetchProtectedData();
		else
			navigateTo('/signIn');
	});

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