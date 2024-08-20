import { getCsrfToken } from "../utils/tokenCsrf.js";
import { baseURL, navigateTo} from "../app.js";
import { fetchWithAuth } from "../utils/fetchWithToken.js";

let dataUser

// Obtem os dados do user que queremos fazer  vem da função getUser-search_user.js
async function getUserProfileByUsername(username) {

	// let csrfToken;

    // try {
    //     csrfToken = await getCsrfToken();
        // console.log(csrfToken);

    //     if (!csrfToken) {
    //         throw {
    //             message: 'csrf token error - getIdbyName',
    //             status: 401,
    //             status_msn: 'CSRF token not found'
    //         };
    //     }
    // } catch (error) {
        // console.log(error.message, error.status, error.status_msn);
    //     navigateTo(`/error/${error.status}/${error.message}`);
    //     return;
    // }

	// const dados = { user: username };

	let response;

	const conf = {
		method: 'GET',
		headers: {
			// 'Content-Type': 'application/json', // Adicionando o Content-Type correto
			// 'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
			// 'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
		},
		// body: JSON.stringify(dados),
	}

	try {
		// const csrfToken = await getCsrfToken(); // Obter o token CSRF
		// const dados = { user: username };

		// console.log('username: ', username);
		response = await fetchWithAuth(`/api/profile/get_user_profile/?username=${username}`, conf);

		// console.log('response no get de um user: ', response);

		if (!response.ok) {
			const data = await response.json();
			// console.log(data);
			throw {
					message: 'not possible to fetch user profile',
					status: 401,
			};
		}

		const data = await response.json();
		// console.log("id: ");
		// console.log(data);
		return data;
	} catch (e) {
		// console.log('Error:', e.message);
		return response;
	};
}

//utilizada tem de retornar ao login uma string - username (utilizada no inicio app.js e login para sabermos qual o username através do token)
async function getNamebyId(id) {

	// let csrfToken;

    // try {
    //     csrfToken = await getCsrfToken();
        // console.log(csrfToken);

    //     if (!csrfToken) {
    //         throw {
    //             message: 'csrf token error - getNamebyId',
    //             status: 401,
    //             status_msn: 'CSRF token not found'
    //         };
    //     }
    // } catch (error) {
        // console.log(error.message, error.status, error.status_msn);
    //     navigateTo(`/error/${error.status}/${error.message}`);
    //     return;
    // }

	// const dados = { id: user_id };

	const conf = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json', // Adicionando o Content-Type correto
			'Accept': 'application/json', // Adicionando o Accept para esperar resposta JSON
			// 'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
		},
		// body: JSON.stringify(dados),
	}

	try {
		// const csrfToken = await getCsrfToken(); // Obter o token CSRF
		// const dados = { id: user_id };

		const response = await fetchWithAuth(`${baseURL}/profile/get_user_username/?id=${id}`, conf);

		if (!response.ok) {
			throw new Error('Failed to fetch user profile');
		}
		const data = await response.json();
		// console.log("id: ");
		// console.log(data);
		// console.log(data.username);
		return data.username;
	} catch (error) {
		console.error('Error:', error);
		return "";
	};
}

// Obtém os dados do user que está login e faz a página
async function fetchUserProfile(username) {

	// let csrfToken;

    // try {
    //     csrfToken = await getCsrfToken();
        // console.log(csrfToken);

    //     if (!csrfToken) {
    //         throw {
    //             message: 'csrf token error - fetchUserProfile',
    //             status: 401,
    //             status_msn: 'CSRF token not found'
    //         };
    //     }
    // } catch (error) {
        // console.log(error.message, error.status, error.status_msn);
    //     navigateTo(`/error/${error.status}/${error.message}`);
    //     return;
    // }

	const conf = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			// 'X-CSRFToken': csrfToken
		}
	}
	try {

		// const userId = await getIdbyName(username);
		// const csrfToken = await getCsrfToken(); // Obter o token CSRF

		// const response = await fetch(`${baseURL}/user-profile/${userId}/`, {
		// 	method: 'GET',
		// 	headers: {
		// 		'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
		// 	}
		// });

		// console.log('teste ao fetchwitauth');
		const response = await fetchWithAuth(`${baseURL}/profile/`, conf);

		if (!response.ok) {
			// throw new Error('Failed to fetch user profile');
			throw {
				message: 'Failed to fetch user profile - protected',
				status: 404,
				status_msg: 'Internal Server Error - user id'
			};
		}

		let data = await response.json();
		console.log('data que vem do user: ', data);
		dataUser = data;

		navigateTo(`/user/${username}/profile`);

	} catch (e) {
		// console.error('Error:', e);
		navigateTo(`/error/${e.status}/${e.message}`);
	}
}

export { dataUser, getNamebyId, fetchUserProfile, getUserProfileByUsername };