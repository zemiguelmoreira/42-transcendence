import { baseURL, navigateTo } from "../app.js";
import { fetchWithAuth } from "../utils/fetchWithToken.js";
import { messageContainerToken } from "../utils/utils1.js";
import { makeNavbar } from "../home/homepage.js";

let dataUser

async function getUserProfileByUsername(username) {
	let response;
	const conf = {
		method: 'GET',
		headers: {},
	}
	try {
		response = await fetchWithAuth(`/api/profile/get_user_profile/?username=${username}`, conf);
		if (!response.ok) {
			throw {
				message: 'not possible to fetch user profile',
				status: 401,
			};
		}
		const data = await response.json();
		return data;
	} catch (e) {
		return response;
	};
}

async function getNamebyId(id) {
	const conf = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
	}
	try {
		const response = await fetchWithAuth(`${baseURL}/profile/get_user_username/?id=${id}`, conf);
		if (!response.ok) {
			throw {
				message: response.statusText,
				status: response.status,
			};
		}
		const data = await response.json();
		return data.username;
	} catch (error) {
		console.log('response no getNamebyID: ', error);
		return error;
	};
}

async function fetchUserProfile(username, url = `/user/${username}/profile`) {
	const conf = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		}
	}
	try {
		const response = await fetchWithAuth(`${baseURL}/profile/`, conf);
		if (!response.ok) {

			throw {
				message: response.statusText,
				status: response.status,
			};

		}
		let data = await response.json();
		dataUser = data;
		console.log('dataUser fetchUserProfile: ', dataUser);
		navigateTo(url);
		makeNavbar(data);

	} catch (e) {
		if (e.status === 401) {
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
		} else {
			navigateTo(`/error/${e.status}/${e.message}`);
		}
	}
}

async function fetchUserProfileSettings(username) {
	const conf = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		}
	}
	try {
		const response = await fetchWithAuth(`${baseURL}/profile/`, conf);
		console.log('response do fetchWithAuth no fetchUserProfileSettings: ', response);
		if (!response.ok) {

			throw {
				message: response.statusText,
				status: response.status,
			};

		}
		let data = await response.json();
		dataUser = data;
		navigateTo(`/user/${username}/settings`);

	} catch (e) {

		if (e.status === 401) {
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
		} else {
			navigateTo(`/error/${e.status}/${e.message}`);
		}
	}
}

export { dataUser, getNamebyId, fetchUserProfile, getUserProfileByUsername, fetchUserProfileSettings };