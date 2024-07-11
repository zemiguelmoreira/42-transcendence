
import { makeProfilePage } from "./profilePages.js";
import { removeToken } from "../utils/tokens.js";
import { navigateTo } from "../app.js";
import { getUser } from "../search/search_user.js";


function userProfilePage(userData, username) {

	limparDivAll('root');
	console.log('data do user: ', userData.user)
	const profilePageData = makeProfilePage(userData.user);
	document.getElementById('root').insertAdjacentHTML('afterbegin', profilePageData);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		removeToken();
		navigateTo('/');
	});

	document.querySelector("#editProfile").addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/profile/edit`);
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