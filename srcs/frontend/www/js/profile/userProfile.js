import { makeProfilePage } from "./profilePages.js";
import { navigateTo } from "../app.js";

function userProfilePage(userData) {

	document.getElementById('mainContent').innerHTML = '';
	const profilePageData = makeProfilePage(userData);
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', profilePageData);

	displayMatchHistory(userData.profile.pong_match_history, "pongTableContainer");
	displayMatchHistory(userData.profile.snake_match_history, "snakeTableContainer");
	displayFriendsList(userData.profile.friend_list, "friends-list");

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
function displayFriendsList(data, TableContainer) {
    // Cria a tabela e o cabeçalho
    let table = '<table class="friends-table">';
    let nbr = 0;
	table += `
		<thead>
			<tr>
				<th>Friends</th>
				<th>Status</th>
			</tr>
		</thead>
        <tbody>
    `;

    // Itera sobre o array e cria uma linha para cada objeto
	// 	<tr>
	// 	<td>user1</td>
	// 	<td><span class="status-icon green"></span></td>
	//  </tr>
    data.forEach(match => {
        table += `
            <tr>
                <td>${match}</td>`;
				if (match.status === 'online') {`
	                <td>${match.winner_score}</td>
				`} else {`
					<td>${match.loser_score}</td>
				`}`
			</tr>
        `;
		nbr++;
    });

    table += '</tbody></table>';
	
	// Insere a tabela no contêiner
	document.getElementById(TableContainer).innerHTML = table;
}


export { userProfilePage }