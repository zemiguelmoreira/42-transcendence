

function makeProfilePage(data) {
	return `
	<div class="profile-container">
		<div class="profile-left">
			<img id="profile-img" src="${data.profile.profile_image_url}" alt="${data.user.username}">
			<h3 id="username">${data.profile.alias_name}</h3>
			<button id="editProfile" type="button" class="btn btn-outline-custom btn-sm">Edit Profile</button>
			<div id="friends-card-list" class="friends-list"></div>
		</div>
		<div class="profile-right">
			<div class="profile-title">My Profile</div>
			<div class="profile-info">
				<label class="profile-label" for="username">Name:</label>
				<span class="profile-description" id="username">${data.user.username}</span>
			</div>
			<div class="profile-info">
				<label class="profile-label" for="email">Email:</label>
				<span class="profile-description" id="email">${data.user.email}</span>
			</div>
			<div class="profile-info">
				<label class="profile-label" class="profile-label" for="name">Nickname:</label>
				<span class="profile-description" id="name">${data.profile.alias_name}</span>
			</div>
			<div class="profile-info">
				<label class="profile-label" class="profile-label" for="bio">Biography:</label>
				<span class="profile-description bio" id="bio">${data.profile.bio}</span>
			</div>
			<div class="profile-title">Games Statistics</div>
			<table class="games-statistics">
				<thead>
					<tr>
						<th>Game</th>
						<th>Points</th>
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
			<table class="matches-history" border="1" cellspacing="0" cellpadding="5">
				<thead>
					<tr>
						<th>Winner</th>
						<th>W.Score</th>
						<th>Loser</th>
						<th>L.Score</th>
						<th>Date - Time</th>
					</tr>
				</thead>
			</table>
			<div id="pongTableContainer" class="matchContainer"></div>
			<div class="profile-title">Snake Matches History</div>
			<table class="matches-history" border="1" cellspacing="0" cellpadding="5">
				<thead>
					<tr>
						<th>Winner</th>
						<th>W.Score</th>
						<th>Loser</th>
						<th>L.Score</th>
						<th>Date - Time</th>
					</tr>
				</thead>
			</table>
			<div id="snakeTableContainer" class="matchContainer"></div>
		</div>
	</div>
	`;
}

function makeEditProfilePage(data) {
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
                                <input type="text" class="form-profile" id="usernameForm" placeholder="Nickname" aria-label="Nickname" aria-describedby="basic-addon1" value="${data.profile.alias_name}" maxlength="8">
                            </td>
                        </tr>
                        <tr>
                            <td class="bio-textarea-title">
                                Bio:
                            </td>
                            <td>
                                <textarea class="bio-textarea" aria-label="With textarea" id="bioForm" maxlength="200">${data.profile.bio}</textarea>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">

					<button type="button" class="btn btn-primary btn-sm" id="updateProfile">Save</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" id="backButton">Back</button>
                </div>
            </div>
        </div>
    `;
}

function makePasswordProfilePage(data) {
	return `
			<div class="profile-container">
				<div class="profile-left">
					<div class="password-box">
						<div class="password-title">
							<label class="font-custom --bs-green">REQUIREMENTS</label>
						</div>
						<div class="password-requeriments">
							<label class="font-custom --bs-green">8 characters</label>
							<label class="font-custom --bs-green">1 uppercase letter</label>
							<label class="font-custom --bs-green">1 lowercase letter</label>
							<label class="font-custom --bs-green">1 number</label>
						</div>
					</div>
				</div>
				<div class="profile-right">
					<form id="changePasswordForm" class="login-middle-box">
						<img src="../../../files/padlock.png" alt="Game Image" width="150" height="150">
						<div class="login-form">
							<label class="font-custom --bs-green password-title">RESET PASSWORD</label>
							<input class="form-control button-size" type="password" id="currentPassword" placeholder="CURRENT PASSWORD" required>
							<input class="form-control button-size" type="password" id="newPassword" placeholder="INSERT NEW PASSWORD" required>
							<input class="form-control button-size" type="password" id="confirmNewPassword" placeholder="CONFIRM NEW PASSWORD" required>
							<button class="btn btn-outline-custom button-size" type="button" id="resetPasswordBtn">CHANGE PASSWORD</button>
							<button class="btn btn-outline-secondary button-size" id="cancelChangePassword">CANCEL</button>
						</div>
					</form>
				</div>
			</div>
    `;
}

function makeProfilePageSearchOther(data) {
	console.log('Others Profile: ', data);
	return `
	<div class="profile-container">
		<div class="profile-left">
			<img id="profile-img" src="${data.profile.profile_image_url}" alt="User Picture">
			<h3 id="username">${data.profile.alias_name}</h3>
			<div class="friends-list">
				<button id="addFriend" type="button" class="btn btn-success btn-sm">Add Friend</button>
			</div>
			<div class="friends-list">
				<button id="blockUser" type="button" class="btn btn-danger btn-sm">Block User</button>
			</div>
		</div>
		<div class="profile-right">
			<div class="profile-title">Profile: ${data.user.username}</div>
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
			<table class="games-statistics">
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
			<table class="matches-history" border="1" cellspacing="0" cellpadding="5">
				<thead>
					<tr>
						<th>Winner</th>
						<th>W.Score</th>
						<th>Loser</th>
						<th>L.Score</th>
						<th>Date - Time</th>
					</tr>
				</thead>
			</table>
			<div id="pongTableContainer" class="matchContainer"></div>
			<div class="profile-title">Snake Matches History</div>
			<table class="matches-history" border="1" cellspacing="0" cellpadding="5">
				<thead>
					<tr>
						<th>Winner</th>
						<th>W.Score</th>
						<th>Loser</th>
						<th>L.Score</th>
						<th>Date - Time</th>
					</tr>
				</thead>
			</table>
			<div id="snakeTableContainer" class="matchContainer"></div>
		</div>
	</div>
	`;
}

function noResultsPage(searchValue) {
	return `
	<div class="noResultMsg">No results found</div>
	<div class="noResultFound"><img src="../../../../../files/noUserFound.gif"></div>
	`;
}

function makeSettingsPage(data) {
	return `
		<div class="profile-container">
			<div class="profile-left">
				<img id="profile-img" src="${data.profile.profile_image_url}" alt="${data.user.username}">
				<h3 id="username">${data.profile.alias_name}</h3>
				<div class="profile-title">Account Settings</div>
				<div id="securityBox">
					<div class="profile-label">2FA</div>
					<div class="form-check form-switch authenticBox">
						<input class="form-check-input" type="checkbox" id="flexSwitchCheckDefault">
						<label id="mfaStatus" class="form-check-label toggleAuthentic" for="flexSwitchCheckDefault">Activated</label>
					</div>
				</div>
				<button type="button" class="btn btn-primary btn-sm security-btn" id="changePassword">Change Password</button>
				<button type="button" class="btn btn-primary btn-sm security-btn" id="deleteAccount">Delete Account</button>
			</div>
			<div class="profile-right">
				<div class="profile-title">Friends Management</div>
				<div id="friends-list"></div>
				<div class="profile-title">Blocked Users Management</div>
				<div id="blocked-list"></div>
			</div>
		</div>
	`;
}

async function toggleTwoFactorAuth(isEnabled) {
    try {
        const response = await fetch('/api/toggle-2fa/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}` // Assuming you're using token-based authentication
            },
            body: JSON.stringify({ enable_2fa: isEnabled })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Something went wrong');
        }
		
        const data = await response.json();
		console.log(data);
	} catch (error) {
		console.log(error);
	}
}

export { makeProfilePage, makeEditProfilePage, makeProfilePageSearchOther, noResultsPage, makeSettingsPage , makePasswordProfilePage , toggleTwoFactorAuth };