async function runPongMatch(player1Name, player2Name, username) {

	return new Promise((resolve) => {
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
		let ballSpeedX = 9;
		let ballSpeedY = 8;
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
		let lastScore1 = 0;
		let lastScore2 = 0;
		let gameOver = false;
		
		
		let lastFpsUpdateTime = performance.now();  // Inicializa com o valor atual
		let frameCount = 0;
		let fps = 0;
		
		function updateFPS() {
			frameCount++;
			const currentTime = performance.now();  // Obtém o tempo atual
			const deltaTime = currentTime - lastFpsUpdateTime;
		
			if (deltaTime >= 1000) {  // Atualiza a cada segundo
				fps = frameCount;
				frameCount = 0;
				lastFpsUpdateTime = currentTime;
			}
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
		
		// Desenhado no backgroundCanvas
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
			const digitWidth = 3 * (20 + 0);
			const scoreSpacing = 10;
			const player1X = canvasWidth / 2 - digitWidth - scoreSpacing - (digitWidth / 3);
			const player2X = canvasWidth / 2 + scoreSpacing + (digitWidth / 3);
		
			backgroundCtx.clearRect(player1X, 30, digitWidth, 5 * 20);
			backgroundCtx.clearRect(player2X, 30, digitWidth, 5 * 20);
		
			drawDigit(backgroundCtx, player1Score, player1X, 30);
			drawDigit(backgroundCtx, player2Score, player2X, 30);

			lastScore1 = player1Score;
			lastScore2 = player2Score;
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

		// Desenhado no backgroundCanvas
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
			}
			if (ballX <= paddleWidth && ballY + ballSize >= leftPaddleY && ballY <= leftPaddleY + paddleHeight) {
				ballDirX *= -1;
			}
			if (ballX + ballSize >= canvasWidth - paddleWidth && ballY + ballSize >= rightPaddleY && ballY <= rightPaddleY + paddleHeight) {
				ballDirX *= -1;
			}
			if (ballX <= 0) {
				player2Score++;
				resetBall();
				if (player2Score >= winningScore) {
					endGame();
				}
			}
			if (ballX + ballSize >= canvasWidth) {
				player1Score++;
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
			await showEndScreen(winner);
			resolve(winner);
		}

		drawScores();
		drawDashedLine();
		drawPlayerNames();
		drawPONG();	

		function updateGame() {
			updateFPS(); 
			console.log(fps);

			ctx.clearRect(0, 0, canvasWidth, canvasHeight);

			if (gameOver) {
				return;
			}
			if (window.location.pathname !== `/user/${username}/pong-game-tournament`) {
				resolve(null);
				return;
			}
			
			if (player1Score !== lastScore1 || player2Score !== lastScore2) {
				drawScores();
			}

			movePaddles();
			moveBall();
			drawPaddles();
			drawBall();

			drawDashedLine();
			drawPlayerNames();
			drawPONG();	
			
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
			return new Promise((resolve) => {
				setTimeout(() => {
					const closeGame = document.getElementById('runPong');
					if (closeGame) {
						closeGame.remove();
					}
					resolve();
				}, 3000);
			});
		}

		updateGame();

	});
}

export { runPongMatch };