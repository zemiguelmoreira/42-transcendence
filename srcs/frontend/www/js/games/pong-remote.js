import { navigateTo } from "../app.js";

const paddleWidth = 10;
const paddleHeight = 90;
const ballSize = 10;

// Armazena as posições anteriores para limpar as áreas correspondentes
let previousBallX = 0;
let previousBallY = 0;
let previousLeftPaddleY = 0;
let previousRightPaddleY = 0;

let pong_socket;
let paddlePositions = "";
let ballPosition = "";
let playerIndex = null;
let stopFlag = false;
let canvas, ctx, backgroundCanvas, backgroundCtx, canvasWidth, canvasHeight;
let player1Score = 0;
let player2Score = 0;
let ballX = 0;
let ballY = 0;
let leftPaddleY = 0;
let rightPaddleY = 0;
let player1Name = "";
let player2Name = "";
let selfUsername = null;
let matchSocket = null;

function setupPong() {
	paddlePositions = "";
	ballPosition = "";
	playerIndex = null;
	stopFlag = false;
	player1Score = 0;
	player2Score = 0;
	ballX = 0;
	ballY = 0;
	leftPaddleY = 0;
	rightPaddleY = 0;
	player1Name = "";
	player2Name = "";

	backgroundCanvas = document.getElementById("pongBackgroundCanvas");
	backgroundCtx = backgroundCanvas.getContext("2d");
	canvas = document.querySelector("canvas");
	ctx = canvas.getContext('2d');
	canvasWidth = document.getElementById("pongCanvas").width;
	canvasHeight = document.getElementById("pongCanvas").height;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

	// Desenha o fundo e a linha central no canvas de fundo, apenas uma vez
	drawDashedLine();
	drawScores();
	drawPlayerNames();
}

function joinPongRoom(roomCode, username, matchmakingSocket) {
	selfUsername = username;
	if (matchmakingSocket !== false)
		matchSocket = matchmakingSocket;

	const pong_accessToken = localStorage.getItem('access_token');

	try {
		document.getElementById('invitePending').innerHTML = `
        <div class="pong-content">
        <div class="pong-box">
        <canvas id="pongBackgroundCanvas" width="960" height="560"></canvas>
        <canvas id="pongCanvas" width="960" height="560"></canvas>
        </div>
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
			console.log('Unauthorized to join the game!');
			pong_socket.close();
			return;

		} else if (data.action === 'assign_index') {
			playerIndex = data.player_index;
			ballPosition = data.ball_position;
			paddlePositions = data.paddle_positions;

		} else if (data.action === 'start_game') {
			player1Name = data.player_names[0];
			player2Name = data.player_names[1];
			startGame();

		} else if (data.action === 'countdown') {
			countdownDisplay(data.time);


		} else if (data.action === 'game_over' && !stopFlag) {

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
				timestamp: timestamp,
			});

			const parsedScore = JSON.parse(score);

			showEndScreen(parsedScore);

			if (pong_socket.readyState === WebSocket.OPEN) {
				pong_socket.close();
				console.log('Pong Socket Closed on gameLoop');
			}

		} else {

			if (!stopFlag) {
				player1Score = data.score[0];
				player2Score = data.score[1];
				ballX = data.ball_position[0];
				ballY = data.ball_position[1];
				leftPaddleY = data.paddle_positions[0][1];
				rightPaddleY = data.paddle_positions[1][1];
			}
		};

		pong_socket.onopen = function () {
			pong_socket.send(JSON.stringify({
				action: 'join'
			}));
		};

		pong_socket.onclose = function (event) {
			// console.log('Pong Socket Closed: onclose():', event);
		};
	}
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

function drawPlayerNames() {
	backgroundCtx.font = "30px PongFont"; // Defina o tamanho e a fonte do texto
	backgroundCtx.fillStyle = "gray"; // Defina a cor do texto

	const centerLineX = canvasWidth / 2;

	const player1NameWidth = backgroundCtx.measureText(player1Name).width;

	const player1X = centerLineX - player1NameWidth - 20;

	backgroundCtx.textAlign = "left";

	const player2X = centerLineX + 20;

	const nameY = 170; // Ajuste o valor conforme necessário para posicionar o nome abaixo dos dígitos

	backgroundCtx.fillText(player1Name, player1X, nameY); // Nome do Jogador 1
	backgroundCtx.fillText(player2Name, player2X, nameY); // Nome do Jogador 2
}

function drawDigit(ctx, n, x, y) {
	const segmentSize = 20; // Tamanho de cada segmento (20x20 pixels)
	const segmentMargin = 0; // Espaçamento entre segmentos
	if (n >= 10) { n = 9; }

	const digits = [
		[[1, 1, 1], [1, 0, 1], [1, 0, 1], [1, 0, 1], [1, 1, 1]], // 0
		[[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]], // 1
		[[1, 1, 1], [0, 0, 1], [1, 1, 1], [1, 0, 0], [1, 1, 1]], // 2
		[[1, 1, 1], [0, 0, 1], [1, 1, 1], [0, 0, 1], [1, 1, 1]], // 3
		[[1, 0, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 0, 1]], // 4
		[[1, 1, 1], [1, 0, 0], [1, 1, 1], [0, 0, 1], [1, 1, 1]], // 5
		[[1, 1, 1], [1, 0, 0], [1, 1, 1], [1, 0, 1], [1, 1, 1]], // 6
		[[1, 1, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]], // 7
		[[1, 1, 1], [1, 0, 1], [1, 1, 1], [1, 0, 1], [1, 1, 1]], // 8
		[[1, 1, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 0, 1]], //9
	];

	ctx.fillStyle = "white"; // Branco

	const digitMatrix = digits[n];
	digitMatrix.forEach((row, i) => {
		row.forEach((value, j) => {
			if (value === 1) {
				ctx.fillRect(
					x + j * (segmentSize + segmentMargin),
					y + i * (segmentSize + segmentMargin),
					segmentSize,
					segmentSize
				);
			}
		});
	});
}

function drawPONG(letterSpacing = -5) {
	ctx.font = "100px PongFont";  // Escolha a fonte e o tamanho desejado
	ctx.fillStyle = "#69696950";  // Cor do texto (branco)

	const text = "PONG";

	const totalTextWidth = ctx.measureText(text).width + (text.length - 1) * letterSpacing - 15;
	let xPosition = (canvasWidth - totalTextWidth) / 2;

	const yPosition = canvasHeight - 20;  // Afastar 20px da borda inferior

	for (let i = 0; i < text.length; i++) {
		ctx.fillText(text[i], xPosition, yPosition);
		xPosition += ctx.measureText(text[i]).width + letterSpacing;  // Avançar a posição X, adicionando o espaçamento
	}
}

function drawDashedLine() {
	backgroundCtx.beginPath();
	backgroundCtx.setLineDash([20, 20]);  // Dash length and space between dashes
	backgroundCtx.moveTo(canvasWidth / 2, 0);  // Start at the top middle
	backgroundCtx.lineTo(canvasWidth / 2, canvasHeight);  // Draw to the bottom middle
	backgroundCtx.strokeStyle = "#fff";  // White color for the line
	backgroundCtx.lineWidth = 10;  // Line width
	backgroundCtx.stroke();  // Render the line
	backgroundCtx.setLineDash([]);  // Reset the dash settings
}

// function drawScores() {
// 	backgroundCtx.clearRect(0, 0, canvasWidth, canvasHeight);

// 	drawDashedLine();

// 	const digitWidth = 3 * (20 + 0); // 3 segmentos + 0 margens
// 	const digitHeight = 5 * (20 + 0);
// 	const scoreSpacing = 10;

// 	const player1X = canvasWidth / 2 - digitWidth - scoreSpacing - (digitWidth / 3);
// 	const player2X = canvasWidth / 2 + scoreSpacing + (digitWidth / 3);

// 	drawDigit(backgroundCtx, player1Score, player1X, 30); // Pontuação do Jogador 1
// 	drawDigit(backgroundCtx, player2Score, player2X, 30); // Pontuação do Jogador 2
// }

function drawScores() {
    // Definição do tamanho dos dígitos e espaçamento
    const digitWidth = 3 * (20 + 0); // 3 segmentos + 0 margens
    const digitHeight = 5 * (20 + 0); // 5 segmentos de altura
    const scoreSpacing = 10;
    
    // Posições dos jogadores no canvas
    const player1X = canvasWidth / 2 - digitWidth - scoreSpacing - (digitWidth / 3);
    const player2X = canvasWidth / 2 + scoreSpacing + (digitWidth / 3);
    const scoreY = 30; // Altura onde as pontuações são desenhadas

    // Limpar apenas a área ao redor das pontuações de cada jogador
    const clearPadding = 2; // Extra para garantir que tudo ao redor seja limpo

    // Limpar pontuação do Jogador 1
    backgroundCtx.clearRect(
        player1X - clearPadding,       // X inicial, com padding
        scoreY - clearPadding,         // Y inicial, com padding
        digitWidth + clearPadding * 2, // Largura com padding extra
        digitHeight + clearPadding * 2 // Altura com padding extra
    );

    // Limpar pontuação do Jogador 2
    backgroundCtx.clearRect(
        player2X - clearPadding,       // X inicial, com padding
        scoreY - clearPadding,         // Y inicial, com padding
        digitWidth + clearPadding * 2, // Largura com padding extra
        digitHeight + clearPadding * 2 // Altura com padding extra
    );

    // Desenhar linha tracejada central
    drawDashedLine();

    // Redesenhar os dígitos das pontuações
    drawDigit(backgroundCtx, player1Score, player1X, scoreY); // Pontuação do Jogador 1
    drawDigit(backgroundCtx, player2Score, player2X, scoreY); // Pontuação do Jogador 2
}

function drawRect(x, y, width, height, color, ctx) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, width, height);
}

// function drawBall() {
// 	drawRect(ballX, ballY, ballSize, ballSize, "#fff", ctx);
// }

// function drawPaddles() {
// 	drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#fff", ctx);
// 	drawRect(canvasWidth - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "#fff", ctx);
// }

// function drawGame() {
// 	ctx.clearRect(0, 0, canvas.width, canvas.height);

// 	drawScores();
// 	drawPONG();
// 	drawPlayerNames();
// 	drawPaddles();
// 	drawBall();
// }

function drawGame() {
    // Definir um extra padding para limpar ao redor da bola e dos paddles
    const extraPadding = 2;
    const paddleOffset = 5; // Deslocamento dos paddles para o interior do canvas

    // Limpar a posição anterior da bola, adicionando 2 pixels de cada lado
    ctx.clearRect(previousBallX - extraPadding, previousBallY - extraPadding, ballSize + extraPadding * 2, ballSize + extraPadding * 2);
    
    // Limpar a posição anterior do paddle esquerdo, levando em consideração o offset de 5 pixels
    ctx.clearRect(
        paddleOffset - extraPadding,          // X inicial (considerando o deslocamento)
        previousLeftPaddleY - extraPadding,   // Y inicial, com padding
        paddleWidth + extraPadding * 2,       // Largura do paddle com padding extra
        paddleHeight + extraPadding * 2       // Altura do paddle com padding extra
    );

    // Limpar a posição anterior do paddle direito, levando em consideração o offset de 5 pixels
    ctx.clearRect(
        canvasWidth - paddleWidth - paddleOffset - extraPadding, // X inicial, com padding e offset
        previousRightPaddleY - extraPadding,      // Y inicial, com padding
        paddleWidth + extraPadding * 2,           // Largura do paddle com padding extra
        paddleHeight + extraPadding * 2           // Altura do paddle com padding extra
    );

    // Desenhar os paddles e a bola nas novas posições
    drawPaddles();
    drawBall();
    drawScores();

    // Atualizar as posições anteriores
    previousBallX = ballX;
    previousBallY = ballY;
    previousLeftPaddleY = leftPaddleY;
    previousRightPaddleY = rightPaddleY;
}


// function drawPaddles() {
//     // Desenha o paddle esquerdo
//     drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#fff", ctx);
    
//     // Desenha o paddle direito
//     drawRect(canvasWidth - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "#fff", ctx);
// }

function drawPaddles() {
    const paddleOffset = 5; // Distância das extremidades laterais

    // Paddle esquerdo: posicionado 5px para dentro a partir da borda esquerda
    ctx.fillRect(paddleOffset, leftPaddleY, paddleWidth, paddleHeight);

    // Paddle direito: posicionado 5px para dentro a partir da borda direita
    ctx.fillRect(canvasWidth - paddleWidth - paddleOffset, rightPaddleY, paddleWidth, paddleHeight);
}

function drawBall() {
    // Desenha a bola
    drawRect(ballX, ballY, ballSize, ballSize, "#fff", ctx);
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
	if ((matchSocket && window.location.pathname !== `/user/${selfUsername}/pong-game-remote` && !stopFlag)
		|| (!matchSocket && window.location.pathname !== `/user/${selfUsername}/pong-playing` && !stopFlag)) {

		if (document.getElementById('invitePending')) {
			document.getElementById('invitePending').remove();
		}

		if (pong_socket.readyState === WebSocket.OPEN) {
			pong_socket.close();
			console.log('Pong Socket Closed on gameLoop');
		}

		stopFlag = true;
		return;
	}

	if (stopFlag == true)
		return;

	drawGame(ballPosition, paddlePositions);
	requestAnimationFrame(gameLoop);
}

function countdownDisplay(time) {
	console.log('time: ', time);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.font = '48px Arial';
	ctx.fillStyle = 'white';
	ctx.textAlign = 'center';
	ctx.fillText(time.toString(), canvas.width / 2, canvas.height / 2);
}

function startGame() {
	gameLoop();
}

function showEndScreen(score) {
	if (!ctx) {
		const canvas = document.getElementById('pongCanvas');
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

	setTimeout(() => {
		if (document.getElementById('invitePending'))
			document.getElementById('invitePending').remove();
		navigateTo(`/user/${selfUsername}/pong`);
	}, 3000);

}

export { joinPongRoom };