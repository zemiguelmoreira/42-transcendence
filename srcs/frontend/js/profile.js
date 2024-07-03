import { getIdbyName, getNamebyId } from "./profile/profile_utils.js";
import { getCsrfToken } from "./utils/csrf.js";

const userName = localStorage.getItem('refresh_token');
const userId = await getIdbyName(userName);

function updateProfilePage(userData) {
    document.getElementById('profile-username-title').innerText = userData.username;
    document.getElementById('profile-username').innerHTML = `<strong>Username:</strong> ${userData.username}`;
    document.getElementById('profile-email').innerHTML = `<strong>Email:</strong> ${userData.email}`;
    document.getElementById('profile-bio').innerHTML = `<strong>Biografia:</strong> ${userData.bio || 'Esta é uma breve biografia sobre o user.'}`;
    document.getElementById('profile-location').innerHTML = `<strong>Localização:</strong> ${userData.location || 'Cidade, País'}`;
}

async function fetchUserProfile() {

	try {
		const csrfToken = await getCsrfToken(); // Obter o token CSRF

		const response = await fetch(`user/user-profile/${userId}/`, {
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
		const userData = await response.json();
		console.log(userData);
        updateProfilePage(userData);
	} catch (e) {
		console.error('Error:', e);
	}
}


fetchUserProfile();