
import { makeEditProfilePage } from "./profilePages.js";
import { removeToken } from "../utils/tokens.js";
import { navigateTo } from "../app.js";
import { getUser } from "../search/search_user.js";
import { deleteProfile } from "./deleteAccount.js";
import { displaySlidingMessage, limparDivAll } from "../utils/utils1.js";
import { fetchUserProfile } from "./myprofile.js";

// Funções na página edit
function edit(data, username) {
	document.getElementById('mainContent').innerHTML = '';
	const editPageData = makeEditProfilePage(data);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', editPageData);

	// Listener para clicar na imagem e abrir o seletor de arquivos
	document.getElementById('profile-img').addEventListener('click', function() {
		document.getElementById('choosePicture').click();
	});
	
	// Listener para atualizar a imagem do perfil quando o usuário escolhe um novo arquivo
	document.getElementById('choosePicture').addEventListener('change', function(event) {
		const reader = new FileReader();
		reader.onload = function(e) {
			document.getElementById('profile-img').src = e.target.result;
		};
		reader.readAsDataURL(event.target.files[0]);
	});
	
	// Listener para o botão de atualização do perfil
	document.getElementById('updateProfile').addEventListener('click', (e) => {
		e.preventDefault();
		updateUserProfile(data, username);
	});
}

// Função para atualizar o perfil do usuário
async function updateUserProfile(data, username) {
	const accessToken = localStorage.getItem('access_token');
	const bio = document.getElementById('bioForm').value;
	const alias_name = document.getElementById('usernameForm').value;
	const profileImage = document.getElementById('choosePicture').files[0];

	const formData = new FormData();
	formData.append('bio', bio);
	formData.append('alias_name', alias_name);
	if (profileImage) {
		console.log('Profile image:', profileImage);
		formData.append('profile_image', profileImage);
	}

	try {
		const response = await fetch('/api/profile/update_profile/', {
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			},
			body: formData,
		});

		if (response.ok) {
			fetchUserProfile(username);
			displaySlidingMessage('Profile updated successfully!');
		} else {
			throw new Error('Failed to update profile');
		}
	} catch (error) {
		console.error('Error updating profile:', error.message);
		alert('Failed to update profile. Please try again.');
	}
}

export { edit }