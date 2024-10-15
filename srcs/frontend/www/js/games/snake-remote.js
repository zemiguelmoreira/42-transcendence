import { navigateTo } from "../app.js";

let snake_socket = null;
let playerIndex = null;
let stopFlag = false;
let ctx, canvasWidth, canvasHeight, player1Score, player2Score;
let snake1 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
let snake2 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
let foodColor = "#FF0000";
let food = { 'x': 0, 'y': 0 };
let winner = null;
let selfUsername = null;
let matchSocket = null;
const gridSize = 20;

function setupSnake() {
	playerIndex = null;
	stopFlag = false;
	snake1 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
	snake2 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
	foodColor = "#FF0000";
	food = { 'x': 0, 'y': 0 };
	winner = null;
	const canvas = document.getElementById('gameCanvasSnakeRemote');
	ctx = canvas.getContext('2d');
	canvasWidth = document.getElementById("gameCanvasSnakeRemote").width;
	canvasHeight = document.getElementById("gameCanvasSnakeRemote").height;
}

async function joinSnakeRoom(roomCode, username, matchmakingSocket) {
	selfUsername = username;
	if (matchmakingSocket !== false)
		matchSocket = matchmakingSocket;

	console.log('selfUsername:', selfUsername);
	console.log('username:', username);

	const snake_accessToken = localStorage.getItem('access_token');
	if (snake_socket && snake_socket.readyState !== WebSocket.CLOSED) {
		snake_socket.close();
		snake_socket = null;
	}

	snake_socket = new WebSocket(`wss://${window.location.host}/game/ws/snake/${roomCode}/?token=${snake_accessToken}`);
	snake_socket.onopen = async function (event) {
		console.log('Snake WebSocket connection successfully opened:');
		setupSnake();
		snake_socket.send(JSON.stringify({
			action: 'join'
		}));
	};

	snake_socket.onerror = function (event) {
		console.error('Snake WebSocket encountered an error:', event.message || event);
		if (snake_socket.readyState === WebSocket.OPEN) {
			snake_socket.close();
			console.log('Snake Socket Closed on error');
		}
		snake_socket = null;
	};

	snake_socket.onmessage = async function (event) {
		const data = JSON.parse(event.data);

		if (data.action === 'unauthorized') {
			snake_socket.close();

		} else if (data.action === 'assign_index') {
			playerIndex = data.player_index;

		} else if (data.action === 'start_game') {
			console.log(`Game started. Player 1: ${data.player_names[0]}, Player 2: ${data.player_names[1]}`);
			document.getElementById('snakeName1').innerText = data.player_names[0];
			document.getElementById('snakeName2').innerText = data.player_names[1];
			startGame();

		} else if (data.action === 'countdown') {
			countdownDisplay(data.time);

		} else if (data.action === 'wait_for_player') {
			console.log('Waiting for another player to join...');

		} else if (data.action === 'game_over' && !stopFlag) {
			console.log(`Game over. Winner: ${data.winner}, Loser: ${data.loser}`);

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

			const parsedScore = JSON.parse(score);

			showEndScreen(parsedScore);

			if (snake_socket && snake_socket.readyState === WebSocket.OPEN) {
				snake_socket.close();
				console.log('Snake Socket Closed after game over');
			}

		} else {

			if (!stopFlag) {
				document.getElementById('snakeScore1').innerText = player1Score = data['score'][0];
				document.getElementById('snakeScore2').innerText = player2Score = data['score'][1];
				snake1 = data.snakes[0];
				snake2 = data.snakes[1];
				food = data['food'];
			}
		}
	};

	snake_socket.onclose = function (event) {
		snake_socket = null;
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

	drawGrid();
	drawSnakes();
	drawFood();
}

document.addEventListener('keydown', function (event) {
	if (playerIndex === null) return;
	// console.log(event.key);
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

	if ((matchSocket && window.location.pathname !== `/user/${selfUsername}/snake-game-remote` && !stopFlag)
		|| (!matchSocket && window.location.pathname !== `/user/${selfUsername}/chat-playing` && !stopFlag)) {
		console.log('User left the game!');

		if (document.getElementById('invitePending')) {
			document.getElementById('invitePending').remove();
		}

		if (snake_socket.readyState === WebSocket.OPEN) {
			setTimeout(() => {
				snake_socket.close();
			}, 1000);
			console.log('Snake Socket Closed on gameLoop');
		}

		stopFlag = true;
		return;
	}

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

function showEndScreen(score = null) {
	if (!ctx) {
		const canvas = document.getElementById('gameCanvasSnakeRemote');
		ctx = canvas.getContext('2d');
	}

	// Limpa o canvas e define fundo semitransparente
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);

	// Ajuste da altura total disponível para o conteúdo
	const totalHeight = canvasHeight * 0.7; // Usamos 70% da altura do canvas para os textos
	const partHeight = totalHeight / 4; // Divide essa altura em 4 partes

	// Define a posição de início para centrar os textos verticalmente
	const startY = (canvasHeight - totalHeight) / 2; // Centraliza o conteúdo no canvas

	// Texto para "WINNER" na segunda parte do canvas
	ctx.textAlign = "center";
	ctx.fillStyle = "#fff";
	ctx.font = "50px CustomFont";
	ctx.fillText("WINNER", canvasWidth / 2, startY + partHeight); // Elevar um pouco mais o texto

	// Desenhar "WINNER" em vermelho deslocado
	ctx.fillStyle = "red";
	ctx.fillText("WINNER", canvasWidth / 2 + 4, startY + partHeight + 4);

	// Nome e pontuação do vencedor
	ctx.fillStyle = "#fff"; // Texto em branco
	ctx.font = "40px CustomFont"; // Tamanho do texto para o nome
	ctx.fillText(`${score.winner}`, canvasWidth / 2, startY + partHeight + 60); // Ajustar a posição do nome

	// Texto para "LOSER" na terceira parte do canvas
	ctx.fillStyle = "#fff";
	ctx.font = "50px CustomFont";
	ctx.fillText("LOSER", canvasWidth / 2, startY + partHeight * 3); // Elevar o texto

	// Desenhar "LOSER" em vermelho deslocado
	ctx.fillStyle = "red";
	ctx.fillText("LOSER", canvasWidth / 2 + 4, startY + partHeight * 3 + 4);

	// Nome e pontuação do perdedor
	ctx.fillStyle = "#fff"; // Texto em branco
	ctx.font = "40px CustomFont"; // Tamanho do texto para o nome
	ctx.fillText(`${score.loser}`, canvasWidth / 2, startY + partHeight * 3 + 60); // Ajustar a posição do nome

	// Remover o elemento 'invitePending' após 3 segundos
	setTimeout(() => {
		document.getElementById('invitePending').remove();
		navigateTo(`/user/${selfUsername}/snake`);
	}, 3000);
}

export { joinSnakeRoom };
