let snake_socket;
let playerIndex = null;
let stopFlag = false;
let canvas, ctx, canvasWidth, canvasHeight;
let player1Score = 0;
let player2Score = 0;
let player1Name = "";
let player2Name = "";
let snake1 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
let snake2 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
let foodColor = "#FF0000";
let food = { 'x': 0, 'y': 0 };
let winner = null;

const gridSize = 20;

function setupSnake() {
	console.log('Setting up snake game');
	const canvas = document.getElementById('gameCanvasSnakeRemote');
	ctx = canvas.getContext('2d');

	canvasWidth = document.getElementById("gameCanvasSnakeRemote").width;
	canvasHeight = document.getElementById("gameCanvasSnakeRemote").height;
}

function joinSnakeRoom(roomCode) {
	console.log('Joining snake room:', roomCode);
	const snake_accessToken = localStorage.getItem('access_token');

	setupSnake();

	snake_socket = new WebSocket(`wss://${window.location.host}/game/ws/snake/${roomCode}/?token=${snake_accessToken}`);

	snake_socket.onmessage = async function (event) {
		// console.log('onmessage(gameloop): ', event);
		const data = JSON.parse(event.data);
		console.log('data from onmessage(gameloop): ', data);

		if (data.action === 'unauthorized') {
			// Unauthorized
			console.log('unauthorized');
			snake_socket.close();

		} else if (data.action === 'assign_index') {
			// Assign player index
			console.log('playerIndex:', playerIndex);
			playerIndex = data.player_index;

		} else if (data.action === 'start_game') {
			// Start game
			startGame();
			console.log('game started');

		} else if (data.action === 'countdown') {
			// Exibe o tempo do countdown
			countdownDisplay(data.time);

		} else if (data.action === 'wait_for_player') {
			// Wait for player
			console.log('waiting players');

		} else if (data.action === 'game_over' && !stopFlag) {
			// Game over
			console.log('game over');

			winner = data.winner;
			stopFlag = true;
			const loser = data.loser;
			const winnerScore = data.winner_score;
			const loserScore = data.loser_score;
			const gameType = 'snake';
			const timestamp = new Date().toISOString();

			const score = JSON.stringify({
				winner: winner,
				loser: loser,
				game_type: gameType,
				winner_score: winnerScore,
				loser_score: loserScore,
				timestamp: timestamp,
				ranked: true
			});

			showEndScreen(winner);

		} else {
			// Game loop
			console.log('data from else(gameloop): ', data);
			if (!stopFlag) {
				player1Score = data['score'][0];
				player2Score = data['score'][1];
				snake1 = data.snakes[0];
				snake2 = data.snakes[1];
				food = data['food'];
			}
		}
	};

	snake_socket.onopen = function (event) {
		console.log('WebSocket connection opened:', event);
		snake_socket.send(JSON.stringify({ action: 'join' }));
	};

	snake_socket.onclose = function (event) {
		console.log('WebSocket connection closed:', event);
	};
}

function sendMoveCommand(direction) {
	if (playerIndex !== null) {
		snake_socket.send(JSON.stringify({
			action: 'move',
			player_index: playerIndex,
			direction: direction
		}));
	}
}

function drawGrid() {
	ctx.strokeStyle = '#345678'; // Cor das linhas da grelha
	ctx.lineWidth = 1; // Espessura das linhas

	// Desenha as linhas verticais
	for (let x = 0; x <= canvasWidth; x += gridSize) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, canvasHeight);
		ctx.stroke();
	}

	// Desenha as linhas horizontais
	for (let y = 0; y <= canvasHeight; y += gridSize) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(canvasWidth, y);
		ctx.stroke();
	}
}

function drawFood() {
	ctx.fillStyle = foodColor; // Usa a cor armazenada
	ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function drawSnakes() {
	const segmentCount1 = snake1['segments'].length;
	const segmentCount2 = snake2['segments'].length;

	for (let i = 0; i < segmentCount1; i++) {
		const segment = snake1.segments[i];
		const alpha = 1 - (i / (segmentCount1 - 1)) * 0.5; // Calcula o valor alfa baseado na posição do segmento
		const color = snake1.color;

		ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`; // Ajusta a cor com opacidade
		ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
	}

	for (let i = 0; i < segmentCount2; i++) {
		const segment = snake2.segments[i];
		const alpha = 1 - (i / (segmentCount2 - 1)) * 0.5; // Calcula o valor alfa baseado na posição do segmento
		const color = snake2.color;

		ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`; // Ajusta a cor com opacidade
		ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
	}
}

function hexToRgb(hex) {
	let r = 0, g = 0, b = 0;

	// 3 dígitos
	if (hex.length === 4) {
		r = parseInt(hex[1] + hex[1], 16);
		g = parseInt(hex[2] + hex[2], 16);
		b = parseInt(hex[3] + hex[3], 16);
	}
	// 6 dígitos
	else if (hex.length === 7) {
		r = parseInt(hex[1] + hex[2], 16);
		g = parseInt(hex[3] + hex[4], 16);
		b = parseInt(hex[5] + hex[6], 16);
	}

	return `${r},${g},${b}`;
}

function drawGame() {

	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = '#000'; // Preto
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);

	drawGrid(); // Desenha a grelha antes de desenhar outros elementos
	drawSnakes();
	drawFood(); // Desenha a comida
}

document.addEventListener('keydown', function (event) {
	if (playerIndex === null) return;
	console.log(event.key);
	switch (event.key) {
		case 'ArrowUp':
			sendMoveCommand('UP');
			break;
		case 'ArrowDown':
			sendMoveCommand('DOWN');
			break;
		case 'ArrowLeft':
			sendMoveCommand('LEFT');
			break;
		case 'ArrowRight':
			sendMoveCommand('RIGHT');
			break;
	}
});

function gameLoop() {
	console.log('gameLoop');
	if (stopFlag == true)
		return;
	drawGame();
	requestAnimationFrame(gameLoop);
}

function countdown(callback) {
	let count = 3;

	function drawCountdown() {
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		// ctx.drawImage(backgroundImg, 0, 0, canvasWidth, canvasHeight);
		ctx.font = '48px Arial';
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		ctx.fillText(count, canvasWidth / 2, canvasHeight / 2);
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

function showEndScreen(winnerName) {
	if (!ctx) {
		const canvas = document.getElementById('gameCanvasSnakeRemote');
		ctx = canvas.getContext('2d');
	}

	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = "#fff";
	ctx.font = "50px CustomFont";
	ctx.textAlign = "center";

	if (winnerName === "No winner") {
		ctx.fillText("DRAW!", canvasWidth / 2, canvasHeight / 2 + 20);
	} else {
		ctx.fillText(`WINNER: ${winnerName}`, canvasWidth / 2, canvasHeight / 2 + 20);
	}

	setTimeout(() => {
		document.getElementById('gameDiv').remove();
	}, 3000);
}


export { joinSnakeRoom };