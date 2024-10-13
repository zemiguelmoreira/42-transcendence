import { navigateTo } from "../app.js";
import { getUserProfileByUsername } from "../profile/myprofile.js";

let snake_socket = null;
let playerIndex = null;
let stopFlag = false;
let ctx, canvasWidth, canvasHeight, player1Score, player2Score;
let snake1 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
let snake2 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
let foodColor = "#FF0000";
let food = { 'x': 0, 'y': 0 };
let selfUsername = null;
let matchSocket = null;
let dataPlayer1 = null;
let dataPlayer2 = null;
const gridSize = 20;

function setupSnake() {
	playerIndex = null;
	stopFlag = false;
	snake1 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
	snake2 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
	foodColor = "#FF0000";
	food = { 'x': 0, 'y': 0 };
	const canvas = document.getElementById('gameCanvasSnakeRemote');
	ctx = canvas.getContext('2d');
	canvasWidth = document.getElementById("gameCanvasSnakeRemote").width;
	canvasHeight = document.getElementById("gameCanvasSnakeRemote").height;
}

async function joinSnakeRoom(roomCode, username, matchmakingSocket) {
	selfUsername = username;

	if (matchmakingSocket !== false)
		matchSocket = matchmakingSocket;

	const snake_accessToken = localStorage.getItem('access_token');
	if (snake_socket && snake_socket.readyState !== WebSocket.CLOSED) {
		snake_socket.close();
		snake_socket = null;
	}

	snake_socket = new WebSocket(`wss://${window.location.host}/game/ws/snake/${roomCode}/?token=${snake_accessToken}`);
	snake_socket.onopen = async function () {
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
			dataPlayer1 = await getUserProfileByUsername(data.player_names[0]);
			dataPlayer2 = await getUserProfileByUsername(data.player_names[1]);
			console.log('Player1:', dataPlayer1);
			console.log('Player2:', dataPlayer2);

			document.getElementById('snakeName1').innerText = data.player_names[0] === dataPlayer1.user.username ? dataPlayer1.profile.alias_name : dataPlayer2.profile.alias_name;
			document.getElementById('snakeName2').innerText = data.player_names[1] === dataPlayer1.user.username ? dataPlayer1.profile.alias_name : dataPlayer2.profile.alias_name;
			startGame();

		} else if (data.action === 'countdown') {
			countdownDisplay(data.time);

		} else if (data.action === 'wait_for_player') {
			console.log('Waiting for another player to join...');

		} else if (data.action === 'game_over' && !stopFlag) {

			stopFlag = true;
			const winner = data.winner === dataPlayer1.user.username ? dataPlayer1.profile.alias_name : dataPlayer2.profile.alias_name;
			const loser = data.loser === dataPlayer1.user.username ? dataPlayer1.profile.alias_name : dataPlayer2.profile.alias_name;
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

	snake_socket.onclose = function () {
		snake_socket = null;
	};

}

function sendMoveCommand(direction) {
	if (snake_socket && playerIndex !== null) {
		snake_socket.send(JSON.stringify({
			action: 'move',
			player_index: playerIndex,
			direction: direction
		}));
	}
}

function drawGrid() {
	ctx.strokeStyle = '#345678'; 
	ctx.lineWidth = 1; 

	for (let x = 0; x <= canvasWidth; x += gridSize) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, canvasHeight);
		ctx.stroke();
	}

	for (let y = 0; y <= canvasHeight; y += gridSize) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(canvasWidth, y);
		ctx.stroke();
	}
}

function drawFood() {
	ctx.fillStyle = foodColor;
	ctx.fillStyle = foodColor;
	ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function drawSnakes() {
	const segmentCount1 = snake1['segments'].length;
	const segmentCount2 = snake2['segments'].length;

	for (let i = 0; i < segmentCount1; i++) {
		const segment = snake1.segments[i];
		const alpha = 1 - (i / (segmentCount1 - 1)) * 0.5; 
		const color = snake1.color;

		ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`;
		ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`;
		ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
	}

	for (let i = 0; i < segmentCount2; i++) {
		const segment = snake2.segments[i];
		const alpha = 1 - (i / (segmentCount2 - 1)) * 0.5;
		const alpha = 1 - (i / (segmentCount2 - 1)) * 0.5;
		const color = snake2.color;

		ctx.fillStyle = `rgba(${hexToRgb(color)}, ${alpha})`; 
		ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
	}
}

function hexToRgb(hex) {
	let r = 0, g = 0, b = 0;

	if (hex.length === 4) {
		r = parseInt(hex[1] + hex[1], 16);
		g = parseInt(hex[2] + hex[2], 16);
		b = parseInt(hex[3] + hex[3], 16);
	}
	else if (hex.length === 7) {
		r = parseInt(hex[1] + hex[2], 16);
		g = parseInt(hex[3] + hex[4], 16);
		b = parseInt(hex[5] + hex[6], 16);
	}

	return `${r},${g},${b}`;
}

function drawGame() {
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = '#000';
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);

	drawGrid();
	drawSnakes();
	drawFood();
}

document.addEventListener('keydown', function (event) {
	if (playerIndex === null) return;
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

function startGame() {
	gameLoop();
	gameLoop();
}

function showEndScreen(score, dataPlayer1, dataPlayer2) {
	if (!ctx) {
		const canvas = document.getElementById('gameCanvasSnakeRemote');
		ctx = canvas.getContext('2d');
	}

	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);

	const totalHeight = canvasHeight * 0.7;
	const partHeight = totalHeight / 4;
	const startY = (canvasHeight - totalHeight) / 2;

	const totalHeight = canvasHeight * 0.7;
	const partHeight = totalHeight / 4;
	const startY = (canvasHeight - totalHeight) / 2;

	ctx.textAlign = "center";
	ctx.fillStyle = "#fff";
	ctx.font = "50px CustomFont";
	ctx.fillText("WINNER", canvasWidth / 2, startY + partHeight);
	ctx.fillText("WINNER", canvasWidth / 2, startY + partHeight);

	ctx.fillStyle = "red";
	ctx.fillText("WINNER", canvasWidth / 2 + 4, startY + partHeight + 4);

	ctx.fillStyle = "#fff";
	ctx.font = "40px CustomFont";
	ctx.fillText(`${score.winner}`, canvasWidth / 2, startY + partHeight + 60);

	ctx.fillStyle = "#fff";
	ctx.font = "50px CustomFont";
	ctx.fillText("LOSER", canvasWidth / 2, startY + partHeight * 3);
	ctx.fillText("LOSER", canvasWidth / 2, startY + partHeight * 3);

	ctx.fillStyle = "red";
	ctx.fillText("LOSER", canvasWidth / 2 + 4, startY + partHeight * 3 + 4);

	ctx.fillStyle = "#fff";
	ctx.font = "40px CustomFont";
	ctx.fillText(`${score.loser}`, canvasWidth / 2, startY + partHeight * 3 + 60);
	setTimeout(() => {
		document.getElementById('invitePending').remove();
		navigateTo(`/user/${selfUsername}/snake`);
	}, 3000);
}

export { joinSnakeRoom };
