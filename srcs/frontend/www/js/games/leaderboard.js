

function makeLeaderboardPage() {
	return `
<div class="profile-container">
    <div class="profile-full">
        <div class="leaderboard-table"><img src="/files/trophy.png" class="leaderboard-trophy"></div>
        <!--<div class="leaderboard-title" style="text-align:center !important;">LEADERBOARD</div>-->
		<div  class="leaderboard-title" style="text-align:center;"><img src="/files/leaderboard.png" style="width: 528px; height:48px;"></div>
        <div class="leaderboard-results">
            <div class="leaderboard-results-column">
                <div class="profile-title" style="text-align:center !important;">PONG RANKING</div>
                <ul class="leaderboard-table-row" id="pongRankings"></ul>
            </div>
            <div class="leaderboard-results-column">
                <div class="profile-title" style="text-align:center !important;">SNAKE RANKING</div>
                <ul class="leaderboard-table-row" id="snakeRankings"></ul>
            </div>
        </div>
    </div>
</div>

	`;
}

function leaderboard() {
	document.getElementById('mainContent').innerHTML = '';
	const leaderboardPage = makeLeaderboardPage();
	document.getElementById('mainContent').insertAdjacentHTML('afterbegin', leaderboardPage);

	fetchPongRankings();
	fetchSnakeRankings();

}

async function fetchPongRankings() {
	const accessToken = localStorage.getItem('access_token');
	console.log('Access Token:', accessToken);
	try {
		const response = await fetch('/api/profile/pong_rankings/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error('Failed to fetch Pong rankings');
		}

		const data = await response.json();
		console.log('Pong Rankings:', data.pong_rankings);

		const pongRankingsElement = document.getElementById('pongRankings');
		pongRankingsElement.innerHTML = '';
		let counter = 1;
		data.pong_rankings.forEach(player => {
			if (player.pong_rank !== 0) {
				const li = document.createElement('li');
				li.className = 'leaderboard-row';
				const img = document.createElement('img');
				img.src = `https://${window.location.host}${player.profile_image_url}` || 'default.jpg';
				console.log(img.src);
				img.alt = `${player.username}'s profile image`;
				img.width = 50;
				img.height = 50;
				li.appendChild(document.createTextNode(`${counter++} `));
				li.appendChild(img);
				li.appendChild(document.createTextNode(` ${player.username} ${player.pong_rank} XP`));
				pongRankingsElement.appendChild(li);
			}
		});

	} catch (error) {
		console.error('Error fetching Pong rankings:', error.message);
	}
}

async function fetchSnakeRankings() {
	const accessToken = localStorage.getItem('access_token');
	console.log('Access Token:', accessToken);
	try {
		const response = await fetch('/api/profile/snake_rankings/', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error('Failed to fetch Snake rankings');
		}

		const data = await response.json();
		console.log('Snake Rankings:', data.snake_rankings);

		const snakeRankingsElement = document.getElementById('snakeRankings');
		snakeRankingsElement.innerHTML = '';
		let counter = 1;
		data.snake_rankings.forEach(player => {
			if (player.snake_rank !== 0) {
				const li = document.createElement('li');
				li.className = 'leaderboard-row';
				const img = document.createElement('img');
				img.src = player.profile_image_url ? `https://${window.location.host}${player.profile_image_url}` : 'default.jpg'; // Exibe uma imagem padrão se o profile_image for null
				img.alt = `${player.username}'s profile image`;
				img.width = 50;
				img.height = 50;
				li.appendChild(document.createTextNode(`${counter++} `));
				li.appendChild(img);
				li.appendChild(document.createTextNode(` ${player.username} ${player.snake_rank} XP`));
				snakeRankingsElement.appendChild(li);
			}
		});

	} catch (error) {
		console.error('Error fetching Snake rankings:', error.message);
	}
}

export { leaderboard };