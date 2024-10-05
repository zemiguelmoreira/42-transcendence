let lastTime = Date.now(); // Armazena o timestamp inicial
let frameCount = 0; // Contador de frames no segundo atual
let fps = 0; // Frames por segundo

function initializePongGameLocal(username, guest) {
	const backgroundCanvas = document.getElementById("pongBackgroundCanvas");
	const backgroundCtx = backgroundCanvas.getContext("2d");
	const canvas = document.getElementById("pongCanvas");
	const ctx = canvas.getContext("2d");
	const canvasWidth = document.getElementById("pongCanvas").width;
	const canvasHeight = document.getElementById("pongCanvas").height;
	const paddleWidth = 10;
	const paddleHeight = 90;
	const ballSize = 10;
	const winningScore = 10;
	let paddleSpeed = 15;
	let ballSpeedX = 6;
	let ballSpeedY = 6;
	let leftPaddleY = canvasHeight / 2 - paddleHeight / 2;
	let rightPaddleY = canvasHeight / 2 - paddleHeight / 2;
	let ballX = canvasWidth / 2 - ballSize / 2;
	let ballY = canvasHeight / 2 - ballSize / 2;
	let ballDirX = ballSpeedX;
	let ballDirY = ballSpeedY;
	let wPressed = false;
	let sPressed = false;
	let upPressed = false;
	let downPressed = false;
	let player1Score = 0;
	let player2Score = 0;
	// let leftPaddleSound = new Audio('../../files/pong-assets/ping.wav');
	// let rightPaddleSound = new Audio('../../files/pong-assets/pong.wav');
	// let wallSound = new Audio('../../files/pong-assets/wall.wav');
	let goalSound = new Audio('../../files/pong-assets/goal.wav');
	let player1Name = username;
	let player2Name = guest;
	let gameOver = false;

	function showEndScreen(winnerName) {
		const rectWidth = 400;
		const rectHeight = 200;
		const rectX = (canvasWidth - rectWidth) / 2;
		const rectY = (canvasHeight - rectHeight) / 2;
		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
		ctx.fillStyle = "#fff";
		ctx.font = "50px CustomFont";
		ctx.textAlign = "center";
		ctx.fillText(`WINNER: ${winnerName}`, canvasWidth / 2, canvasHeight / 2 + 20);
		setTimeout(() => {
			const closeGame = document.getElementById('runPong');
			closeGame.remove();
		}, 3000);
	}

	function drawPONG(letterSpacing = -5) {
		ctx.font = "100px PongFont";
		ctx.fillStyle = "#69696950";
		const text = "PONG";
		const totalTextWidth = ctx.measureText(text).width + (text.length - 1) * letterSpacing - 15;
		let xPosition = (canvasWidth - totalTextWidth) / 2;
		const yPosition = canvasHeight - 20;
		for (let i = 0; i < text.length; i++) {
			ctx.fillText(text[i], xPosition, yPosition);
			xPosition += ctx.measureText(text[i]).width + letterSpacing;
		}
	}

	function drawPlayerNames() {
		backgroundCtx.font = "20px CustomFont";
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
			[[1, 1, 1], [1, 0, 1], [1, 1, 1], [0, 0, 1], [0, 0, 1]]  // 9
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

	function drawScores() {
		backgroundCtx.clearRect(0, 0, canvasWidth, canvasHeight);
		drawDashedLine();
		const digitWidth = 3 * (20 + 0);
		const scoreSpacing = 10;
		const player1X = canvasWidth / 2 - digitWidth - scoreSpacing - (digitWidth / 3);
		const player2X = canvasWidth / 2 + scoreSpacing + (digitWidth / 3);
		drawDigit(backgroundCtx, player1Score, player1X, 30);
		drawDigit(backgroundCtx, player2Score, player2X, 30);
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

	function movePaddles() {
		if (wPressed && leftPaddleY > 0) {
			leftPaddleY -= paddleSpeed;
		}
		if (sPressed && leftPaddleY < canvasHeight - paddleHeight) {
			leftPaddleY += paddleSpeed;
		}
		if (upPressed && rightPaddleY > 0) {
			rightPaddleY -= paddleSpeed;
		}
		if (downPressed && rightPaddleY < canvasHeight - paddleHeight) {
			rightPaddleY += paddleSpeed;
		}
	}

	function moveBall() {
		ballX += ballDirX;
		ballY += ballDirY;
		if (ballY <= 0 || ballY + ballSize >= canvasHeight) {
			ballDirY *= -1;
			// wallSound.play();
		}
		if (ballX <= paddleWidth && ballY + ballSize >= leftPaddleY && ballY <= leftPaddleY + paddleHeight) {
			ballDirX *= -1;
			// leftPaddleSound.play();
		}
		if (ballX + ballSize >= canvasWidth - paddleWidth && ballY + ballSize >= rightPaddleY && ballY <= rightPaddleY + paddleHeight) {
			ballDirX *= -1;
			// rightPaddleSound.play();
		}
		if (ballX <= 0) {
			player2Score++;
			// goalSound.play();
			resetBall();
			if (player2Score >= winningScore) {
				endGame();
			}
		}
		if (ballX + ballSize >= canvasWidth) {
			player1Score++;
			// goalSound.play();
			resetBall();
			if (player1Score >= winningScore) {
				endGame();
			}
		}
	}

	function resetBall() {
		ballX = canvasWidth / 2 - ballSize / 2;
		ballY = canvasHeight / 2 - ballSize / 2;
		ballDirX = (Math.random() < 0.5 ? -1 : 1) * ballSpeedX;
		ballDirY = (Math.random() < 0.5 ? -1 : 1) * ballSpeedY;
	}

	async function endGame() {
		gameOver = true;
		let winner, loser, winnerScore, loserScore;
		if (player1Score > player2Score) {
			winner = player1Name;
			loser = player2Name;
			winnerScore = player1Score;
			loserScore = player2Score;
		} else {
			winner = player2Name;
			loser = player1Name;
			winnerScore = player2Score;
			loserScore = player1Score;
		}
		const gameType = 'pong';
		const timestamp = new Date().toISOString();
		try {
			const pong_accessToken = localStorage.getItem('access_token');
			const response = await fetch('/api/profile/update_match_history/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${pong_accessToken}`,
				},
				body: JSON.stringify({
					game_type: gameType,
					winner: winner,
					loser: loser,
					winner_score: winnerScore,
					loser_score: loserScore,
					timestamp: timestamp,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				console.log('Error:', data.error || 'Failed to update match history');
			}
		} catch (error) {
			console.error('Error during match history update:', error.message);
		}
		showEndScreen(winner);
	}

	function updateGame() {
		const currentTime = Date.now(); // Tempo atual em milissegundos
		frameCount++; // Incrementa o contador de frames
	
		// Calcula o tempo decorrido desde o último segundo
		const deltaTime = currentTime - lastTime;
	
		if (deltaTime >= 1000) {
			// Um segundo passou, podemos calcular o FPS
			fps = frameCount;
			frameCount = 0; // Reseta a contagem de frames
			lastTime = currentTime; // Atualiza o último timestamp para o novo segundo
	
			// Exibe o FPS calculado no console ou na tela
			console.log(`FPS: ${fps}`);
		}
		if (gameOver) {
			return;
		}
		if (window.location.pathname !== `/user/${username}/pong-game-local`) {
			document.getElementById('runPong').remove();
			return;
		}
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		drawScores();
		drawPONG();
		drawPlayerNames();
		movePaddles();
		moveBall();
		drawPaddles();
		drawBall();
		requestAnimationFrame(updateGame);
	}

	document.addEventListener("keydown", function (e) {
		if (e.key === "w") {
			wPressed = true;
		} else if (e.key === "s") {
			sPressed = true;
		} else if (e.key === "ArrowUp") {
			upPressed = true;
		} else if (e.key === "ArrowDown") {
			downPressed = true;
		}
	});

	document.addEventListener("keyup", function (e) {
		if (e.key === "w") {
			wPressed = false;
		} else if (e.key === "s") {
			sPressed = false;
		} else if (e.key === "ArrowUp") {
			upPressed = false;
		} else if (e.key === "ArrowDown") {
			downPressed = false;
		}
	});

	updateGame();
}

export { initializePongGameLocal }