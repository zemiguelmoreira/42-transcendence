import { getIdbyName } from "./myprofile.js";
import { makeProfilePageSearchOther, noResultsPage } from "../html/profile_page.js";
import { getCsrfToken } from "../utils/csrf.js";
import { baseURL } from "../app.js";
import { limparDivAll } from "../utils/utils1.js";
import { navigateTo } from "../app.js";
import { userName } from "../login/login.js";
import { userNameReg } from "../login/register.js";


let dataUserSearch;

function userSearchPage(dataUserSearch, username) {

	// const rootDiv = document.getElementById('root');
	// rootDiv.innerHTML = makeProfilePage(dataUserSearch);
	// console.log(dataUserSearch);
	limparDivAll('root');
	const profilePageDataSearch = makeProfilePageSearchOther(dataUserSearch);
	document.getElementById('root').insertAdjacentHTML('afterbegin', profilePageDataSearch);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/');
	});

	document.getElementById('search-form').addEventListener('submit', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('search-btn').addEventListener('click', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('back-profile').addEventListener('click', (e) => {
			e.preventDefault();
			navigateTo(`/user/${username}/profile`);
	});


}


function noResults(username, query) {

	limparDivAll('root');
	console.log(query);
	const noResultsUserId = noResultsPage(query);
	document.getElementById('root').insertAdjacentHTML('afterbegin', noResultsUserId);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/');
	});

	document.getElementById('search-form').addEventListener('submit', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('search-btn').addEventListener('click', (e) => {
		e.preventDefault();
		getUser(username);
	});

	document.getElementById('backButton').addEventListener('click', function() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			alert('Não há páginas anteriores no histórico.');
		}
	});

}


async function getUser(username) {

	try {
		// em todos os fetchs em que o user está ligado verificara os tokens
		const csrfToken = await getCsrfToken();
		const query = document.getElementById('search-input').value;

		const userID = await getIdbyName(query);

		if (!userID)
		{
			navigateTo(`/user/${username}/profile/search/noresults/${query}`);
			return;
		}

		console.log("user id:");
		console.log(userID);
		
		const response = await fetch(`${baseURL}/users/user-profile/${userID}/`, {
			method: 'GET',
			headers: {
				'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
			}
		});

		if (!response.ok) {
			// throw new Error('Failed to fetch user profile');
			throw {
				message: 'Failed to fetch user profile',
				status: 401,
				status_msg: 'Internal Server Error - Tokens'
			};
		}

		dataUserSearch = await response.json();
		console.log(dataUserSearch);

		if (username === dataUserSearch.username)
			navigateTo(`/user/${username}/profile`);
		else
			navigateTo(`/user/${username}/profile/search/${dataUserSearch.username}`);

	} catch (e) {
		// console.error('Error:', e);
		navigateTo(`/error/${e.status}/${e.message}`);
	}

}


export { dataUserSearch, getUser, userSearchPage, noResults }