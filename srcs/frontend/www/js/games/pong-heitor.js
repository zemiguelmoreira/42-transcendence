let pong_socket;
let paddlePositions = "";
let ballPosition = "";
let playerIndex = null;
let stopFlag = false;

let canvas, context;
let backgroundImg, ballImg, paddle1Img, paddle2Img;

function setupPong() {
	canvas = document.querySelector("canvas");
	context = canvas.getContext('2d');

	backgroundImg = new Image();
	backgroundImg.src = '../../files/pong-assets/BackgroundGrid.png';

	ballImg = new Image();
	ballImg.src = '../../files/pong-assets/Ball.png';

	paddle1Img = new Image();
	paddle1Img.src = '../../files/pong-assets/Paddle_1.png';

	paddle2Img = new Image();
	paddle2Img.src = '../../files/pong-assets/Paddle_2.png';
}

async function createRoom(authorizedUser) {
	const pong_accessToken = localStorage.getItem('access_token');
	let data;

	try {
		const response = await fetch('/game/create-room/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${pong_accessToken}`
			},
			body: JSON.stringify({
				authorized_user: authorizedUser
			}),
		});
		data = await response.json();
		console.log("CreateRoom: ", data);
		if (!response.ok) {
			console.error('error:', data);
		}
	} catch (error) {
		console.error('Error creating room:', error);
	}

	// joinRoom(data.code);
	return data.code;
}

function joinRoom(roomCode) {
	const pong_accessToken = localStorage.getItem('access_token');

	try {
		document.getElementById('invitePending').innerHTML = `
		<div class="pong-content">
			<div class="pong-box"><canvas width="980" height="420"></canvas></div>
		</div>
		`;
	} catch (error) {
		console.error('Erro ao carregar o conteúdo:', error);
	}

	setupPong();

	pong_socket = new WebSocket(`wss://${window.location.host}/game/ws/pong/${roomCode}/?token=${pong_accessToken}`);

	pong_socket.onmessage = async function (event) {
		const data = JSON.parse(event.data);
		if (data.action === 'unauthorized') {
			// Tratamento para usuários não autorizados
		} else if (data.action === 'assign_index') {
			playerIndex = data.player_index;
			ballPosition = data.ball_position;
			paddlePositions = data.paddle_positions;
		} else if (data.action === 'start_game') {
			startGame();
		} else if (data.action === 'game_over' && !stopFlag) {

			// MSG de fim de jogo
			try {
				document.getElementById('invitePending').innerHTML = `
					<button id='cancelButton' class="btn btn-danger">Game Over</button>
				`;
				document.getElementById('cancelButton').addEventListener('click', () => {
					document.getElementById('invitePending').remove();
				});
			} catch (error) {
				console.error('Erro ao carregar o conteúdo:', error);
			}

			stopFlag = true;
			const winner = data.winner;
			const loser = data.loser;
			const winnerScore = data.winner_score;
			const loserScore = data.loser_score;
			const gameType = 'pong';
			const timestamp = new Date().toISOString();

			const score = JSON.stringify({
				winner: winner,
				loser: loser,
				game_type: gameType,
				winner_score: winnerScore,
				loser_score: loserScore,
				timestamp: timestamp
			});

		} else {
			ballPosition = data.ball_position;
			paddlePositions = data.paddle_positions;
		}
	};

	pong_socket.onopen = function (event) {
		pong_socket.send(JSON.stringify({ action: 'join' }));
	};

	pong_socket.onclose = function (event) {
		// console.log('WebSocket connection closed:', event);
	};
}

function sendMoveCommand(direction) {
	if (playerIndex !== null) {
		pong_socket.send(JSON.stringify({
			action: 'move',
			player_index: playerIndex,
			direction: direction
		}));
	}
}

function drawGame(ball, paddles) {
	context.clearRect(0, 0, canvas.width, canvas.height);

	// Desenhar o fundo
	context.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

	// Desenhar a bola
	context.drawImage(ballImg, ball[0] - ballImg.width / 2, ball[1] - ballImg.height / 2);

	// Desenhar os paddles
	context.drawImage(paddle1Img, paddles[0][0], paddles[0][1]);
	context.drawImage(paddle2Img, paddles[1][0], paddles[1][1]);
}

document.addEventListener('keydown', function (event) {
	if (playerIndex === null) return;
	switch (event.key) {
		case 'w':
			sendMoveCommand('up');
			break;
		case 's':
			sendMoveCommand('down');
			break;
	}
});

document.addEventListener('keyup', function (event) {
	if (playerIndex === null) return;
	switch (event.key) {
		case 'w':
		case 's':
			sendMoveCommand('idle');
			break;
	}
});

function gameLoop() {
	drawGame(ballPosition, paddlePositions);
	requestAnimationFrame(gameLoop);
}

function countdown(callback) {
	let count = 3;

	function drawCountdown() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
		context.font = '48px Arial';
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.fillText(count, canvas.width / 2, canvas.height / 2);
	}

	function updateCountdown() {
		if (count > 0) {
			drawCountdown();
			count--;
			setTimeout(updateCountdown, 1000);
		} else {
			callback();
		}
	}

	updateCountdown();
}

function startGame() {
	countdown(gameLoop);
}

export { createRoom, joinRoom };
