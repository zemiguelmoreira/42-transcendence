import { getUserProfileByUsername } from "../profile/myprofile.js";
import { makeProfilePageSearchOther, noResultsPage } from "../profile/profilePages.js";
import { getCsrfToken } from "../utils/tokenCsrf.js";
import { limparDivAll } from "../utils/utils1.js";
import { navigateTo } from "../app.js";
import { messageContainerToken } from "../utils/utils1.js";

let dataUserSearch;
let dataUserFromSearch;

function userSearchPage(dataUserSearch, username) {
	console.log('userSearchPage: ', dataUserSearch);
	document.getElementById('mainContent').innerHTML = '';
	// const profilePageDataSearch = makeProfilePageSearchOther(dataUserSearch.user);
	const profilePageDataSearch = makeProfilePageSearchOther(dataUserSearch);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profilePageDataSearch);
}

function noResults(username, query) {

	document.getElementById('mainContent').innerHTML = '';
	const noResultsUserId = noResultsPage(query);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', noResultsUserId);

}

async function getUser(username) {

	// let csrfToken;

	// try {
	//     csrfToken = await getCsrfToken();
	// console.log(csrfToken);

	//     if (!csrfToken) {
	//         throw {
	//             message: 'csrf token error - getUser',
	//             status: 401,
	//             status_msn: 'CSRF token not found'
	//         };
	//     }
	// } catch (error) {
	//    console.log(error.message, error.status, error.status_msn);
	//     navigateTo(`/error/${error.status}/${error.message}`);
	//     return;
	// }

	const conf = {
		method: 'GET',
		headers: {
			// 'X-CSRFToken': csrfToken
		}
	}

	// console.log('Parametro recebido: ', username);

	try {
		let query;

		const searchInputElement = document.getElementById('search-input');

		try {
			query = searchInputElement.value;
		} catch (e) {
			console.error('Error:', e);
			navigateTo(`/error/${e.status}/${e.message}`);
		}

		// Agora tenta obter o perfil do usuário com a query
		const user = await getUserProfileByUsername(query);
		// console.log('Resposta no getUser: ', user);

		if (user.status && user.status === 404) {
			// Se o usuário não for encontrado, navega para a página de "sem resultados"
			navigateTo(`/user/${username}/profile/search/noresults/${query}`);
			return;
		} else if (user.status && user.status === 401) {
			// Se o usuário não tiver permissão (status 401), mostra mensagem e redireciona para login
			const messageDiv = messageContainerToken();
			document.getElementById('root').innerHTML = "";
			document.getElementById('root').insertAdjacentHTML('afterbegin', messageDiv);
			// console.log('Problemas com o token de refresh: ');
			const messageContainer = document.getElementById('tokenMessage');
			messageContainer.style.display = 'block'; // Exibe a mensagem

			setTimeout(function () {
				messageContainer.style.display = 'none';
				navigateTo(`/signIn`);
			}, 2000); // 1000 milissegundos = 1 segundo
			return;
		}

		dataUserSearch = user;
		// console.log(dataUserSearch);

		if (username === dataUserSearch.user.username) {
			// Se o usuário pesquisado for o próprio usuário logado, navega para o perfil dele
			// console.log('Usuário pesquisado é o próprio usuário logado.');
			dataUserFromSearch = user;
			// console.log('data user from search', dataUserFromSearch);
			navigateTo(`/user/${username}/profile`);
		} else {
			// Caso contrário, navega para o perfil do usuário pesquisado
			navigateTo(`/user/${username}/profile/search/${dataUserSearch.user.username}`);
		}

	} catch (e) {
		// Em caso de erro, navega para a página de erro correspondente
		console.error('Error:', e);
		navigateTo(`/error/${e.status}/${e.message}`);
	}

}

async function viewUserProfile(username, searchUser) {
	console.log('viewUserProfile: ', searchUser);

	const conf = {
		method: 'GET',
		headers: {
			// 'X-CSRFToken': csrfToken
		}
	}
	try {
		let query = searchUser;
		const user = await getUserProfileByUsername(query);
		if (user.status && user.status === 404) {
			navigateTo(`/user/${username}/profile/search/noresults/${query}`);
			return;
		} else if (user.status && user.status === 401) {
			const messageDiv = messageContainerToken();
			document.getElementById('root').innerHTML = "";
			document.getElementById('root').insertAdjacentHTML('afterbegin', messageDiv);
			const messageContainer = document.getElementById('tokenMessage');
			messageContainer.style.display = 'block';
			setTimeout(function () {
				messageContainer.style.display = 'none';
				navigateTo(`/signIn`);
			}, 2000);
			return;
		}
		dataUserSearch = user;
		// console.log(dataUserSearch);
		if (username === dataUserSearch.user.username) {
			dataUserFromSearch = user;
			navigateTo(`/user/${username}/profile`);
		} else {
			navigateTo(`/user/${username}/profile/search/${dataUserSearch.user.username}`);
		}
	} catch (e) {
		navigateTo(`/error/${e.status}/${e.message}`);
	}
}

export { dataUserSearch, dataUserFromSearch, getUser, viewUserProfile, userSearchPage, noResults }