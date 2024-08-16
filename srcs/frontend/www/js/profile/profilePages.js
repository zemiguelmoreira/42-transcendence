// Página de perfil
function makeProfilePage(data) {
	console.log("makeProfilePage: ", data);
	return `
	<div class="profile-container">
		<div class="profile-left">
			<img id="profile-img" src="${data.profile.profile_image_url}" alt="${data.user.username}">
			<h3 id="username">${data.profile.alias_name}</h3>
			<button id="editProfile" type="button" class="btn btn-outline-custom btn-sm">Edit Profile</button>
			<div class="friends-list">
			<table class="friends-table">
				<thead>
					<tr>
						<th>Friends</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>user1</td>
						<td><span class="status-icon green"></span></td>
					</tr>
					<tr>
						<td>user2</td>
						<td><span class="status-icon red"></span></td>
					</tr>
					<tr>
						<td>user3</td>
						<td><span class="status-icon green"></span></td>
					</tr>
					<tr>
						<td>user4</td>
						<td><span class="status-icon red"></span></td>
					</tr>
					<tr>
						<td>user5</td>
						<td><span class="status-icon green"></span></td>
					</tr>
					<tr>
						<td>user6</td>
						<td><span class="status-icon red"></span></td>
					</tr>
					<tr>
						<td>user7</td>
						<td><span class="status-icon green"></span></td>
					</tr>
					<tr>
						<td>user8</td>
						<td><span class="status-icon red"></span></td>
					</tr>
					<tr>
						<td>user9</td>
						<td><span class="status-icon green"></span></td>
					</tr>
					<tr>
						<td>user10</td>
						<td><span class="status-icon red"></span></td>
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
	console.log("makeEditProfilePage: ", data);

	const imageMap = {
		"../../../files/default.jpg": "default.jpg",
		"../../../files/user(2).png": "user2.png",
		"../../../files/user(3).png": "user3.png",
		"../../../files/user(4).png": "user4.png",
		"../../../files/user(5).png": "user5.png",
		"../../../files/user(6).png": "user6.png",
		"../../../files/user(7).png": "user7.png",
		"../../../files/user(8).png": "user8.png",
		"../../../files/user(9).png": "user9.png",
	};

	const imageRows = [];
	const imageUrls = Object.keys(imageMap);

	for (let i = 0; i < imageUrls.length; i += 3) {
		const row = `
            <tr>
                <td><img src="${imageUrls[i]}" class="icons" data-filename="${imageMap[imageUrls[i]]}"></td>
                <td>${imageUrls[i + 1] ? `<img src="${imageUrls[i + 1]}" class="icons" data-filename="${imageMap[imageUrls[i + 1]]}">` : ''}</td>
                <td>${imageUrls[i + 2] ? `<img src="${imageUrls[i + 2]}" class="icons" data-filename="${imageMap[imageUrls[i + 2]]}">` : ''}</td>
            </tr>
        `;
		imageRows.push(row);
	}

	return `
        <div class="profile-container">
            <div class="profile-left">
                <img id="profile-img" src="${data.profile.profile_image_url}" alt="${data.user.username}" style="cursor: pointer;">
                <form>
                    <div class="form-group">
                        <label for="choosePicture">Click to choose new picture</label>
                        <input type="file" class="form-control-file" id="choosePicture" style="display: none;">
                    </div>
                    <table class="image-grid">
                        ${imageRows.join('')}
                    </table>
                </form>
            </div>

            <div class="profile-right">
                <table class="update-profile">
                    <tbody>
                        <tr>
                            <td colspan="2"><div class="profile-title">Edit ${data.user.username} profile</div></td>
                        </tr>
                        <tr>
                            <td class="update-profile-center"><div class="profile-info">Name:</div></td>
                            <td><div class="profile-description" for="name">${data.user.username}</div></td>
                        </tr>
                        <tr>
                            <td class="update-profile-center"><div class="profile-info">Email:</div></td>
                            <td>
                                <div class="profile-description" id="email">${data.user.email}</div>
                            </td>
                        </tr>
                        <tr>
                            <td class="update-profile-center">
                                <div class="profile-info">Nickname:</div>
                            </td>
                            <td>
                                <input type="text" class="form-profile" id="usernameForm" placeholder="Nickname" aria-label="Nickname" aria-describedby="basic-addon1" value="${data.profile.alias_name}" maxlength="20">
                            </td>
                        </tr>
                        <tr>
                            <td class="bio-textarea-title">
                                Bio:
                            </td>
                            <td>
                                <textarea class="bio-textarea" aria-label="With textarea" id="bioForm" maxlength="200"></textarea>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button type="button" class="btn btn-primary btn-sm" id="updateProfile">Update profile</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" id="back">Back</button>
                </div>
            </div>
        </div>
    `;
}

// Resultado da busca de outro usuário
function makeProfilePageSearchOther(data) {
	console.log("makeProfilePageSearchOther: ", data);
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

function makeProfileSettings(data) {
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


export { makeProfilePage, makeEditProfilePage, makeProfilePageSearchOther, noResultsPage, makeProfileSettings }