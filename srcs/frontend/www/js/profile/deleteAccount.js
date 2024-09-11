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
	messageDiv.style.display = 'block';
	removeToken();
	setTimeout(function() {
		messageDiv.style.display = 'none';
		navigateTo('/');
	}, 1000);
}

async function deleteProfile(username) {
	const conf = {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
		}
	}
	try {
		const response = await fetchWithAuth(`${baseURL}/profile/delete_account/?username=${username}`, conf);
		if (!response.ok) {
			throw {
				message: 'Failed to fetch user profile',
				status: 401,
				status_msg: 'Internal Server Error - Tokens'
			};
		}
		const data = await response.json();
		const deleteDiv = deleteContainer(username, data.message);
		limparDivAll('root');
		document.getElementById('root').insertAdjacentHTML('afterbegin', deleteDiv);
		showDeleteMessage();
	} catch (e) {
		navigateTo(`/error/${e.status}/${e.message}`);
	};
}

export { deleteProfile };
