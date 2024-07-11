
import { makeEditProfilePage } from "./profilePages.js";
import { removeToken } from "../utils/tokens.js";
import { navigateTo } from "../app";
import { getUser } from "../search/search_user.js";
import { deleteProfile } from "./deleteAccount.js";


// Funções na página edit
function edit(data, username) {

	const editPageData = makeEditProfilePage(data.user);
	limparDivAll('root');
	document.getElementById('root').insertAdjacentHTML('afterbegin', editPageData);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		removeToken();
		navigateTo('/');
	});

	document.getElementById('cancelEdit').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}/profile`);
	});

	document.getElementById('search-form').addEventListener('submit', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('search-btn').addEventListener('click', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('deleteEdit').addEventListener('click', (e) => {
		e.preventDefault();
		console.log('username botaõ delete: ', username);
		deleteProfile(username);
	});
}


export { edit }