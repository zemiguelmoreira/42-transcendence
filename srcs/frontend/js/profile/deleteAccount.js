import { getCsrfToken } from "../utils/tokenCsrf.js";
// import { getIdbyName } from "./myprofile.js";
import { baseURL } from "../app.js";
import { limparDivAll } from "../utils/utils1.js";
import { removeToken } from "../utils/tokens.js";
import { navigateTo } from "../app.js";
import { fetchWithAuth } from "../utils/fetchWithToken.js";


function deleteContainer(username, delete_message) {
	return `<div class="row justify-content-center my-auto">
	<div class="col-auto">
		<div class="delete-message" id="deleteMessage" style="display: none; font-size: 30px;">${username} ${delete_message}</div>
	</div>
</div>`;
}


function showDeleteMessage() {
	var messageDiv = document.getElementById('deleteMessage');
	messageDiv.style.display = 'block'; // Exibe a mensagem
	removeToken(); // retirar os tokens
	setTimeout(function() {
		messageDiv.style.display = 'none'; // Oculta a mensagem após 3 segundos
		navigateTo('/'); // Redireciona para a página inicial após login
	}, 1000); // 1000 milissegundos = 1 segundos
}


async function deleteProfile(username) {

	// let csrfToken;

    // try {
    //     csrfToken = await getCsrfToken();
    //     console.log(csrfToken);

    //     if (!csrfToken) {
    //         throw {
    //             message: 'csrf token error - deleteProfile',
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
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			// 'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
		}
	}

	try {

		// const userId = await getIdbyName(username);

		const response = await fetchWithAuth(`${baseURL}/profile/delete_account/?username=${username}`, conf);

		if (!response.ok) {
			throw {
				message: 'Failed to fetch user profile',
				status: 401,
				status_msg: 'Internal Server Error - Tokens'
			};
		}

		const data = await response.json();

		console.log(data);
		const deleteDiv = deleteContainer(username, data.message);
		limparDivAll('root');
		document.getElementById('root').insertAdjacentHTML('afterbegin', deleteDiv);
		showDeleteMessage();

	} catch (e) {
		// console.error('Error:', e);
		navigateTo(`/error/${e.status}/${e.message}`);
	};

}

export { deleteProfile };
