// Página de perfil
function makeProfilePage(data) {
	return `
	<div class="profile-container">
		<div class="profile-left">
			<img src="../../files/ialves-m.jpg" alt="User Picture">
			<h3 id="username">${data.profile.alias_name}</h3>
			<button id="editProfile" type="button" class="btn btn-primary btn-sm">Edit Profile</button>
			<div class="friends-list">
			<table class="friends-table">
				<thead>
					<tr>
						<th>Friends</th>
						<th>Status</th>
						<th>Action</th> <!-- Nova coluna para a letra X -->
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>user1</td>
						<td><span class="status-icon green"></span></td>
						<td>X</td>
					</tr>
					<tr>
						<td>user2</td>
						<td><span class="status-icon red"></span></td>
						<td>X</td>
					</tr>
					<tr>
						<td>user3</td>
						<td><span class="status-icon green"></span></td>
						<td>X</td>
					</tr>
					<tr>
						<td>user4</td>
						<td><span class="status-icon red"></span></td>
						<td>X</td>
					</tr>
					<tr>
						<td>user5</td>
						<td><span class="status-icon green"></span></td>
						<td>X</td>
					</tr>
					<tr>
						<td>user6</td>
						<td><span class="status-icon red"></span></td>
						<td>X</td>
					</tr>
					<tr>
						<td>user7</td>
						<td><span class="status-icon green"></span></td>
						<td>X</td>
					</tr>
					<tr>
						<td>user8</td>
						<td><span class="status-icon red"></span></td>
						<td>X</td>
					</tr>
					<tr>
						<td>user9</td>
						<td><span class="status-icon green"></span></td>
						<td>X</td>
					</tr>
					<tr>
						<td>user10</td>
						<td><span class="status-icon red"></span></td>
						<td>X</td>
					</tr>
				</tbody>
			</table>

			</div>
		</div>
		<div class="profile-right">
			<div class="profile-title">My Profile</div>
			<div class="profile-info">
				<label for="username">Name:</label>
				<span class="profile-description" id="username">${data.user.username}</span>
			</div>
			<div class="profile-info">
			<label for="email">Email:</label>
			<span class="profile-description" id="email">${data.user.email}</span>
			</div>
			<div class="profile-info">
				<label class="profile-label" for="name">Nickname:</label>
				<span class="profile-description" id="name">${data.profile.alias_name}</span>
			</div>
			<div class="profile-title">Games Statistics</div>
			<table class="game-list">
				<thead>
					<tr>
						<th>Game</th>
						<th>Score</th>
						<th>Wins</th>
						<th>Loses</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Pong</td>
						<td>${data.profile.pong_rank}</td>
						<td>${data.profile.pong_wins}</td>
						<td>${data.profile.pong_losses}</td>
					</tr>
					<tr>
						<td>Snake</td>
						<td>${data.profile.snake_rank}</td>
						<td>${data.profile.snake_wins}</td>
						<td>${data.profile.snake_losses}</td>
					</tr>
				</tbody>
			</table>
			<div class="profile-title">Pong Matches History</div>
			<div id="pongTableContainer"></div>
			<div class="profile-title">Snake Matches History</div>
			<div id="snakeTableContainer"></div>
		</div>
	</div>
	`;
}

// Página de edição de perfil
function makeEditProfilePage(data) {
	return `
	<div class="profile-container">
		<div class="profile-left">
			<img id="profile-img" src="../../files/ialves-m.jpg" alt="User Picture" style="cursor: pointer;">
			<form>
				<div class="form-group">
					<label for="choosePicture">Click to choose new picture</label>
					<input type="file" class="form-control-file" id="choosePicture" style="display: none;">
				</div>
			</form>
		</div>
		<div class="profile-right">
			<div class="profile-title">Edit ${data.username} profile</div>
			<div class="profile-info">
				<label class="profile-label" for="name">Name:</label>
				<div class="input-group mb-3">
					<input type="text" class="form-profile" placeholder="Name" aria-label="Name"
						aria-describedby="basic-addon1">
				</div>
			</div>
			<div class="profile-info">
				<label for="username">Username:</label>
				<div class="input-group mb-3">
					<input type="text" class="form-profile" placeholder="Username" aria-label="Username"
						aria-describedby="basic-addon1">
				</div>
			</div>
			<div class="profile-info">
				<label for="email">Email:</label>
				<span class="profile-description" id="email">${data.email}</span>
				<span for="email" class="warning-label">* Email not editable</span>
			</div>
			<button type="button" class="btn btn-primary btn-sm">Update profile</button>

		</div>
	</div>
	`;
}

// Resultado da busca de outro usuário
function makeProfilePageSearchOther(data) {
	return `
	<div class="profile-container">
		<div class="profile-left">
			<img id="profile-img" src="../../files/ialves-m.jpg" alt="User Picture">
			<h3 id="username">${data.profile.alias_name}</h3>
		</div>


		<div class="profile-right">
			<div class="profile-title">${data.user.username} Profile</div>
			<div class="profile-info">
				<label class="profile-label" for="name">Name:</label>
				<span class="profile-description" id="name">${data.user.username}</span>
			</div>
			<div class="profile-info">
				<label for="username">Username:</label>
				<span class="profile-description" id="username">${data.profile.alias_name}</span>
			</div>
			<div class="profile-info">
				<label for="email">Email:</label>
				<span class="profile-description" id="email">${data.user.email}</span>
			</div>

			
			<div class="profile-title">Games Statistics</div>
			<table class="game-list">
				<thead>
					<tr>
						<th>Game</th>
						<th>Score</th>
						<th>Wins</th>
						<th>Loses</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Pong</td>
						<td>${data.profile.pong_rank}</td>
						<td>${data.profile.pong_wins}</td>
						<td>${data.profile.pong_losses}</td>
					</tr>
					<tr>
						<td>Snake</td>
						<td>${data.profile.snake_rank}</td>
						<td>${data.profile.snake_wins}</td>
						<td>${data.profile.snake_losses}</td>
					</tr>
				</tbody>
			</table>

			<div class="profile-title">Matches History</div>
			<table class="game-list">
				<thead>
					<tr>
						<th>Game</th>
						<th>Date</th>
						<th>Winner</th>
						<th>Looser</th>
						<th>Winner Score</th>
						<th>Looser Score</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Pong</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.profile.pong_date}</td>
						<td>${data.profile.pong_winner}</td>
						<td>${data.profile.pong_looser}</td>
						<td>${data.profile.pong_winner_score}</td>
						<td>${data.profile.pong_looser_score}</td> -->
					</tr>
					<tr>
						<td>Snake</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.profile.pong_date}</td>
						<td>${data.profile.pong_winner}</td>
						<td>${data.profile.pong_looser}</td>
						<td>${data.profile.pong_winner_score}</td>
						<td>${data.profile.pong_looser_score}</td> -->
					</tr>
					<tr>
						<td>Pong</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.profile.pong_date}</td>
						<td>${data.profile.pong_winner}</td>
						<td>${data.profile.pong_looser}</td>
						<td>${data.profile.pong_winner_score}</td>
						<td>${data.profile.pong_looser_score}</td> -->
					</tr>
					<tr>
						<td>Snake</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.profile.pong_date}</td>
						<td>${data.profile.pong_winner}</td>
						<td>${data.profile.pong_looser}</td>
						<td>${data.profile.pong_winner_score}</td>
						<td>${data.profile.pong_looser_score}</td> -->
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	`;
}

// Página de erro de busca
function noResultsPage(searchValue) {
	return `
	<div class="mainContent">
			<div class="profile-title">No results found.</div>
	</div>
	`;
}


export { makeProfilePage, makeEditProfilePage, makeProfilePageSearchOther, noResultsPage }