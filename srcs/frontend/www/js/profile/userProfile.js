import { makeProfilePage, makeSettingsPage } from "./profilePages.js";
import { navigateTo } from "../app.js";
import { removeFriend, unblockUser } from "../utils/manageUsers.js";
import { displaySlidingMessage } from "../utils/utils1.js";

import { viewUserProfile } from "../search/search_user.js";


function userProfilePage(userData) {
	document.getElementById('mainContent').innerHTML = '';
	const profilePageData = makeProfilePage(userData);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profilePageData);
	displayMatchHistory(userData.profile.pong_match_history, "pongTableContainer");
	displayMatchHistory(userData.profile.snake_match_history, "snakeTableContainer");
	console.log('displayFriendsList userData:', userData);
	displayFriendsList(userData.user.username);
	document.getElementById('editProfile').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${userData.user.username}/profile/edit`);
	});
}

function displayMatchHistory(data, TableContainer) {
	console.log('TableContainer:', TableContainer);
	let table = '<table class="matches-history" border="1" cellspacing="0" cellpadding="5">';
	table += `<tbody>`;
	data.forEach(match => {
		table += `
            <tr>
                <td>${match.winner}</td>
                <td>${match.winner_score}</td>
                <td>${match.loser}</td>
                <td>${match.loser_score}</td>
                <td>${new Date(match.timestamp).toLocaleString()}</td>
            </tr>
        `;
	});
	table += '</tbody></table>';
	document.getElementById(TableContainer).innerHTML = table;
}

async function displayFriendsList(myUsername, is_setting = false) {
	const accessToken = localStorage.getItem('access_token');
	try {
		const response = await fetch('/api/profile/friend_list/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			}
		});

		if (!response.ok) {
			throw new Error('Network response was not ok');
		}

		const data = await response.json();
		const friends = data.friends;
		const tableClass = is_setting ? 'friends-management-table' : 'friends-table';
		let table = `<table class="${tableClass}">`;
		table += `
			<thead>
				<tr>
					<th>Friends</th>
					<th>Status</th>
		`;
		if (is_setting) {
			table += `<th>Remove Friend</th>`;
		}
		table += `
				</tr>
			</thead>
			<tbody>
		`;

		friends.forEach((friend) => {
			console.log('Friend:', friend);
			console.log('Friend Username:', friend.username);
			console.log('My Username:', myUsername);
			const uniqueId = `link-${friend.username}`;  // ID único baseado no nome de usuário
			table += `
			<tr>
				<td><a href="" id="${uniqueId}" class="link-primary">${friend.username}</a></td>
				<td><span class="status-icon ${friend.is_logged_in ? 'green' : 'red'}"></span></td>`;
			
			if (is_setting) {
				table += `<td><button id="removeFriend-${friend.username}" class="btn btn-outline-danger btn-sm friends-management-table-btn" data-username="${friend.username}">Remove Friend</button></td>`;
			}
			table += `</tr>`;
		});
		table += '</tbody></table>';
		document.getElementById("friends-list").innerHTML = table;
		
		// Adiciona o event listener a cada link baseado no ID único
		friends.forEach((friend) => {
			const uniqueId = `link-${friend.username}`;
			const link = document.getElementById(uniqueId);
			if (link) { // Verifica se o link existe
				link.addEventListener('click', (event) => {
					event.preventDefault();
					viewUserProfile(myUsername, friend.username);
				});
			}
		});

		// Adiciona o event listener a cada botão de remoção de amigo
		if (is_setting) {
			friends.forEach((friend) => {
				const button = document.getElementById(`removeFriend-${friend.username}`);
				if (button) { // Verifica se o botão existe
					button.addEventListener('click', async (e) => {
						e.preventDefault();
						const friendUsername = button.getAttribute('data-username');
						await removeFriend(friendUsername, displaySlidingMessage);
						navigateTo(`/user/${myUsername}/settings`);
					});
				}
			});
		}
	} catch (error) {
		console.error('Error fetching friend list:', error);
	}
}

async function displayBlockedList(myUsername) {
	const accessToken = localStorage.getItem('access_token');
	if (!accessToken) {
		console.error('No access token found');
		return;
	}
	try {
		const response = await fetch('/api/profile/blocked_list/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			}
		});
		if (!response.ok) {
			throw new Error('Network response was not ok: ' + response.statusText);
		}
		const data = await response.json();
		console.log('Blocked List:', data.blocked_list);

		let table = `<table class="friends-management-table">`;
		table += `
			<thead>
				<tr>
					<th>Users</th>
					<th>Unblock</th>
				</tr>
			</thead>
			<tbody>
		`;

		console.log('Blocked List myUsername: ', myUsername);
		data.blocked_list.forEach((user, index) => {
			console.log('Blocked User:', user);
			const uniqueId = `link-${user}`; // Gera um ID único baseado no nome do usuário
			table += `
				<tr>
					<td><a href="" id="${uniqueId}" class="link-primary">${user}</a></td>
					<td><button id="unblockUser-${user}" class="btn btn-outline-danger btn-sm friends-management-table-btn" data-username="${user}">Unblock User</button></td>
				</tr>
			`;
		});
		table += '</tbody></table>';
		document.getElementById("blocked-list").innerHTML = table;

		// Adiciona o event listener a cada link baseado no ID único
		data.blocked_list.forEach((user) => {
			const uniqueId = `link-${user}`;
			const link = document.getElementById(uniqueId);
			if (link) { // Verifica se o link existe
				link.addEventListener('click', (event) => {
					event.preventDefault();
					viewUserProfile(myUsername, user);
				});
			}
		});

		// Adiciona o event listener a cada botão de desbloqueio de usuário
		data.blocked_list.forEach((user) => {
			const button = document.getElementById(`unblockUser-${user}`);
			if (button) { // Verifica se o botão existe
				button.addEventListener('click', async (e) => {
					e.preventDefault();
					const usernameToUnblock = button.getAttribute('data-username');
					await unblockUser(usernameToUnblock, displaySlidingMessage);
					await displayBlockedList(myUsername); // Recarrega a lista após o desbloqueio
				});
			}
		});
	} catch (error) {
		console.error('Error fetching blocked list:', error);
	}
}

function profileSettings(dataUser) {
	console.log('profile Setting: ', dataUser);
	document.getElementById('mainContent').innerHTML = '';
	const profileSettings = makeSettingsPage(dataUser);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profileSettings);
	displayFriendsList(dataUser.user.username, true);
	displayBlockedList(dataUser.user.username);
}

export { userProfilePage, displayFriendsList, displayBlockedList, profileSettings }