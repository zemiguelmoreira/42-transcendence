import { makeEditProfilePage } from "./profilePages.js";
import { displaySlidingMessage } from "../utils/utils1.js";
import { fetchUserProfile } from "./myprofile.js";
import { fetchWithAuth } from "../utils/fetchWithToken.js";
import { messageContainerToken } from "../utils/utils1.js";
import { navigateTo } from "../app.js";
import { getUserProfileByUsername } from "./myprofile.js";

function edit(data, username) {
	document.getElementById('mainContent').innerHTML = '';
	const editPageData = makeEditProfilePage(data);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', editPageData);
	let selectedProfileImage = data.profile.profile_image_url;

	document.getElementById('profile-img').addEventListener('click', function () {
		document.getElementById('choosePicture').click();
	});

	document.getElementById('choosePicture').addEventListener('change', function (event) {
		const reader = new FileReader();
		reader.onload = function (e) {
			selectedProfileImage = e.target.result;
			document.getElementById('profile-img').src = selectedProfileImage;
		};
		reader.readAsDataURL(event.target.files[0]);
	});

	const icons = document.querySelectorAll('.image-grid img');
	icons.forEach(function (icon) {
		icon.addEventListener('click', function () {
			selectedProfileImage = this.src;
			document.getElementById('profile-img').src = selectedProfileImage;
		});
	});

	
	document.getElementById('updateProfile').addEventListener('click', (e) => {
		e.preventDefault();
		updateUserProfile(data, username, selectedProfileImage);
	});

	document.getElementById("backButton").addEventListener("click", function () {
		window.history.back();
	});

}

async function updateUserProfile(data, username, selectedProfileImage) {
	const accessToken = localStorage.getItem('access_token');
	const bio = document.getElementById('bioForm').value;
	const alias_name = document.getElementById('usernameForm').value;
	const profileImage = document.getElementById('choosePicture').files[0];
	const formData = new FormData();
	formData.append('bio', bio);
	formData.append('alias_name', alias_name);
	const maxSize = 5 * 1024 * 1024;
	const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];

	if (profileImage) {
		if (profileImage.size > maxSize) {
			displaySlidingMessage('Image size must be less than 5MB');
			document.getElementById('choosePicture').value = '';
			return;
		} else if (!allowedImageTypes.includes(profileImage.type)) {
			displaySlidingMessage('Image must be of type jpg or png');
			document.getElementById('choosePicture').value = '';
			return
		} else {
			formData.append('profile_image', profileImage);
		}
	} else if (selectedProfileImage) {
		const response = await fetch(selectedProfileImage);
		const blob = await response.blob();
		const file = new File([blob], 'profile_image.jpg', { type: blob.type });
		formData.append('profile_image', file);
	}

	let response;

	const conf = {
		method: 'PUT',
		headers: {
			// 'Authorization': `Bearer ${accessToken}`,
		},
		body: formData,
	};

	try {
		response = await fetchWithAuth('/api/profile/update_profile/', conf);

		if (response.ok) {
			// await homeLogin(username); // Não funciona porque tem a flag para actualizar a foto da navbar fazer refresh
			await fetchUserProfile(username);

			let newData = await getUserProfileByUsername(username);
			document.getElementById('miniPhoto').src = newData.profile.profile_image_url;
			console.log('newData: ', newData);

			displaySlidingMessage('Profile updated successfully!');
		} else {
			// throw new Error('Failed to update profile');
			throw {
				status: response.status,
				message: response.statusText
			}
		}
	} catch (error) {
		if (error.status === 401) {
			const messageDiv = messageContainerToken();
			document.getElementById('root').innerHTML = "";
			document.getElementById('root').insertAdjacentHTML('afterbegin', messageDiv);
			const messageContainer = document.getElementById('tokenMessage');
			messageContainer.style.display = 'block';
			setTimeout(function () {
				messageContainer.style.display = 'none';
				navigateTo(`/signIn`);
			}, 2000);
			document.getElementById('choosePicture').value = '';
			return;
		} else {
			displaySlidingMessage('Failed to update profile! Please try again.');
			document.getElementById('choosePicture').value = '';
		}
	}
}

export { edit }
