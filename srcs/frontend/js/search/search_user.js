import { getUserProfileByUsername } from "../profile/myprofile.js";
import { makeProfilePageSearchOther, noResultsPage } from "../profile/profilePages.js";
import { getCsrfToken } from "../utils/tokenCsrf.js";
import { limparDivAll } from "../utils/utils1.js";
import { navigateTo} from "../app.js";
import { fetchWithAuth } from "../utils/fetchWithToken.js";



let dataUserSearch;
let dataUserFromSearch;

function userSearchPage(dataUserSearch, username) {

	// const rootDiv = document.getElementById('root');
	// rootDiv.innerHTML = makeProfilePage(dataUserSearch);
	// console.log(dataUserSearch);
	limparDivAll('root');
	const profilePageDataSearch = makeProfilePageSearchOther(dataUserSearch.user);
	document.getElementById('root').insertAdjacentHTML('afterbegin', profilePageDataSearch);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		removeToken();
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

	// let csrfToken;

    // try {
    //     csrfToken = await getCsrfToken();
    //     console.log(csrfToken);

    //     if (!csrfToken) {
    //         throw {
    //             message: 'csrf token error - getUser',
    //             status: 401,
    //             status_msn: 'CSRF token not found'
    //         };
    //     }
    // } catch (error) {
    //     console.log(error.message, error.status, error.status_msn);
    //     navigateTo(`/error/${error.status}/${error.message}`);
    //     return;
    // }

	const conf = {
		method: 'GET',
		headers: {
			// 'X-CSRFToken': csrfToken
		}
	}	

	try {
		// em todos os fetchs em que o user está ligado verificara os tokens
		// const csrfToken = await getCsrfToken();
		const query = document.getElementById('search-input').value;

		const user = await getUserProfileByUsername(query);

		// console.log(user.username);

		if (!user)
		{
			navigateTo(`/user/${username}/profile/search/noresults/${query}`);
			return;
		}

		console.log("user: ", user);
		
		dataUserSearch = user;
		console.log(dataUserSearch);

		if(username === dataUserSearch.user.username) {
			console.log('teste passei aqui');
			dataUserFromSearch = user;
			console.log('data user from search', dataUserFromSearch);
			navigateTo(`/user/${username}/profile`);
		}
		else
			navigateTo(`/user/${username}/profile/search/${dataUserSearch.user.username}`);

	} catch (e) {
		// console.error('Error:', e);
		navigateTo(`/error/${e.status}/${e.message}`);
	}

}


export { dataUserSearch, dataUserFromSearch, getUser, userSearchPage, noResults }