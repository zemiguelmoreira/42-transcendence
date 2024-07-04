import { getCsrfToken } from "../utils/csrf.js";
import { makeProfilePage, makeEditProfilePage } from "../html/profile_page.js";
import { deleteProfile } from "../profile/delete_account.js";
import { limparDivAll } from "../utils/utils1.js";
import { baseURL } from "../app.js";
import { getUser } from "../profile/search_user.js";
import { navigateTo } from "../app.js";
import { fetchWithAuth } from "./profile.js";


let userData;

// Obtem o user id do user que está login
async function getIdbyName(username) {

	let csrfToken;

    try {
        csrfToken = await getCsrfToken();
        console.log(csrfToken);

        if (!csrfToken) {
            throw {
                message: 'csrf token error - getIdbyName',
                status: 401,
                status_msn: 'CSRF token not found'
            };
        }
    } catch (error) {
        console.log(error.message, error.status, error.status_msn);
        navigateTo(`/error/${error.status}/${error.message}`);
        return;
    }

	const dados = { user: username };

	const conf = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json', // Adicionando o Content-Type correto
			'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
			'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
		},
		body: JSON.stringify(dados),
	}

	try {
		// const csrfToken = await getCsrfToken(); // Obter o token CSRF
		// const dados = { user: username };

		const response = await fetchWithAuth(`${baseURL}/get-user-id/`, conf);

		if (!response.ok) {
			throw new Error('Failed to fetch user profile');
		}

		const data = await response.json();
		// console.log("id: ");
		// console.log(data.id);
		return data.id;
	} catch (error) {
		console.error('Error:', error);
		return null;
	};
}


async function getNamebyId(user_id) {

	let csrfToken;

    try {
        csrfToken = await getCsrfToken();
        console.log(csrfToken);

        if (!csrfToken) {
            throw {
                message: 'csrf token error - getNamebyId',
                status: 401,
                status_msn: 'CSRF token not found'
            };
        }
    } catch (error) {
        console.log(error.message, error.status, error.status_msn);
        navigateTo(`/error/${error.status}/${error.message}`);
        return;
    }

	const dados = { id: user_id };

	const conf = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json', // Adicionando o Content-Type correto
			'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
			'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
		},
		body: JSON.stringify(dados),
	}

	try {
		// const csrfToken = await getCsrfToken(); // Obter o token CSRF
		// const dados = { id: user_id };

		const response = await fetchWithAuth(`${baseURL}/get-user-username/`, conf);

		if (!response.ok) {
			throw new Error('Failed to fetch user profile');
		}
		const data = await response.json();
		// console.log("id: ");
		console.log(data);
		console.log(data.username);
		return data.username;
	} catch (error) {
		console.error('Error:', error);
		return null;
	};
}


async function getIdbyNameList(userName) {

	let csrfToken;

    try {
        csrfToken = await getCsrfToken();
        console.log(csrfToken);

        if (!csrfToken) {
            throw {
                message: 'csrf token error - getIdbyName',
                status: 401,
                status_msn: 'CSRF token not found'
            };
        }
    } catch (error) {
        console.log(error.message, error.status, error.status_msn);
        navigateTo(`/error/${error.status}/${error.message}`);
        return;
    }

	const dados = { user: userName };

	const conf = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json', // Adicionando o Content-Type correto
			'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
			'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
		},
		body: JSON.stringify(dados),
	}

	try {
		// const csrfToken = await getCsrfToken(); // Obter o token CSRF
		const dados = { user: userName };

		const response = await fetchWithAuth(`${baseURL}/get-user-id-list/`, conf);

		if (!response.ok) {
			throw new Error('Failed to fetch user profile');
		}
		const data = await response.json();
		// console.log("id: ");
		console.log("query: ", data);
		return data;
	} catch (error) {
		console.error('Error:', error);
		return null;
	};
}


// Funções na página edit
function editPageBtns(data, username) {

	const editPageData = makeEditProfilePage(data);
	limparDivAll('root');
	document.getElementById('root').insertAdjacentHTML('afterbegin', editPageData);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${username}`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
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
		deleteProfile(username);
	});
}



function userDataPage(userData, username) {

	limparDivAll('root');
	const profilePageData = makeProfilePage(userData);
	document.getElementById('root').insertAdjacentHTML('afterbegin', profilePageData);

	document.getElementById('home').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${userData.username}`);
	});

	document.getElementById('logOut').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo('/');
	});

	document.querySelector("#editProfile").addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${userData.username}/profile/edit`);
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



// Obtém os dados do user que está login e faz a página
async function fetchUserProfile(username) {

	let csrfToken;

    try {
        csrfToken = await getCsrfToken();
        console.log(csrfToken);

        if (!csrfToken) {
            throw {
                message: 'csrf token error - fetchUserProfile',
                status: 401,
                status_msn: 'CSRF token not found'
            };
        }
    } catch (error) {
        console.log(error.message, error.status, error.status_msn);
        navigateTo(`/error/${error.status}/${error.message}`);
        return;
    }

	const conf = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrfToken
		}
	}
	try {

		const userId = await getIdbyName(username);
		// const csrfToken = await getCsrfToken(); // Obter o token CSRF

		// const response = await fetch(`${baseURL}/user-profile/${userId}/`, {
		// 	method: 'GET',
		// 	headers: {
		// 		'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
		// 	}
		// });

		console.log('teste ao fetchwitauth');
		const response = await fetchWithAuth(`${baseURL}/user-profile/${userId}/`, conf);

		if (!response.ok) {
			// throw new Error('Failed to fetch user profile');
			throw {
				message: 'Failed to fetch user profile - protected',
				status: 401,
				status_msg: 'Internal Server Error - user id'
			};
		}

		userData = await response.json();
		console.log(userData);

		navigateTo(`/user/${username}/profile`);

	} catch (e) {
		// console.error('Error:', e);
		navigateTo(`/error/${e.status}/${e.message}`);
	}
}


export { userData, getIdbyName, getIdbyNameList, getNamebyId, fetchUserProfile, userDataPage, editPageBtns };