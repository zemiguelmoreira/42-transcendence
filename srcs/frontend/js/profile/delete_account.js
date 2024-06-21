import { getCsrfToken } from "../utils/csrf.js";
import { userName } from "../login/login.js";
import { getIdbyName } from "./myprofile.js";
import { baseURL } from "../app.js";
import { limparDivAll } from "../utils/utils1.js";
import { removeToken } from "../login/session.js";
import { navigateTo } from "../app.js";
import { matchRoute } from "../app.js";


function deleteContainer(username, delete_message) {
	return `<div class="row justify-content-center my-auto">
	<div class="col-auto">
		<div class="delete-message" id="deleteMessage" style="display: none; font-size: 30px;">${username} ${delete_message}</div>
	</div>
</div>`;
}


// function resetToHome() {
//     // Primeiro, navegar para a home usando replaceState para substituir o estado atual
// 	navigateTo('/');
// 	// document.addEventListener('DOMContentLoaded', function() {
// 	history.replaceState({page: '/'}, '', '/');
// 	console.log('history: ', history.length);
// 	history.go(-(history.length - 2));
//     // history.replaceState({page: '/'}, '', '/');

//     // Depois, redefinir o estado atual para garantir que o histórico anterior não seja acessível
//     // history.pushState({page: '/'}, '', '/');
//     // Opcional: Limpar o manipulador onpopstate para evitar comportamentos inesperados
//     // window.onpopstate = null;
// // });
// }



function resetToHome() {
    // Primeiro, navegar para a home usando replaceState para substituir o estado atual
	navigateTo('/');
	
	let stepsBack = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        stepsBack++;
        history.go(-1); // Navega uma entrada para trás
        if (history.state && !matchRoute(history.state)) {
            break; // Encontrou a primeira entrada do site
        }
    }

    // Retorna à home após encontrar a primeira entrada do site
    history.go(-stepsBack + 1);
}



function showDeleteMessage() {
	var messageDiv = document.getElementById('deleteMessage');
	messageDiv.style.display = 'block'; // Exibe a mensagem
	removeToken(); // retirar os tokens
	setTimeout(function() {
		messageDiv.style.display = 'none'; // Oculta a mensagem após 3 segundos
		navigateTo('/'); // Redireciona para a página inicial após login
		// resetToHome();
	}, 1000); // 1000 milissegundos = 1 segundos
}



async function deleteProfile(username) {

	try {

		const userId = await getIdbyName(username);
		const csrfToken = await getCsrfToken(); // Obter o token CSRF

		const response = await fetch(`${baseURL}/users/delete-account/${userId}/`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken  // Incluindo o token CSRF no cabeçalho da solicitação
			}
		});

		if (!response.ok) {
			// throw new Error('Failed to delete user account');
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
