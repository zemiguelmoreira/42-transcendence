import { navigateTo } from "../app.js";
import { getUserProfileByUsername } from "../profile/myprofile.js";

const paddleWidth = 10;
const paddleHeight = 90;
const ballSize = 10;

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
let dataPlayer1 = null;
let dataPlayer2 = null;

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
			dataPlayer1 = await getUserProfileByUsername(data.player_names[0]);
			dataPlayer2 = await getUserProfileByUsername(data.player_names[1]);
			console.log('Player1:', dataPlayer1);
			console.log('Player2:', dataPlayer2);

			player1Name = data.player_names[0] === dataPlayer1.user.username ? dataPlayer1.profile.alias_name : dataPlayer2.profile.alias_name;
			player2Name = data.player_names[1] === dataPlayer1.user.username ? dataPlayer1.profile.alias_name : dataPlayer2.profile.alias_name;
			startGame();

		} else if (data.action === 'game_over' && !stopFlag) {
			stopFlag = true;

			const winner = data.winner === dataPlayer1.user.username ? dataPlayer1.profile.alias_name : dataPlayer2.profile.alias_name;
			const loser = data.loser === dataPlayer1.user.username ? dataPlayer1.profile.alias_name : dataPlayer2.profile.alias_name;
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

	}

	pong_socket.onopen = function () {
		pong_socket.send(JSON.stringify({
			action: 'join'
		}));
	};

	pong_socket.onclose = function (event) {
		console.log('Pong Socket Closed: onclose():', event);
	};
}

function sendMoveCommand(direction) {
	if (pong_socket && playerIndex !== null) {
		pong_socket.send(JSON.stringify({
			action: 'move',
			player_index: playerIndex,
			direction: direction
		}));
	}
}

function drawPlayerNames() {
	backgroundCtx.font = "30px PongFont";
	backgroundCtx.fillStyle = "gray";

	const centerLineX = canvasWidth / 2;
	const player1NameWidth = backgroundCtx.measureText(player1Name).width;
	const player1X = centerLineX - player1NameWidth - 20;

	backgroundCtx.textAlign = "left";

	const player2X = centerLineX + 20;
	const nameY = 170;

	backgroundCtx.fillText(player1Name, player1X, nameY);
	backgroundCtx.fillText(player2Name, player2X, nameY);
}

function drawDigit(ctx, n, x, y) {
	const segmentSize = 20;
	const segmentMargin = 0;
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

	ctx.fillStyle = "white";

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
	backgroundCtx.font = "100px PongFont";
	backgroundCtx.fillStyle = "#69696950";

	const text = "PONG";
	const totalTextWidth = backgroundCtx.measureText(text).width + (text.length - 1) * letterSpacing - 15;
	let xPosition = (canvasWidth - totalTextWidth) / 2;
	const yPosition = canvasHeight - 20;

	for (let i = 0; i < text.length; i++) {
		backgroundCtx.fillText(text[i], xPosition, yPosition);
		xPosition += backgroundCtx.measureText(text[i]).width + letterSpacing;
	}
}

function drawDashedLine() {
	backgroundCtx.beginPath();
	backgroundCtx.setLineDash([20, 20]);
	backgroundCtx.moveTo(canvasWidth / 2, 0);
	backgroundCtx.lineTo(canvasWidth / 2, canvasHeight);
	backgroundCtx.strokeStyle = "#fff";
	backgroundCtx.lineWidth = 10;
	backgroundCtx.stroke();
	backgroundCtx.setLineDash([]);
}

function drawScores() {
	const digitWidth = 3 * (20 + 0);
	const scoreSpacing = 10;
	const player1X = canvasWidth / 2 - digitWidth - scoreSpacing - (digitWidth / 3);
	const player2X = canvasWidth / 2 + scoreSpacing + (digitWidth / 3);

	backgroundCtx.clearRect(player1X, 30, digitWidth, 5 * 20);
	backgroundCtx.clearRect(player2X, 30, digitWidth, 5 * 20);

	drawDigit(backgroundCtx, player1Score, player1X, 30);
	drawDigit(backgroundCtx, player2Score, player2X, 30);
}

function clearRect(x, y, width, height, ctx) {
    ctx.clearRect(x, y, width, height);
}

function drawRect(x, y, width, height, color, ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawBall() {
    drawRect(ballX, ballY, ballSize, ballSize, "#fff", ctx);
}

function drawPaddles() {
    drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#fff", ctx);
    drawRect(canvasWidth - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "#fff", ctx);
}

function drawGame() {
	drawScores();
	drawDashedLine();
	drawPlayerNames();
	drawPONG();

    drawPaddles();
    drawBall();
}


function gameLoop() {

    if ((matchSocket && window.location.pathname !== `/user/${selfUsername}/pong-game-remote` && !stopFlag)
        || (!matchSocket && window.location.pathname !== `/user/${selfUsername}/chat-playing` && !stopFlag)) {
        
        const invitePending = document.getElementById('invitePending');
        if (invitePending) {
            invitePending.remove();
        }

        if (pong_socket.readyState === WebSocket.OPEN) {
            pong_socket.close();
            console.log('Pong Socket Closed on gameLoop');
        }
        
        stopFlag = true;
        return;
    }

    if (stopFlag) return;

    clearRect(0, 0, canvasWidth, canvasHeight, ctx);
    drawGame();
    requestAnimationFrame(gameLoop);
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

function startGame() {
	gameLoop();
}

function showEndScreen(score) {
	if (!ctx) {
		const canvas = document.getElementById('pongCanvas');
		ctx = canvas.getContext('2d');
	}

	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);

	const totalHeight = canvasHeight * 0.7;
	const partHeight = totalHeight / 4;

	const startY = (canvasHeight - totalHeight) / 2;

	ctx.textAlign = "center";
	ctx.fillStyle = "#fff";
	ctx.font = "50px CustomFont";
	ctx.fillText("WINNER", canvasWidth / 2, startY + partHeight);

	ctx.fillStyle = "red";
	ctx.fillText("WINNER", canvasWidth / 2 + 4, startY + partHeight + 4);

	ctx.fillStyle = "#fff";
	ctx.font = "40px CustomFont";
	ctx.fillText(`${score.winner}`, canvasWidth / 2, startY + partHeight + 60);

	ctx.fillStyle = "#fff";
	ctx.font = "50px CustomFont";
	ctx.fillText("LOSER", canvasWidth / 2, startY + partHeight * 3);

	ctx.fillStyle = "red";
	ctx.fillText("LOSER", canvasWidth / 2 + 4, startY + partHeight * 3 + 4);

	ctx.fillStyle = "#fff";
	ctx.font = "40px CustomFont";
	ctx.fillText(`${score.loser}`, canvasWidth / 2, startY + partHeight * 3 + 60);

	setTimeout(() => {
		if (document.getElementById('invitePending'))
			document.getElementById('invitePending').remove();
		navigateTo(`/user/${selfUsername}/pong`);
	}, 3000);

}

export { joinPongRoom };