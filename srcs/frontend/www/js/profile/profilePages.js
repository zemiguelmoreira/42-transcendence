// Página de perfil
function makeProfilePage(data) {
	return `
	<div class="profile-container">
		<div class="profile-left">
			<img src="../../files/ialves-m.jpg" alt="User Photo">
			<h3 id="username">${data.name}</h3>
			<button id="editProfile" type="button" class="btn btn-secondary btn-sm">Edit Profile</button>
			<div class="friends-list">
				<h3 class="friends-title">Friends</h3>
				<table class="friends-table">
					<thead>
						<tr>
							<th>Status</th>
							<th>Username</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><span class="status-icon green"></span></td>
							<td>user1</td>
						</tr>
						<tr>
							<td><span class="status-icon red"></span></td>
							<td>user2</td>
						</tr>
						<tr>
							<td><span class="status-icon green"></span></td>
							<td>user3</td>
						</tr>
						<tr>
							<td><span class="status-icon red"></span></td>
							<td>user4</td>
						</tr>
						<tr>
							<td><span class="status-icon green"></span></td>
							<td>user5</td>
						</tr>
						<tr>
							<td><span class="status-icon red"></span></td>
							<td>user6</td>
						</tr>
						<tr>
							<td><span class="status-icon green"></span></td>
							<td>user7</td>
						</tr>
						<tr>
							<td><span class="status-icon red"></span></td>
							<td>user8</td>
						</tr>
						<tr>
							<td><span class="status-icon green"></span></td>
							<td>user9</td>
						</tr>
						<tr>
							<td><span class="status-icon red"></span></td>
							<td>user10</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<div class="profile-right">
			<div class="profile-title">My Profile</div>
			<div class="profile-info">
				<label for="username">Username:</label>
				<span class="profile-description" id="username">${data.username}</span>
			</div>
			<div class="profile-info">
				<label class="profile-label" for="name">Name:</label>
				<span class="profile-description" id="name">${data.alias_name}</span>
			</div>
			<div class="profile-info">
				<label for="email">Email:</label>
				<span class="profile-description" id="email">${data.email}</span>
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
						<td>${data.pong_rank}</td>
						<td>${data.pong_wins}</td>
						<td>${data.pong_losses}</td>
					</tr>
					<tr>
						<td>Snake</td>
						<td>${data.snake_rank}</td>
						<td>${data.snake_wins}</td>
						<td>${data.snake_losses}</td>
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
						<!-- <td>${data.pong_date}</td>
									<td>${data.pong_winner}</td>
									<td>${data.pong_looser}</td>
									<td>${data.pong_winner_score}</td>
									<td>${data.pong_looser_score}</td> -->
					</tr>
					<tr>
						<td>Snake</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.pong_date}</td>
									<td>${data.pong_winner}</td>
									<td>${data.pong_looser}</td>
									<td>${data.pong_winner_score}</td>
									<td>${data.pong_looser_score}</td> -->
					</tr>
					<tr>
						<td>Pong</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.pong_date}</td>
									<td>${data.pong_winner}</td>
									<td>${data.pong_looser}</td>
									<td>${data.pong_winner_score}</td>
									<td>${data.pong_looser_score}</td> -->
					</tr>
					<tr>
						<td>Snake</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.pong_date}</td>
									<td>${data.pong_winner}</td>
									<td>${data.pong_looser}</td>
									<td>${data.pong_winner_score}</td>
									<td>${data.pong_looser_score}</td> -->
					</tr>
				</tbody>
			</table>
		</div>
	</div>
	`;
}

// Página de edição de perfil
function makeEditProfilePage(data) {
	return `
	<div class="d-flex flex-column vh-100" id="reg">
		<nav class="navbar navbar-expand-xxl navbar-dark p-4" id="navBar">
				<div class="container-fluid">
					<a class="navbar-brand" href="" id="home">Transcendence</a>
					<button class="navbar-toggler border border-0" type="button" data-bs-toggle="collapse"
						data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false"
						aria-label="Toggle navigation">
						<span class="navbar-toggler-icon"></span>
					</button>
					<div class="collapse navbar-collapse" id="navbarNavDropdown">
						<ul class="navbar-nav ms-4 me-auto">
							<li class="nav-item">
								<a class="nav-link" href="" id="gameLink" data-value="game">Games</a>
							</li>
						</ul>
						<form id="search-form" class="d-flex ms-auto me-3" role="search">
							<input id="search-input" class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
							<button id="search-btn" class="btn btn-outline-primary" type="submit">Search</button>
						</form>
						<ul class="navbar-nav flex-row mt-3 mt-xxl-0">
							<li class="nav-item">
								<button id="logOut" class="btn btn-primary w-100" type="button">logout</button>
							</li>
						</ul>
					</div>
				</div>
			</nav>

			<div class="container mainContent my-6">
				<div class="row">
					<div class="col-lg-3 text-center">
						<div class="customTooltip">
							<a href="">
								<img src="/assets/avatar.png" alt="Profile Picture" class="profile-pic">		
							</a>
							<span class="customTooltiptext">change your photo</span>
						</div>
						<div class="d-grid mt-5 mx-auto">
							<button id="deleteEdit" class="btn btn-outline-danger" type="button">delete profile</button>
						</div>
					</div>
					<div class="col-lg-4 mt-5 profile-info">
						<h1>Seu Nome</h1>
						<div class="mb-3">
							<label for="username" class="form-label">Example label</label>
							<input type="text" class="form-control" id="username" placeholder="${data.username}">
						</div>
						<div class="mb-3">
							<label for="email" class="form-label">Another label</label>
							<input type="text" class="form-control" id="email" placeholder="${data.email}">
						</div>
						<div class="mb-3">
							<label for="formGroupExampleInput" class="form-label">Example label</label>
							<input type="text" class="form-control" id="formGroupExampleInput" placeholder="Example input placeholder">
						</div>
						<div class="mb-3">
							<label for="formGroupExampleInput2" class="form-label">Another label</label>
							<input type="text" class="form-control" id="formGroupExampleInput2" placeholder="Another input placeholder">
						</div>
						<div class="d-grid mt-5 gap-2 d-md-block">
							<button id="cancelEdit" class="btn btn-secondary" type="button">cancel</button>
							<button class="btn btn-success" type="button">save</button>
						</div>
					</div>
				</div>
			</div>
		`;
}

// Resultado da busca de outro usuário
function makeProfilePageSearchOther(data) {
	return `
	<div class="profile-container">
		<div class="profile-left">
			<img id="profile-img" src="./files/ialves-m.jpg" alt="User Photo">
			<h3 id="username">${data.alias_name}</h3>
		</div>


		<div class="profile-right">
			<div class="profile-title">${data.username} Profile</div>
			<div class="profile-info">
				<label class="profile-label" for="name">Name:</label>
				<span class="profile-description" id="name">${data.username}</span>
			</div>
			<div class="profile-info">
				<label for="username">Username:</label>
				<span class="profile-description" id="username">${data.alias_name}</span>
			</div>
			<div class="profile-info">
				<label for="email">Email:</label>
				<span class="profile-description" id="email">${data.email}</span>
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
						<td>${data.pong_rank}</td>
						<td>${data.pong_wins}</td>
						<td>${data.pong_losses}</td>
					</tr>
					<tr>
						<td>Snake</td>
						<td>${data.snake_rank}</td>
						<td>${data.snake_wins}</td>
						<td>${data.snake_losses}</td>
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
						<!-- <td>${data.pong_date}</td>
						<td>${data.pong_winner}</td>
						<td>${data.pong_looser}</td>
						<td>${data.pong_winner_score}</td>
						<td>${data.pong_looser_score}</td> -->
					</tr>
					<tr>
						<td>Snake</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.pong_date}</td>
						<td>${data.pong_winner}</td>
						<td>${data.pong_looser}</td>
						<td>${data.pong_winner_score}</td>
						<td>${data.pong_looser_score}</td> -->
					</tr>
					<tr>
						<td>Pong</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.pong_date}</td>
						<td>${data.pong_winner}</td>
						<td>${data.pong_looser}</td>
						<td>${data.pong_winner_score}</td>
						<td>${data.pong_looser_score}</td> -->
					</tr>
					<tr>
						<td>Snake</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<td>0</td>
						<!-- <td>${data.pong_date}</td>
						<td>${data.pong_winner}</td>
						<td>${data.pong_looser}</td>
						<td>${data.pong_winner_score}</td>
						<td>${data.pong_looser_score}</td> -->
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