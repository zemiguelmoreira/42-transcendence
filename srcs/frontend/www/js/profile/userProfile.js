import { makeProfilePage } from "./profilePages.js";
import { navigateTo } from "../app.js";

function userProfilePage(userData) {

	document.getElementById('mainContent').innerHTML = '';
	const profilePageData = makeProfilePage(userData);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profilePageData);

	displayMatchHistory(userData.profile.pong_match_history, "pongTableContainer");
	displayMatchHistory(userData.profile.snake_match_history, "snakeTableContainer");
	displayFriendsList();

	document.getElementById('editProfile').addEventListener('click', (e) => {
		e.preventDefault();
		navigateTo(`/user/${userData.user.username}/profile/edit`);
	});
}

// Função para criar e exibir a tabela
function displayMatchHistory(data, TableContainer) {
    // Cria a tabela e o cabeçalho
	console.log('TableContainer:', TableContainer);
    let table = '<table class="game-list" border="1" cellspacing="0" cellpadding="5">';
    table += `
        <thead>
            <tr>
                <th>Winner</th>
                <th>Winner Score</th>
                <th>Loser</th>
                <th>Loser Score</th>
                <th>Timestamp</th>
            </tr>
        </thead>
        <tbody>
    `;

    // Itera sobre o array e cria uma linha para cada objeto
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
	
	// Insere a tabela no contêiner
	document.getElementById(TableContainer).innerHTML = table;
}

// Função para criar e exibir a tabela
async function displayFriendsList(is_setting = false) {

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

		// Define a classe da tabela de forma condicional
		const tableClass = is_setting ? 'friends-management-table' : 'friends-table';

		// Cria a tabela e cabeçalhos
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

		// Loop através da lista de amigos
		friends.forEach(friend => {
			console.log('friend:', friend);
			table += `
				<tr>
					<td>${friend.username}</td>
					<td><span class="status-icon ${friend.is_logged_in ? 'green' : 'red'}"></span></td>`;
			if (is_setting) {
				table += `<td><button id="removeFriend" class="btn btn-outline-danger btn-sm friends-management-table-btn">Remove Friend</button></td>`;
			}
			table += `</tr>`;
		});

		table += '</tbody></table>';
		
		// Insere a tabela no contêiner
		document.getElementById("friends-list").innerHTML = table;

	} catch (error) {
		console.error('Error fetching friend list:', error);
	}
}

// Função para criar e exibir a tabela
async function displayBlockedList() {

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

		// Cria a tabela e cabeçalhos
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

		// Loop através da lista de usuários bloqueados
		data.blocked_list.forEach(user => {
			console.log('blocked user:', user);
			table += `
				<tr>
					<td>${user.username}</td>
					<td><button class="btn btn-outline-danger btn-sm friends-management-table-btn" onclick="unblockUser('${user.username}')">Unblock User</button></td>
				</tr>
			`;
		});

		table += '</tbody></table>';
		
		// Insere a tabela no contêiner
		document.getElementById("blocked-list").innerHTML = table;

	} catch (error) {
		console.error('Error fetching blocked list:', error);
	}
}



export { userProfilePage , displayFriendsList , displayBlockedList}