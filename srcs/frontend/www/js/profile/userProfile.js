import { makeProfilePage, makeProfilePageSearchOther, makeSettingsPage } from "./profilePages.js";
import { navigateTo } from "../app.js";
import { removeFriend, unblockUser } from "../utils/manageUsers.js";
import { displaySlidingMessage } from "../utils/utils1.js";
import { viewUserProfile } from "../search/search_user.js";
import { getUserProfileByUsername } from "../profile/myprofile.js";
import { makePasswordProfilePage , toggleTwoFactorAuth } from "./profilePages.js";
import { resetPassword , checkTwoFactorStatus , deleteUser } from "../login/login.js";
import chatSocketInstance from "../chat/chat_socket.js";
import { changeChatLoaded } from "../home/home.js";

function userProfilePage(userData, user) {
	const profilePageData = makeProfilePage(userData);
	document.getElementById('mainContent').innerHTML = '';
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profilePageData);

	// console.log('PRINT PONG: ', userData.profile.pong_match_history);
	displayMatchHistory(userData.profile.pong_match_history, "pongTableContainer");

	// console.log('PRINT SNAKE: ', userData.profile.snake_match_history);
	displayMatchHistory(userData.profile.snake_match_history, "snakeTableContainer");

	displayProfileFriendsList(userData.user.username);

	document.getElementById('editProfile').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${userData.user.username}/profile/edit`);
	});
}

function displayMatchHistory(data, TableContainer) {
	let table = '<table class="matches-history" border="1" cellspacing="0" cellpadding="5">';
	table += `<tbody>`;
	data.reverse();
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

async function displayProfileFriendsList(myUsername) {
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
		let table = `
		<div class="small-card-title">Friends</div>
		<table class="small-card-table">
		<tbody>
		`;
		for (const friend of friends) {
			let dataUser = await getUserProfileByUsername(friend.username);
			const uniqueId = `link-${friend.username}`;  // ID único baseado no nome de usuário
			table += `
			<tr>
				<td class="">
					<div class="small-card">
						<div class="small-card-image"><img src="${dataUser.profile.profile_image_url}"></div>
						<div class="small-card-name"><a href="" id="${uniqueId}" class="link-primary card-title">${friend.username}</a></div>
						<div class="status-icon small ${friend.is_logged_in ? 'green' : 'red'}"></div>
					</div>
				</td>
			</tr>
			`;
		}
		table += `
			</tbody>
		</table>
		`;
		document.getElementById("friends-card-list").innerHTML = table;
		friends.forEach((friend) => {
			const uniqueId = `link-${friend.username}`;
			const link = document.getElementById(uniqueId);
			if (link) {
				link.addEventListener('click', (event) => {
					event.preventDefault();
					viewUserProfile(myUsername, friend.username);
				});
			}
		});
	} catch (error) {
		console.error('Error fetching friend list:', error);
	}
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
			const uniqueId = `link-${friend.username}`;
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
		friends.forEach((friend) => {
			const uniqueId = `link-${friend.username}`;
			const link = document.getElementById(uniqueId);
			if (link) {
				link.addEventListener('click', (event) => {
					event.preventDefault();
					viewUserProfile(myUsername, friend.username);
				});
			}
		});
		if (is_setting) {
			friends.forEach((friend) => {
				const button = document.getElementById(`removeFriend-${friend.username}`);
				if (button) {
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
		let table = `
			<table class="friends-management-table">
				<thead>
					<tr>
						<th>Users</th>
						<th>Status</th>
						<th>Unblock User</th>
					</tr>
				</thead>
			<tbody>
		`;
		for (const user of data.blocked_list) {
			let userData = await getUserProfileByUsername(user);
			const uniqueId = `link-${user}`;
			table += `
				<tr>
					<td><a href="" id="${uniqueId}" class="link-primary">${user}</a></td>
					<td><span class="status-icon ${userData.profile.is_logged_in ? 'green' : 'red'}"></span></td>
					<td><button id="unblockUser-${user}" class="btn btn-outline-danger btn-sm friends-management-table-btn" data-username="${user}">Unblock User</button></td>
				</tr>
			`;
		}
		table += '</tbody></table>';
		document.getElementById("blocked-list").innerHTML = table;
		data.blocked_list.forEach((user) => {
			const uniqueId = `link-${user}`;
			const link = document.getElementById(uniqueId);
			if (link) {
				link.addEventListener('click', (event) => {
					event.preventDefault();
					viewUserProfile(myUsername, user);
				});
			}
			const button = document.getElementById(`unblockUser-${user}`);
			if (button) {
				button.addEventListener('click', async (e) => {
					e.preventDefault();
					const usernameToUnblock = button.getAttribute('data-username');
					await unblockUser(usernameToUnblock, displaySlidingMessage);
					await displayBlockedList(myUsername);
				});
			}
		});
	} catch (error) {
		console.error('Error fetching blocked list:', error);
	}
}

function profileSettings(dataUser) {
	console.log("SETTINGS", dataUser);

	document.getElementById('mainContent').innerHTML = '';
	const profileSettings = makeSettingsPage(dataUser);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profileSettings);
	displayFriendsList(dataUser.user.username, true);
	displayBlockedList(dataUser.user.username);


	if (dataUser.profile.userApi42)
		document.getElementById('securityBox').style.display = 'none';

	async function setCheckboxState() {
		const checkbox = document.getElementById('flexSwitchCheckDefault');
		const isEnabled = await checkTwoFactorStatus(dataUser.user.username);
		if (isEnabled) {
			document.getElementById('mfaStatus').innerHTML = "Active";
		} else {
			document.getElementById('mfaStatus').innerHTML = "Inactive";
		}
		checkbox.checked = isEnabled;
	}

	setCheckboxState();

	document.getElementById("flexSwitchCheckDefault").addEventListener("change", function (event) {
		event.preventDefault();
		toggleTwoFactorAuth(event.target.checked);
		if (event.target.checked == true) {
			document.getElementById('mfaStatus').innerHTML = "Active";
		} else {
			document.getElementById('mfaStatus').innerHTML = "Inactive";
		}
	});
	
	document.getElementById("changePassword").addEventListener("click", function () {
		navigateTo(`/user/${dataUser.user.username}/profile/update-password`);
	});

	document.getElementById("deleteAccount").addEventListener("click", function () {
		deleteUser();
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		changeChatLoaded();
		navigateTo(`/`);
		chatSocketInstance.close();
	});

}

function displayChangePassword(username) {
	document.getElementById('mainContent').innerHTML = '';
	const profilePassword = makePasswordProfilePage();
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profilePassword);

	document.getElementById("resetPasswordBtn").addEventListener("click", function () {
		resetPassword(username);
	});

	document.getElementById("cancelChangePassword").addEventListener("click", function () {
		navigateTo(`/user/${username}/settings`);
	});
}

export { userProfilePage, displayFriendsList, displayProfileFriendsList, displayBlockedList, profileSettings , displayChangePassword , displayMatchHistory }