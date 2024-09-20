
import { makeEditProfilePage } from "./profilePages.js";
import { displaySlidingMessage } from "../utils/utils1.js";
import { fetchUserProfile } from "./myprofile.js";
import { homeLogin } from "../home/home.js";

function edit(data, username) {
	document.getElementById('mainContent').innerHTML = '';
	const editPageData = makeEditProfilePage(data);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', editPageData);
	let selectedProfileImage = data.profile.profile_image_url;
	
	document.getElementById('profile-img').addEventListener('click', function() {
		document.getElementById('choosePicture').click();
	});
	
	document.getElementById('choosePicture').addEventListener('change', function(event) {
		const reader = new FileReader();
		reader.onload = function(e) {
			selectedProfileImage = e.target.result;
			document.getElementById('profile-img').src = selectedProfileImage;
		};
		reader.readAsDataURL(event.target.files[0]);
	});

	const icons = document.querySelectorAll('.image-grid img');
	icons.forEach(function(icon) {
		icon.addEventListener('click', function() {
			selectedProfileImage = this.src;
			document.getElementById('profile-img').src = selectedProfileImage;
		});
	});

	document.getElementById('updateProfile').addEventListener('click', (e) => {
		e.preventDefault();
		updateUserProfile(data, username, selectedProfileImage);
	});

	document.getElementById("backButton").addEventListener("click", function() {
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

    if (profileImage) {
        formData.append('profile_image', profileImage);
    } else if (selectedProfileImage) {
        const response = await fetch(selectedProfileImage);
        const blob = await response.blob();
        const file = new File([blob], 'profile_image.jpg', { type: blob.type });
        formData.append('profile_image', file);
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
            // await homeLogin(username); // Não funciona porque tem a flag para actualizar a foto da navbar fazer refresh
            await fetchUserProfile(username);
            displaySlidingMessage('Profile updated successfully!');
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        displaySlidingMessage('Failed to update profile! Please try again.');
    }
}

export { edit }