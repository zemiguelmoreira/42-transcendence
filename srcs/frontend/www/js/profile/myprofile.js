import { baseURL, navigateTo } from "../app.js";
import { fetchWithAuth } from "../utils/fetchWithToken.js";

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
			const data = await response.json();
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
			throw new Error('Failed to fetch user profile');
		}
		const data = await response.json();
		return data.username;
	} catch (error) {
		console.error('Error:', error);
		return "";
	};
}

async function fetchUserProfile(username) {
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
				message: 'Failed to fetch user profile - protected',
				status: 404,
				status_msg: 'Internal Server Error - user id'
			};
		}
		let data = await response.json();
		dataUser = data;
		navigateTo(`/user/${username}/profile`);
	} catch (e) {
		navigateTo(`/error/${e.status}/${e.message}`);
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
		if (!response.ok) {
			throw {
				message: 'Failed to fetch user profile - protected',
				status: 404,
				status_msg: 'Internal Server Error - user id'
			};
		}
		let data = await response.json();
		dataUser = data;
		navigateTo(`/user/${username}/settings`);
	} catch (e) {
		navigateTo(`/error/${e.status}/${e.message}`);
	}
}

export { dataUser, getNamebyId, fetchUserProfile, getUserProfileByUsername, fetchUserProfileSettings };