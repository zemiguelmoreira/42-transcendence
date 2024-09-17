
let snake_socket;

let playerIndex = null;
let stopFlag = false;

let canvas, ctx, canvasWidth, canvasHeight;
let player1Score = 0;
let player2Score = 0;

let player1Name = "";
let player2Name = "";

const gridSize = 20;

let snake1 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };
let snake2 = { color: '#000000', segments: [{ x: 0, y: 0 }, { x: 0, y: 0 }], direction: 'RIGHT', newDirection: 'RIGHT', alive: true };

let foodColor = "#FF0000";
let food = { 'x': 0, 'y': 0 };

function setupSnake() {
	const canvas = document.getElementById('gameCanvasSnakeRemote');
	
	// canvas = document.querySelector("canvas");
	
	ctx = canvas.getContext('2d');
	canvasWidth = document.getElementById("gameCanvasSnakeRemote").width;
	canvasHeight = document.getElementById("gameCanvasSnakeRemote").height;
	
	// let upPressed = false;
	// let downPressed = false;
	// let leftPaddleSound = new Audio('./files/pong-assets/ping.wav');
	// let rightPaddleSound = new Audio('./files/pong-assets/pong.wav');
	// let wallSound = new Audio('./files/pong-assets/wall.wav');
	// let goalSound = new Audio('./files/pong-assets/goal.wav');
}


function joinSnakeRoom(roomCode) {
	const snake_accessToken = localStorage.getItem('access_token');

	setupSnake();

	snake_socket = new WebSocket(`wss://${window.location.host}/game/ws/snake/${roomCode}/?token=${snake_accessToken}`);

	snake_socket.onmessage = async function (event) {
		const data = JSON.parse(event.data);
		if (data.action === 'unauthorized') {
			// Tratamento para usuários não autorizados
		} else if (data.action === 'assign_index') {
			playerIndex = data.player_index;
		} else if (data.action === 'start_game') {
			//receber valores
			startGame();
		} else if (data.action === 'wait_for_player') {
			console.log('waiting players');
		} else if (data.action === 'game_over' && !stopFlag) {
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

		} else {
			// console.log('data from else(gameloop): ', data);
			if (!stopFlag)
			{
				player1Score = data['score'][0];
				player2Score = data['score'][1];
				snake1 = data.snakes[0];
				snake2 = data.snakes[1];
				food = data['food'];
			}
		}
	};

	snake_socket.onopen = function (event) {
		snake_socket.send(JSON.stringify({ action: 'join' }));
	};

	snake_socket.onclose = function (event) {
		// console.log('WebSocket connection closed:', event);
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
	ctx.strokeStyle = 'black'; // Cor das linhas da grelha
	ctx.lineWidth = 0.5; // Espessura das linhas

	// Desenha as linhas verticais
	for (let x = 0; x <= canvas.width; x += gridSize) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, canvas.height);
		ctx.stroke();
	}
	
	// Desenha as linhas horizontais
	for (let y = 0; y <= canvas.height; y += gridSize) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(canvas.width, y);
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

	ctx.clearRect(0, 0, canvas.width, canvas.height);

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
	drawGame();
	requestAnimationFrame(gameLoop);
}

function countdown(callback) {
	let count = 3;

	function drawCountdown() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
		ctx.font = '48px Arial';
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		ctx.fillText(count, canvas.width / 2, canvas.height / 2);
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

export { joinSnakeRoom };